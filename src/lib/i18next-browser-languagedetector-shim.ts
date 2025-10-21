import type { I18nInstance } from './i18next-shim';

type DetectorServices = unknown;

type DetectorOptions = {
  order?: string[];
  caches?: string[];
};

class LanguageDetectorPlugin {
  public type = 'languageDetector';
  private services: DetectorServices | null = null;
  private options: DetectorOptions = {};

  init(services: DetectorServices, _i18n: I18nInstance, options: DetectorOptions = {}): void {
    this.services = services;
    this.options = options;
  }

  detect(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const order = this.options.order ?? ['localStorage', 'navigator'];

    for (const source of order) {
      if (source === 'localStorage' && window.localStorage) {
        const stored = window.localStorage.getItem('i18nextLng');
        if (stored) {
          return stored;
        }
      }
      if (source === 'navigator') {
        const language = window.navigator?.language;
        if (language) {
          return language.split('-')[0];
        }
      }
      if (source === 'htmlTag') {
        const lang = document.documentElement?.lang;
        if (lang) {
          return lang.split('-')[0];
        }
      }
    }

    return undefined;
  }

  cacheUserLanguage(language: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.options.caches?.includes('localStorage') && window.localStorage) {
      window.localStorage.setItem('i18nextLng', language);
    }
  }
}

export default function LanguageDetector(): LanguageDetectorPlugin {
  return new LanguageDetectorPlugin();
}
