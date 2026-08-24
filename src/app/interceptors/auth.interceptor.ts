import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  catchError,
  switchMap,
  throwError
} from 'rxjs';

import {
  AuthService
} from '../services/auth.service';


// ============================================================
// AUTH INTERCEPTOR
// ============================================================

export const authInterceptor: HttpInterceptorFn = (
  req,
  next
) => {


  // ==========================================================
  // AUTH SERVICE
  // ==========================================================

  const authService =
    inject(AuthService);


  // ==========================================================
  // CHECK REFRESH REQUEST
  // ==========================================================

  /*
   * Backend:
   *
   * [Route("api/[controller]")]
   *
   * [HttpPost("refresh")]
   *
   * Therefore:
   *
   * /api/users/refresh
   */

  const isRefreshRequest =
    req.url.toLowerCase()
      .includes('/users/refresh');


  // ==========================================================
  // GET ACCESS TOKEN
  // ==========================================================

  const token =
    authService.getToken();


  // ==========================================================
  // ADD TOKEN
  // ==========================================================

  let request = req;


  /*
   * Never attach the old access token to
   * the refresh request.
   */

  if (
    token &&
    !isRefreshRequest
  ) {

    request =
      req.clone({

        setHeaders: {

          Authorization:
            `Bearer ${token}`

        }

      });

  }


  // ==========================================================
  // SEND REQUEST
  // ==========================================================

  return next(request).pipe(

    catchError(
      (
        error: HttpErrorResponse
      ) => {


        console.error(
          'HTTP ERROR:',
          request.url,
          error.status
        );


        // ====================================================
        // NOT UNAUTHORIZED
        // ====================================================

        if (
          error.status !== 401
        ) {

          return throwError(
            () => error
          );

        }


        // ====================================================
        // REFRESH REQUEST FAILED
        // ====================================================

        if (
          isRefreshRequest
        ) {

          /*
           * DO NOT call refreshToken() again.
           *
           * Otherwise:
           *
           * refresh
           * -> 401
           * -> refresh
           * -> 401
           * -> infinite loop
           */

          authService.logout();


          return throwError(
            () => error
          );

        }


        // ====================================================
        // NO REFRESH TOKEN
        // ====================================================

        const refreshToken =
          authService.getRefreshToken();


        if (
          !refreshToken
        ) {

          console.warn(
            'No refresh token available.'
          );


          authService.logout();


          return throwError(
            () => error
          );

        }


        // ====================================================
        // REFRESH ACCESS TOKEN
        // ====================================================

        return authService
          .refreshToken()
          .pipe(

            // ==================================================
            // REFRESH SUCCESS
            // ==================================================

            switchMap(
              (
                response
              ) => {


                /*
                 * AuthService already saved
                 * the new token.
                 *
                 * Get it again from storage.
                 */

                const newToken =
                  authService.getToken();


                // ==============================================
                // NO NEW TOKEN
                // ==============================================

                if (
                  !newToken
                ) {

                  authService.logout();


                  return throwError(
                    () =>
                      new Error(
                        'Token refresh succeeded but no access token was found.'
                      )
                  );

                }


                console.log(
                  'Retrying request with new access token:',
                  request.url
                );


                // ==============================================
                // RETRY ORIGINAL REQUEST
                // ==============================================

                const retryRequest =
                  request.clone({

                    setHeaders: {

                      Authorization:
                        `Bearer ${newToken}`

                    }

                  });


                return next(
                  retryRequest
                );

              }
            ),


            // ==================================================
            // REFRESH FAILED
            // ==================================================

            catchError(
              refreshError => {

                /*
                 * AuthService already handles logout
                 * when refresh fails.
                 */

                console.error(
                  'Unable to refresh token:',
                  refreshError
                );


                return throwError(
                  () => refreshError
                );

              }

            )

          );

      }

    )

  );

};