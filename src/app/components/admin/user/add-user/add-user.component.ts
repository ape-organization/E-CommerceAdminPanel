import {
  Component,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { SharedModule } from '../../../../shared/shared.module';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';


interface AddUserDialogData {
  add: boolean;
  user?: User;
}


@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  userForm!: FormGroup;

  editUser: User | null = null;

  hidePassword = true;

  errorMessage = '';


  constructor(
    private readonly dialogRef: MatDialogRef<AddUserComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: AddUserDialogData
  ) {}


  ngOnInit(): void {

    this.editUser = this.data.user ?? null;

    this.userForm = this.fb.group({
      name: [
        this.editUser?.name ?? '',
        Validators.required
      ],

      email: [
        this.editUser?.email ?? '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        this.editUser
          ? []
          : [
              Validators.required,
              Validators.minLength(6)
            ]
      ],

      role: [
        this.editUser?.role ?? 'Admin',
        this.editUser
          ? []
          : Validators.required
      ]
    });
  }


  onSubmit(): void {

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const userData = {
      ...this.editUser,
      ...this.userForm.value
    };

    const request = this.data.add
      ? this.userService.addUser(userData)
      : this.userService.updateUser(
          userData.id,
          userData
        );

    request.subscribe({
      next: response => {

        if (!response) {
          this.errorMessage = 'Something went wrong.';
          return;
        }

        this.dialogRef.close({
          status: true
        });
      },

      error: error => {

        console.error(
          'User operation failed:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          'Something went wrong.';
      }
    });
  }


  onCancel(): void {

    this.dialogRef.close({
      status: false
    });
  }
}