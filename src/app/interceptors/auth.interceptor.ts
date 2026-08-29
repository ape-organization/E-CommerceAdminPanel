import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpContextToken,
  HttpRequest
} from '@angular/common/http';

import {
  inject,
  signal
} from '@angular/core';

import {
  Observable,
  of,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
  tap
} from 'rxjs';

import {
  AuthService
} from '../services/auth.service';


// ============================================================
// CACHE CONFIGURATION
// ============================================================

export const CACHE_REQUEST =
  new HttpContextToken<boolean>(
    () => false
  );


// ============================================================
// CACHE ENTRY
// ============================================================

interface CacheEntry {

  response: any;

  expiresAt: number;

}


// ============================================================
// CACHE STORAGE
// ============================================================

const cache =
  new Map<string, CacheEntry>();


// ============================================================
// ACTIVE REQUESTS
// ============================================================

const activeRequests =
  new Map<string, Observable<any>>();


// ============================================================
// CACHE VERSION
// ============================================================

export const cacheVersion =
  signal(0);


// ============================================================
// CACHE TTL
// ============================================================

const CACHE_TTL =
  30 * 60 * 1000;


// ============================================================
// PUBLIC AUTH REQUEST
// ============================================================

/*
 * These endpoints do not require an access token.
 *
 * IMPORTANT:
 *
 * /refresh must completely bypass the interceptor's
 * authentication/refresh logic.
 */

function isPublicAuthRequest(
  req: HttpRequest<unknown>
): boolean {

  const url =
    req.url
      .toLowerCase()
      .split('?')[0];

  return (
    url.endsWith('/users/login') ||
    url.endsWith('/users/refresh')
  );

}


// ============================================================
// CACHEABLE REQUEST
// ============================================================

function isCacheableRequest(
  req: HttpRequest<any>
): boolean {

  /*
   * Only GET requests can be cached.
   */

  if (
    req.method.toUpperCase() !== 'GET'
  ) {

    return false;

  }


  /*
   * Public authentication requests
   * should never be cached.
   */

  if (
    isPublicAuthRequest(req)
  ) {

    return false;

  }


  /*
   * Explicit cache request.
   */

  if (
    req.context.get(CACHE_REQUEST)
  ) {

    return true;

  }


  const url =
    req.url
      .toLowerCase();


  // ==========================================================
  // BRANDS
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/brands'
    )
  ) {

    return true;

  }


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/categories'
    )
  ) {

    return true;

  }


  // ==========================================================
  // SUBCATEGORIES
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/subcategories'
    )
  ) {

    return true;

  }


  return false;

}


// ============================================================
// ENDPOINT CHECK
// ============================================================

function isEndpoint(
  url: string,
  endpoint: string
): boolean {

  const normalized =
    url.split('?')[0];


  return (
    normalized.endsWith(endpoint) ||
    normalized.includes(
      `${endpoint}/`
    )
  );

}


// ============================================================
// CACHE KEY
// ============================================================

function getCacheKey(
  req: HttpRequest<any>
): string {

  return (
    req.method.toUpperCase() +
    ':' +
    req.urlWithParams
  );

}


// ============================================================
// CACHE RESOURCE
// ============================================================

function getCacheResource(
  url: string
): 'brands' |
   'categories' |
   'subcategories' |
   null {

  const normalized =
    url
      .toLowerCase()
      .split('?')[0];


  if (
    isEndpoint(
      normalized,
      '/brands'
    )
  ) {

    return 'brands';

  }


  if (
    isEndpoint(
      normalized,
      '/categories'
    )
  ) {

    return 'categories';

  }


  if (
    isEndpoint(
      normalized,
      '/subcategories'
    )
  ) {

    return 'subcategories';

  }


  return null;

}


// ============================================================
// CHECK CACHE RESOURCE
// ============================================================

function keyContainsResource(
  key: string,
  resource:
    'brands' |
    'categories' |
    'subcategories'
): boolean {

  const normalized =
    key.toLowerCase();


  if (
    resource === 'brands'
  ) {

    return normalized.includes(
      '/brands'
    );

  }


  if (
    resource === 'categories'
  ) {

    return normalized.includes(
      '/categories'
    );

  }


  if (
    resource === 'subcategories'
  ) {

    return normalized.includes(
      '/subcategories'
    );

  }


  return false;

}


// ============================================================
// CLEAR CACHE FOR RESOURCE
// ============================================================

function clearCacheForResource(
  resource:
    'brands' |
    'categories' |
    'subcategories'
): void {

  const keysToDelete: string[] = [];


  // ==========================================================
  // REMOVE CACHE
  // ==========================================================

  for (
    const key of cache.keys()
  ) {

    if (
      keyContainsResource(
        key,
        resource
      )
    ) {

      keysToDelete.push(
        key
      );

    }

  }


  for (
    const key of keysToDelete
  ) {

    cache.delete(
      key
    );

  }


  // ==========================================================
  // REMOVE ACTIVE REQUESTS
  // ==========================================================

  for (
    const key of activeRequests.keys()
  ) {

    if (
      keyContainsResource(
        key,
        resource
      )
    ) {

      activeRequests.delete(
        key
      );

    }

  }


  // ==========================================================
  // UPDATE SIGNAL
  // ==========================================================

  cacheVersion.update(
    value => value + 1
  );

}


