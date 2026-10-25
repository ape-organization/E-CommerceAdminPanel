import {
  HttpContextToken,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  finalize
} from 'rxjs';

import {
  LoadingService
} from '../services/loading.service';


// ============================================================
// SKIP LOADER
// ------------------------------------------------------------
// Background requests that should not show the global loader:
//
//   this.http.get(url, {
//     context: new HttpContext().set(SKIP_LOADER, true)
//   });
// ============================================================

export const SKIP_LOADER =
  new HttpContextToken<boolean>(
    () => false
  );


// ============================================================
// LOADING INTERCEPTOR
// ============================================================

export const loadingInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  if (
    req.context.get(SKIP_LOADER) ||
    req.url.includes('/assets/')
  ) {

    return next(req);

  }


  const loadingService =
    inject(LoadingService);


  loadingService.start();


  return next(req).pipe(

    finalize(
      () => loadingService.stop()
    )

  );

};
