import { Component, inject, signal } from '@angular/core';
import {  FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
   SharedModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
var data=
{
  Email:this.loginForm.value.email,
  Password:this.loginForm.value.password
}
     this.authService.login(data).subscribe({
      next: (res) => {
        if(!res.isAuthSuccessful)
          {
             this.errorMessage.set('Invalid email or password');
        this.isLoading.set(false);
        return
          } 
        const token = this.authService.getToken();
        const role = this.authService.getUserRole();
        const isAdmin = this.authService.isAdmin();
        
        if (isAdmin) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
          this.router.navigate([returnUrl]);
         } else {
          this.errorMessage.set('Access denied. Admin role required.');
          this.authService.logout();
        } 
        this.isLoading.set(false);
       },
      error: (err) => {
        this.errorMessage.set('Invalid authentication');
        this.isLoading.set(false);
      } 
    });
  }
}
