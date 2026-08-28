import {Injectable,signal} from '@angular/core';

import { Observable, of, tap, finalize, shareReplay} from 'rxjs';


// ============================================================
// CACHE ENTRY
// ============================================================

interface CacheEntry<T> {

  value: T;

  expiresAt: number;
}


// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  // ==========================================================
  // CACHE STORAGE
  // ==========================================================

  private readonly cache =
    new Map<string, CacheEntry<unknown>>();


  // ==========================================================
  // ACTIVE REQUESTS
  //
  // Prevents multiple components from sending
  // the same request at the same time.
  // ==========================================================

  private readonly requests =
    new Map<string, Observable<unknown>>();


  // ==========================================================
  // CACHE SIGNAL
  //
  // Changes whenever cache is modified.
  // Useful if we later want components to react to
  // cache changes.
  // ==========================================================

  readonly version =
    signal(0);


  // ==========================================================
  // GET
  // ==========================================================

  get<T>(
    key: string,
    request: () => Observable<T>,
    ttl: number = 5 * 60 * 1000
  ): Observable<T> {

    // ========================================================
    // CHECK CACHE
    // ========================================================

    const cached =
      this.cache.get(key) as
        CacheEntry<T> | undefined;


    if (
      cached &&
      Date.now() < cached.expiresAt
    ) {

      return of(
        cached.value
      );

    }


    // ========================================================
    // REMOVE EXPIRED CACHE
    // ========================================================

    if (cached) {

      this.cache.delete(key);

    }


    // ========================================================
    // CHECK ACTIVE REQUEST
    //
    // If another component is already loading
    // the same data, reuse that request.
    // ========================================================

    const activeRequest =
      this.requests.get(key) as
        Observable<T> | undefined;


    if (activeRequest) {

      return activeRequest;

    }


    // ========================================================
    // CREATE REQUEST
    // ========================================================

    const request$ =
      request()
        .pipe(

          tap(value => {

            this.cache.set(
              key,
              {
                value,
                expiresAt:
                  Date.now() + ttl
              }
            );

            this.version.update(
              value => value + 1
            );

          }),

          finalize(() => {

            this.requests.delete(
              key
            );

          }),

          shareReplay({
            bufferSize: 1,
            refCount: false
          })

        );


    // ========================================================
    // STORE ACTIVE REQUEST
    // ========================================================

    this.requests.set(
      key,
      request$
    );


    return request$;
  }


  // ==========================================================
  // SET
  // ==========================================================

  set<T>(
    key: string,
    value: T,
    ttl: number = 5 * 60 * 1000
  ): void {

    this.cache.set(
      key,
      {
        value,
        expiresAt:
          Date.now() + ttl
      }
    );


    this.version.update(
      value => value + 1
    );

  }


  // ==========================================================
  // GET CACHED VALUE ONLY
  // ==========================================================

  getCached<T>(
    key: string
  ): T | null {

    const cached =
      this.cache.get(key) as
        CacheEntry<T> | undefined;


    if (!cached) {

      return null;

    }


    if (
      Date.now() >=
      cached.expiresAt
    ) {

      this.cache.delete(key);

      return null;

    }


    return cached.value;
  }


  // ==========================================================
  // HAS
  // ==========================================================

  has(
    key: string
  ): boolean {

    return (
      this.getCached(key) !== null
    );

  }


  // ==========================================================
  // CLEAR ONE CACHE
  // ==========================================================

  clear(
    key: string
  ): void {

    this.cache.delete(key);

    this.version.update(
      value => value + 1
    );

  }


  // ==========================================================
  // CLEAR MULTIPLE
  // ==========================================================

  clearMany(
    keys: string[]
  ): void {

    for (
      const key of keys
    ) {

      this.cache.delete(key);

    }


    this.version.update(
      value => value + 1
    );

  }


  // ==========================================================
  // CLEAR EVERYTHING
  // ==========================================================

  clearAll(): void {

    this.cache.clear();

    this.version.update(
      value => value + 1
    );

  }

}