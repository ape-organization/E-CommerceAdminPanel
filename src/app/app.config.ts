import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideTranslateService } from '@ngx-translate/core';

import {
  provideTranslateHttpLoader
} from '@ngx-translate/http-loader';

import { routes } from './app.routes';

import { authInterceptor } from './interceptors/auth.interceptor';

import { loadingInterceptor } from './interceptors/loading.interceptor';

import { MatPaginatorIntl } from '@angular/material/paginator';

import { TranslatedPaginatorIntl } from './shared/paginator-intl';


export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        authInterceptor
      ])
    ),

    provideAnimationsAsync(),

    {
      provide: MatPaginatorIntl,
      useClass: TranslatedPaginatorIntl
    },

    provideTranslateService({

      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json'
      })

    })

  ]

};