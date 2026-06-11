import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import type { Locale } from '$lib/types/language';

const STORAGE_KEY = 'starlight-locale';
const LEGACY_STORAGE_KEY = 'language';
const DEFAULT_LOCALE: Locale = 'ja';

export type LanguageOption = {
  id: Locale;
  label: string;
  nativeName: string;
};

export const language_options: LanguageOption[] = [
  { id: 'zh', label: 'Chinese', nativeName: '中文' },
  { id: 'en', label: 'English', nativeName: 'English' },
  { id: 'ja', label: 'Japanese', nativeName: '日本語' },
  { id: 'ko', label: 'Korean', nativeName: '한국어' },
];

function normalizeLocale(value: unknown): Locale | null {
  if (value === 'zh' || value === 'cn') {
    return 'zh';
  }

  if (value === 'en') {
    return 'en';
  }

  if (value === 'ja' || value === 'jp') {
    return 'ja';
  }

  if (value === 'ko' || value === 'kr') {
    return 'ko';
  }

  return null;
}

function readStoredLocale(): Locale {
  const storedLocale = normalizeLocale(localStorage.getItem(STORAGE_KEY));

  if (storedLocale) {
    return storedLocale;
  }

  const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!legacyValue) {
    return DEFAULT_LOCALE;
  }

  try {
    const parsed = JSON.parse(legacyValue) as { label?: unknown };
    return normalizeLocale(parsed.label) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const locale = writable<Locale>(DEFAULT_LOCALE);

export const language = derived(locale, ($locale) => {
  return language_options.find((option) => option.id === $locale) ?? language_options[0];
});

let initialized = false;

export function initialize_language() {
  if (!browser || initialized) {
    return;
  }

  initialized = true;
  locale.set(readStoredLocale());

  locale.subscribe(($locale) => {
    localStorage.setItem(STORAGE_KEY, $locale);
  });
}

export function change_language(nextLocale: Locale | LanguageOption) {
  locale.set(typeof nextLocale === 'string' ? nextLocale : nextLocale.id);
}
