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
  LanguageService
} from '../../services/language.service';

import {
  TranslatePipe
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

  private readonly languageService =
    inject(LanguageService);


  /* =========================================================
     STATE
     ========================================================= */

  protected readonly title =
    signal('common.cosmetics');

  readonly isLoggedIn =
    this.authService.isLoggedIn;

  /*
   * Single source of truth for the language, shared with the
   * dashboard, brand pages, etc. (LanguageService).
   */
  readonly currentLanguage =
    this.languageService.currentLanguage;


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
     LANGUAGE
     ========================================================= */

  toggleLanguage(): void {

    /*
     * LanguageService updates the signal, translations,
     * localStorage and the <html> lang/dir attributes.
     */
    this.languageService.toggleLanguage();
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