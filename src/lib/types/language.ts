export type Locale = 'zh' | 'en' | 'ja' | 'ko';

export type Languages = {
  cn: string;
  en: string;
  jp: string;
  kr: string;
};

export type LanguageLabel = keyof Languages;
