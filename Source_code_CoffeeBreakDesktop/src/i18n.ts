import en from './locales/en.json';
import zh from './locales/zh.json';

export type Locale = 'en' | 'zh';
export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = { en, zh };

const STORAGE_KEY = 'coffee-break-locale';

function detectSystemLocale(): Locale {
  try {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    return 'en';
  } catch {
    return 'en';
  }
}

let currentLocale: Locale = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
  } catch {
    // localStorage unavailable
  }
  return detectSystemLocale();
})();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}

export function t(key: TranslationKey): string {
  return translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
}

// Initialize lang attribute
document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';
