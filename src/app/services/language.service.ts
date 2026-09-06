import {
  Injectable,
  signal
} from '@angular/core';

import {
  Directionality
} from '@angular/cdk/bidi';

import {
  TranslateService
} from '@ngx-translate/core';


@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  currentLanguage = signal<'en' | 'ar'>('en');


  constructor(
    private readonly translate: TranslateService,
    private readonly directionality: Directionality
  ) {

    const savedLanguage =
      localStorage.getItem('language') as 'en' | 'ar' | null;

    const language = savedLanguage ?? 'en';

    this.setLanguage(language);
  }


 setLanguage(language: 'en' | 'ar'): void {

  const direction =
    language === 'ar'
      ? 'rtl'
      : 'ltr';

  /*
   * Update HTML direction
   */
  document.documentElement.lang = language;
  document.documentElement.dir = direction;

  /*
   * Notify Angular Material / CDK
   *
   * Directionality.value is read-only.
   * The change event is what consumers listen to.
   */
  this.directionality.change.emit(direction);

  /*
   * Save language
   */
  localStorage.setItem(
    'language',
    language
  );

  /*
   * Update application language
   */
  this.currentLanguage.set(language);

  /*
   * Load translations
   */
  this.translate.use(language);
}


  toggleLanguage(): void {

    const newLanguage =
      this.currentLanguage() === 'en'
        ? 'ar'
        : 'en';

    this.setLanguage(newLanguage);
  }


  isArabic(): boolean {
    return this.currentLanguage() === 'ar';
  }
}