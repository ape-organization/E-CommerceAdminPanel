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

/*
 * Requests explicitly marked with this context token
 * can be cached.
 *
 * We will also automatically cache the lookup endpoints
 * below, so your existing services do not need to change.
 */

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
//
// Prevents this:
//
// Component A -> GET /brands
// Component B -> GET /brands
//
// from creating two HTTP requests.
//
// Both components share the same request.
// ============================================================

const activeRequests =
  new Map<string, Observable<any>>();


// ============================================================
// CACHE VERSION SIGNAL
//
// This is a signal as requested.
//
// It changes whenever cache data is added/removed.
// ============================================================

export const cacheVersion =
  signal(0);


// ============================================================
// TTL
// ============================================================

const CACHE_TTL =
  30 * 60 * 1000; // 30 minutes


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
   * Explicitly requested cache.
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

  /*
   * Include the complete URL.
   *
   * This is important for:
   *
   * /subcategories/1
   * /subcategories/2
   *
   * They must have different cache entries.
   */

  return (
    req.method.toUpperCase() +
    ':' +
    req.urlWithParams
  );

}


// ============================================================
// CACHEABLE RESOURCE TYPE
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
// CLEAR CACHE
// ============================================================

function clearCacheForResource(
  resource:
    'brands' |
    'categories' |
    'subcategories'
): void {

  const keysToDelete: string[] = [];


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


  /*
   * Also remove matching active requests.
   *
   * Usually there won't be any mutation while a GET
   * is running, but this keeps the cache consistent.
   */

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


  cacheVersion.update(
    value => value + 1
  );


  console.log(
    `Cache cleared: ${resource}`
  );

}


// ============================================================
// CHECK CACHE KEY RESOURCE
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
// INVALIDATE AFTER MUTATION
// ============================================================

function invalidateCache(
  req: HttpRequest<unknown>
): void {

  const url =
    req.url
      .toLowerCase();


  // ==========================================================
  // BRAND CREATE / UPDATE / DELETE
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
  // SUBCATEGORY
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

    /*
     * Subcategory changes can affect category
     * menu data if your API returns subcategories
     * inside categories.
     *
     * Therefore clear categories too.
     */

    clearCacheForResource(
      'categories'
    );

    return;

  }


  // ==========================================================
  // CATEGORY
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

    /*
     * Category changes can affect subcategories.
     */

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
  // CHECK REFRESH REQUEST
  // ==========================================================

  const isRefreshRequest =
    req.url
      .toLowerCase()
      .includes(
        '/users/refresh'
      );


  // ==========================================================
  // GET ACCESS TOKEN
  // ==========================================================

  const token =
    authService.getToken();


  // ==========================================================
  // ADD TOKEN
  // ==========================================================

  let request =
    req;


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
    // CHECK EXISTING CACHE
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

      console.log(
        'CACHE HIT:',
        request.urlWithParams
      );


      return of(
        cached.response
      );

    }


    // ========================================================
    // REMOVE EXPIRED CACHE
    // ========================================================

    if (cached) {

      cache.delete(
        cacheKey
      );

    }


    // ========================================================
    // CHECK ACTIVE REQUEST
    // ========================================================

    const activeRequest =
      activeRequests.get(
        cacheKey
      );


    if (
      activeRequest
    ) {

      console.log(
        'CACHE REQUEST REUSED:',
        request.urlWithParams
      );


      return activeRequest;

    }


    // ========================================================
    // SEND REQUEST
    // ========================================================

    const request$ =
      next(request).pipe(

        tap(
          response => {

            /*
             * Cache the complete HttpResponse.
             *
             * This allows HttpClient subscribers to receive
             * the same response structure as a normal request.
             */

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


            console.log(
              'CACHE SET:',
              request.urlWithParams
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

    tap({

      next: () => {

        /*
         * If this was:
         *
         * POST /brands
         * PUT /brands/5
         * DELETE /brands/5
         *
         * clear the appropriate cache.
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
              () => {

                /*
                 * AuthService already saved
                 * the new token.
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

                console.error(
                  'Unable to refresh token:',
                  refreshError
                );


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