// ============================================================
// INVALIDATE CACHE AFTER MUTATION
// ============================================================

function invalidateCache(
  req: HttpRequest<unknown>
): void {

  const url =
    req.url
      .toLowerCase();


  // ==========================================================
  // BRANDS
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/brands'
    )
  ) {

    clearCacheForResource(
      'brands'
    );

    return;

  }


  // ==========================================================
  // SUBCATEGORIES
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/subcategories'
    )
  ) {

    clearCacheForResource(
      'subcategories'
    );

    clearCacheForResource(
      'categories'
    );

    return;

  }


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  if (
    isEndpoint(
      url,
      '/categories'
    )
  ) {

    clearCacheForResource(
      'categories'
    );

    clearCacheForResource(
      'subcategories'
    );

    return;

  }

}


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
  // PUBLIC AUTH REQUEST
  // ==========================================================

  const publicAuthRequest =
    isPublicAuthRequest(req);


  /*
   * IMPORTANT
   *
   * Login and refresh must completely bypass
   * access-token handling.
   *
   * Especially /refresh:
   *
   * POST /users/refresh
   *
   * must NOT:
   *
   * - receive Authorization header
   * - use cache
   * - trigger another refresh if it returns 401
   */

  if (
    publicAuthRequest
  ) {

    return next(req);

  }


  // ==========================================================
  // GET ACCESS TOKEN
  // ==========================================================

  const token =
    authService.getToken();


  // ==========================================================
  // ADD ACCESS TOKEN
  // ==========================================================

  let request =
    req;


  if (
    token
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
  // MUTATION REQUEST
  // ==========================================================

  const isMutation =
    [
      'POST',
      'PUT',
      'PATCH',
      'DELETE'
    ].includes(
      request.method.toUpperCase()
    );


  // ==========================================================
  // CACHE CHECK
  // ==========================================================

  if (
    isCacheableRequest(request)
  ) {

    const cacheKey =
      getCacheKey(
        request
      );


    // ========================================================
    // CACHE HIT
    // ========================================================

    const cached =
      cache.get(
        cacheKey
      );


    if (
      cached &&
      Date.now() <
      cached.expiresAt
    ) {
 return of(
        cached.response
      );

    }


    // ========================================================
    // REMOVE EXPIRED CACHE
    // ========================================================

    if (
      cached
    ) {

      cache.delete(
        cacheKey
      );

    }


    // ========================================================
    // ACTIVE REQUEST
    // ========================================================

    const activeRequest =
      activeRequests.get(
        cacheKey
      );


    if (
      activeRequest
    ) {
return activeRequest;

    }


    // ========================================================
    // SEND REQUEST
    // ========================================================

    const request$ =
      next(request).pipe(

        // ====================================================
        // CACHE RESPONSE
        // ====================================================

        tap(
          response => {

            cache.set(
              cacheKey,
              {

                response,

                expiresAt:
                  Date.now() +
                  CACHE_TTL

              }
            );


            cacheVersion.update(
              value => value + 1
            );
}
        ),


        // ====================================================
        // REMOVE ACTIVE REQUEST
        // ====================================================

        finalize(() => {

          activeRequests.delete(
            cacheKey
          );

        }),


        // ====================================================
        // SHARE REQUEST
        // ====================================================

        shareReplay({

          bufferSize: 1,

          refCount: false

        })

      );


    // ========================================================
    // STORE ACTIVE REQUEST
    // ========================================================

    activeRequests.set(
      cacheKey,
      request$
    );


    return request$;

  }


  // ==========================================================
  // NORMAL REQUEST
  // ==========================================================

  return next(request).pipe(

    // ========================================================
    // HANDLE RESPONSE
    // ========================================================

    tap({

      next: () => {

        /*
         * Invalidate cache after successful mutation.
         */

        if (
          isMutation
        ) {

          invalidateCache(
            request
          );

        }

      }

    }),


    // ========================================================
    // HANDLE ERRORS
    // ========================================================

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
        // GET REFRESH TOKEN
        // ====================================================

        const refreshToken =
          authService.getRefreshToken();


        // ====================================================
        // NO REFRESH TOKEN
        // ====================================================

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
              () => {

                /*
                 * AuthService has already saved
                 * the new access token.
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

                console.error(
                  'Unable to refresh token:',
                  refreshError
                );


                /*
                 * AuthService.refreshToken()
                 * already calls logout() when refresh fails.
                 */

                return throwError(
                  () =>
                    refreshError
                );

              }
            )

          );

      }

    )

  );

};