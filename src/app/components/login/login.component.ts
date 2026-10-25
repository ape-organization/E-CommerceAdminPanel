import { Component, computed, inject, signal } from '@angular/core';
import {  FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { BidiModule } from '@angular/cdk/bidi';
import { SharedModule } from '../../shared/shared.module';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
   SharedModule,
   TranslatePipe,
   BidiModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /*
   * Material form fields read their direction from the [dir]
   * directive (Directionality), not from <html dir>. The admin
   * pages get it from base-layout; the login page needs its own.
   */
  private languageService = inject(LanguageService);

  readonly direction = computed(() =>
    this.languageService.currentLanguage() === 'ar' ? 'rtl' : 'ltr'
  );

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
             this.errorMessage.set('login.errors.invalidCredentials');
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
          this.errorMessage.set('login.errors.adminRequired');
          this.authService.logout();
        } 
        this.isLoading.set(false);
       },
      error: (err) => {
        this.errorMessage.set('login.errors.failed');
        this.isLoading.set(false);
      } 
    });
  }
}
