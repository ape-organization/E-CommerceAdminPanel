import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap,
  BehaviorSubject,
  catchError,
  throwError,
  finalize,
  shareReplay
} from 'rxjs';

import {
  Router
} from '@angular/router';

import {
  environment
} from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {


  // ============================================================
  // SERVICES
  // ============================================================

  private readonly http =
    inject(HttpClient);

  private readonly router =
    inject(Router);


  // ============================================================
  // API URL
  // ============================================================

  private readonly apiUrl =
    environment.apiBaseUrl + '/users';


  // ============================================================
  // LOCAL STORAGE KEYS
  // ============================================================

  private readonly tokenKey =
    'pharmacy_token';

  private readonly refreshTokenKey =
    'pharmacy_refresh_token';


  // ============================================================
  // LOGIN STATE
  // ============================================================

  isLoggedIn =
    signal<boolean>(
      this.hasToken()
    );


  // ============================================================
  // REFRESH STATE
  // ============================================================

  private readonly isRefreshingToken$ =
    new BehaviorSubject<boolean>(false);


  /*
   * IMPORTANT
   *
   * This stores the current refresh request.
   *
   * If 10 API requests receive 401 at the same time,
   * only ONE /refresh request will be sent.
   *
   * The other 9 requests will wait for this Observable.
   */

  private refreshRequest$:
    Observable<any> | null = null;


  // ============================================================
  // CHECK IF TOKEN EXISTS
  // ============================================================

  private hasToken(): boolean {

    return !!localStorage.getItem(
      this.tokenKey
    );

  }


  // ============================================================
  // LOGIN
  // ============================================================

  login(
    credentials: any
  ): Observable<any> {

    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(

        tap(response => {

          console.log(
            'LOGIN RESPONSE:',
            response
          );


          // ====================================================
          // LOGIN FAILED
          // ====================================================

          if (
            response?.isAuthSuccessful === false
          ) {

            this.isLoggedIn.set(
              false
            );

            return;

          }


          // ====================================================
          // GET TOKENS
          // ====================================================

          const accessToken =
            response?.token ??
            response?.Token;

          const refreshToken =
            response?.refreshToken ??
            response?.RefreshToken;


          // ====================================================
          // SAVE ACCESS TOKEN
          // ====================================================

          if (accessToken) {

            localStorage.setItem(
              this.tokenKey,
              accessToken
            );

          }


          // ====================================================
          // SAVE REFRESH TOKEN
          // ====================================================

          if (refreshToken) {

            localStorage.setItem(
              this.refreshTokenKey,
              refreshToken
            );

          }


          // ====================================================
          // UPDATE LOGIN STATE
          // ====================================================

          if (
            accessToken &&
            refreshToken
          ) {

            this.isLoggedIn.set(
              true
            );

          }

        })

      );

  }


  // ============================================================
  // SAVE TOKENS
  // ============================================================

  setTokens(
    accessToken: string,
    refreshToken?: string
  ): void {

    if (!accessToken) {

      return;

    }


    localStorage.setItem(
      this.tokenKey,
      accessToken
    );


    if (refreshToken) {

      localStorage.setItem(
        this.refreshTokenKey,
        refreshToken
      );

    }


    this.isLoggedIn.set(
      true
    );

  }


  // ============================================================
  // LOGOUT
  // ============================================================

  logout(): void {

    console.log(
      'Logging out...'
    );


    // ==========================================================
    // CLEAR TOKENS
    // ==========================================================

    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      this.refreshTokenKey
    );


    // ==========================================================
    // UPDATE STATE
    // ==========================================================

    this.isLoggedIn.set(
      false
    );


    // ==========================================================
    // RESET REFRESH STATE
    // ==========================================================

    this.refreshRequest$ = null;

    this.isRefreshingToken$.next(
      false
    );


    // ==========================================================
    // GO LOGIN
    // ==========================================================

    if (
      !this.router.url.includes(
        '/login'
      )
    ) {

      this.router.navigate(
        ['/login']
      );

    }

  }


  // ============================================================
  // GET ACCESS TOKEN
  // ============================================================

  getToken(): string | null {

    return localStorage.getItem(
      this.tokenKey
    );

  }


  // ============================================================
  // GET REFRESH TOKEN
  // ============================================================

  getRefreshToken(): string | null {

    return localStorage.getItem(
      this.refreshTokenKey
    );

  }


  // ============================================================
  // REFRESH ACCESS TOKEN
  // ============================================================

  refreshToken(): Observable<any> {


    /*
     * IMPORTANT:
     *
     * If refresh is already running,
     * return the same Observable.
     */

    if (
      this.refreshRequest$
    ) {

      return this.refreshRequest$;

    }


    // ==========================================================
    // GET CURRENT TOKENS
    // ==========================================================

    const accessToken =
      this.getToken();

    const refreshToken =
      this.getRefreshToken();


    // ==========================================================
    // NO TOKENS
    // ==========================================================

    if (
      !accessToken ||
      !refreshToken
    ) {

      this.logout();

      return throwError(
        () =>
          new Error(
            'No tokens available'
          )
      );

    }


    // ==========================================================
    // REFRESH START
    // ==========================================================

    this.isRefreshingToken$.next(
      true
    );


    console.log(
      'Refreshing access token...'
    );


    // ==========================================================
    // REFRESH REQUEST
    // ==========================================================

    this.refreshRequest$ =
      this.http
        .post<any>(
          `${this.apiUrl}/refresh`,
          {
            accessToken:
              accessToken,

            refreshToken:
              refreshToken
          }
        )
        .pipe(


          // ====================================================
          // SUCCESS
          // ====================================================

          tap(response => {

            console.log(
              'REFRESH RESPONSE:',
              response
            );


            /*
             * Backend returns:
             *
             * {
             *   Token: "...",
             *   RefreshToken: "..."
             * }
             *
             * Support both casing styles.
             */

            const newAccessToken =
              response?.token ??
              response?.Token ??
              response?.accessToken;


            const newRefreshToken =
              response?.refreshToken ??
              response?.RefreshToken;


            // ==================================================
            // INVALID RESPONSE
            // ==================================================

            if (
              !newAccessToken
            ) {

              throw new Error(
                'Refresh response did not contain a token'
              );

            }


            // ==================================================
            // SAVE NEW TOKENS
            // ==================================================

            this.setTokens(
              newAccessToken,
              newRefreshToken
            );

          }),


          // ====================================================
          // ERROR
          // ====================================================

          catchError(error => {

            console.error(
              'TOKEN REFRESH FAILED:',
              error
            );


            /*
             * Refresh failed.
             *
             * This means the refresh token is invalid
             * or expired, so the user really needs to
             * login again.
             */

            this.logout();


            return throwError(
              () => error
            );

          }),


          // ====================================================
          // ALWAYS
          // ====================================================

          finalize(() => {

            this.isRefreshingToken$.next(
              false
            );

            this.refreshRequest$ =
              null;

          }),


          // ====================================================
          // SHARE REQUEST
          // ====================================================

          shareReplay({
            bufferSize: 1,
            refCount: false
          })

        );


    return this.refreshRequest$;

  }


  // ============================================================
  // REFRESHING?
  // ============================================================

  isRefreshingToken(): boolean {

    return this
      .isRefreshingToken$
      .value;

  }


  // ============================================================
  // GET USER ROLE
  // ============================================================

  getUserRole(): string | null {

    const token =
      this.getToken();


    if (!token) {

      return null;

    }


    try {

      const parts =
        token.split('.');


      if (
        parts.length !== 3
      ) {

        return null;

      }


      /*
       * JWT uses Base64URL.
       */

      const base64Url =
        parts[1];

      const base64 =
        base64Url
          .replace(/-/g, '+')
          .replace(/_/g, '/');


      const jsonPayload =
        decodeURIComponent(
          atob(base64)
            .split('')
            .map(
              char =>
                '%' +
                (
                  '00' +
                  char
                    .charCodeAt(0)
                    .toString(16)
                ).slice(-2)
            )
            .join('')
        );


      const payload =
        JSON.parse(
          jsonPayload
        );


      return (
        payload.role ??
        payload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ??
        payload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
        ] ??
        null
      );

    }
    catch (error) {

      console.error(
        'Unable to read JWT:',
        error
      );

      return null;

    }

  }


  // ============================================================
  // IS ADMIN
  // ============================================================

  isAdmin(): boolean {

    const role =
      this.getUserRole();


    return (
      role === 'admin' ||
      role === 'Admin'
    );

  }

}