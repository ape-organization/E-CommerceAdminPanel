import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  currentLanguage = signal<'en' | 'ar'>('en');

  constructor(
    private translate: TranslateService
  ) {
    const savedLanguage =
      localStorage.getItem('language') as 'en' | 'ar' | null;

    const language = savedLanguage ?? 'en';

    this.setLanguage(language);
  }

  setLanguage(language: 'en' | 'ar'): void {

    this.currentLanguage.set(language);

    this.translate.use(language);

    localStorage.setItem('language', language);

    document.documentElement.dir =
      language === 'ar' ? 'rtl' : 'ltr';

    document.documentElement.lang = language;
  }

  toggleLanguage(): void {
    this.setLanguage(
      this.currentLanguage() === 'en' ? 'ar' : 'en'
    );
  }

  isArabic(): boolean {
    return this.currentLanguage() === 'ar';
  }
}