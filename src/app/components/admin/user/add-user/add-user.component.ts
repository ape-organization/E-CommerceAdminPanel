import {
  Component,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  UserService
} from '../../../../services/user.service';

import {
  User
} from '../../../../models/user.model';

import {
  TranslatePipe
} from '@ngx-translate/core';


interface AddUserDialogData {
  add: boolean;
  user?: User;
}


@Component({
  selector: 'app-add-user',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],

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
    private readonly dialogRef:
      MatDialogRef<AddUserComponent>,

    @Inject(MAT_DIALOG_DATA)
    public readonly data: AddUserDialogData
  ) {}


  ngOnInit(): void {

    /*
     * =========================================
     * Existing user when editing
     * =========================================
     */

    this.editUser =
      this.data.user ?? null;


    /*
     * =========================================
     * Form
     * =========================================
     */

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
  {
    value: this.editUser?.role ?? 'Admin',
    disabled: true
  }
]

    });
  }


  onSubmit(): void {

    /*
     * =========================================
     * Validate
     * =========================================
     */

    if (this.userForm.invalid) {

      this.userForm.markAllAsTouched();

      return;
    }


    /*
     * =========================================
     * Build request
     * =========================================
     */

    const userData = {
      ...this.editUser,
      ...this.userForm.value
    };


    /*
     * =========================================
     * Add / Update
     * =========================================
     */

    const request = this.data.add

      ? this.userService.addUser(userData)

      : this.userService.updateUser(
          userData.id,
          userData
        );


    /*
     * =========================================
     * Request
     * =========================================
     */

    request.subscribe({

      next: response => {

        if (!response) {

          this.errorMessage =
            'Something went wrong.';

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