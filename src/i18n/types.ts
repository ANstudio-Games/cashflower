export type Language = 'en' | 'id' | 'zh';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export type TranslationKey = string;
export type TranslationDictionary = Record<string, string>;
