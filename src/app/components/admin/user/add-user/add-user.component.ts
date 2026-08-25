import { Component, EventEmitter, Input, Output, inject, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User } from '../../../../models/user.model';
import { SharedModule } from '../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../../services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
 SharedModule
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

 

  roles: string[] = ['Admin', 'Client'];
  hidePassword = true;
editUser:any=null
showError=false;
errorMessage: string | null = null;
userForm!: FormGroup;
  constructor(
    private dialogRef:MatDialogRef<AddUserComponent>,
   @Inject(MAT_DIALOG_DATA) public data: any,
   private cdr: ChangeDetectorRef
  ) {
   
  }

 ngOnInit() {
  const isEdit = !!this.data.user; // true if editing
 this.editUser = this.data.user || null;
  this.userForm = this.fb.group({
    name: [isEdit ? this.data.user.name : '', Validators.required],
    email: [isEdit ? this.data.user.email : '', [Validators.required, Validators.email]],
    password: [
      '',
      isEdit ? [] : [Validators.required, Validators.minLength(6)]
    ],
    role: [
      isEdit ? this.data.user.role : 'Admin',
      isEdit ? [] : [Validators.required]
    ]
  });
}



async onSubmit() {
  if (this.userForm.invalid) return;

  const userData = { ...this.editUser, ...this.userForm.value };

  try {
    const request = this.data.add
      ? this.userService.addUser(userData)
      : this.userService.updateUser(userData.id, userData);


    const res = await firstValueFrom(request);
    if (!res) {
     this.errorMessage = 'Something went wrong';
     this.cdr.detectChanges();
        return;
    }

    this.dialogRef.close({ status: true });

  } catch (err) {
   this.errorMessage = 'Something went wrong';
   this.cdr.detectChanges();
        return;
  }
}


  onCancel() {
   this.dialogRef.close({status:false})
  }
}
