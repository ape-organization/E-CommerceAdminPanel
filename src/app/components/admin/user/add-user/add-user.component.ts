import {
  Component,
  Inject,
  OnInit,
  inject,
  signal
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


  // signal so the zoneless app re-renders when the request fails
  readonly errorMessage = signal('');


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

    /*
     * getRawValue() also includes the disabled "role" control
     * (.value silently drops disabled controls).
     */

    const formValue =
      this.userForm.getRawValue();


    /*
     * When editing, the password field is not shown -
     * never send an empty password to the backend.
     */

    if (this.editUser) {
      delete formValue.password;
    }


    const userData = {
      ...this.editUser,
      ...formValue
    };


    this.errorMessage.set('');


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

        /*
         * updateUser returns no body (void), so only treat an
         * empty response as a failure when adding.
         */

        if (this.data.add && !response) {

          this.errorMessage.set(
            'common.somethingWentWrong'
          );

          return;
        }


        this.dialogRef.close({
          status: true
        });
      },


      error: () => {
        this.errorMessage.set(
          'common.somethingWentWrong'
        );
      }

    });
  }


  onCancel(): void {

    this.dialogRef.close({
      status: false
    });
  }
}