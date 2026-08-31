import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  BreakpointObserver,
  Breakpoints
} from '@angular/cdk/layout';

import {
  CommonModule
} from '@angular/common';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatListModule
} from '@angular/material/list';

import {
  MatSidenavModule
} from '@angular/material/sidenav';

import {
  MatToolbarModule
} from '@angular/material/toolbar';

import {
  RouterModule
} from '@angular/router';

import {
  map
} from 'rxjs';

import {
  CartService
} from '../../services/cart.service';

import {
  AuthService
} from '../../services/auth.service';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';


@Component({
  selector: 'app-base-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    TranslatePipe
  ],

  templateUrl: './base-layout.html',

  styleUrl: './base-layout.scss'
})
export class BaseLayout {

  /* =========================================================
     SERVICES
     ========================================================= */

  private readonly breakpointObserver =
    inject(BreakpointObserver);

  readonly cartService =
    inject(CartService);

  readonly authService =
    inject(AuthService);

  private readonly translate =
    inject(TranslateService);


  /* =========================================================
     STATE
     ========================================================= */

  protected readonly title =
    signal('Cosmetics');

  readonly isLoggedIn =
    this.authService.isLoggedIn;

  readonly currentLanguage =
    signal<'en' | 'ar'>('en');


  readonly isMobile =
    toSignal(
      this.breakpointObserver
        .observe([Breakpoints.Handset])
        .pipe(
          map(result => result.matches)
        ),
      {
        initialValue: false
      }
    );


  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor() {

    const savedLanguage =
      localStorage.getItem('language');

    const language: 'en' | 'ar' =
      savedLanguage === 'ar'
        ? 'ar'
        : 'en';


    this.currentLanguage.set(language);

    this.translate.use(language);

    this.setDocumentLanguage(language);
  }


  /* =========================================================
     LANGUAGE
     ========================================================= */

  toggleLanguage(): void {

    const language: 'en' | 'ar' =
      this.currentLanguage() === 'en'
        ? 'ar'
        : 'en';


    /*
     * Update signal first.
     *
     * The [dir] binding on the template will immediately
     * update the sidenav container.
     */
    this.currentLanguage.set(language);


    /*
     * Change translations.
     */
    this.translate.use(language);


    /*
     * Save language.
     */
    localStorage.setItem(
      'language',
      language
    );


    /*
     * Update document language.
     */
    this.setDocumentLanguage(language);
  }


  /* =========================================================
     DOCUMENT LANGUAGE
     ========================================================= */

  private setDocumentLanguage(
    language: 'en' | 'ar'
  ): void {

    document.documentElement.lang =
      language;

    document.documentElement.dir =
      language === 'ar'
        ? 'rtl'
        : 'ltr';
  }


  /* =========================================================
     MOBILE DRAWER
     ========================================================= */

  closeMobileDrawer(drawer: any): void {

    if (this.isMobile()) {

      drawer.close();

    }
  }


  /* =========================================================
     LOGOUT
     ========================================================= */

  logout(drawer: any): void {

    this.authService.logout();

    if (this.isMobile()) {

      drawer.close();

    }
  }

}