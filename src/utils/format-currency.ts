import type { Language } from '@/i18n/types';

const localeTags: Record<Language, string> = {
  en: 'en-US',
  id: 'id-ID',
  zh: 'zh-CN',
};

export function formatCurrency(amount: number, language: Language = 'id'): string {
  if (isNaN(amount)) return 'Rp 0';
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat(localeTags[language] || localeTags.id, {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return `${rounded < 0 ? '-Rp ' : 'Rp '}${formatted}`;
}

export function formatCurrencyShort(amount: number, language: Language = 'id'): string {
  if (isNaN(amount) || amount === 0) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const locale = localeTags[language] || localeTags.id;
  const formatUnit = (value: number) => new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value);

  if (language === 'zh') {
    if (abs >= 100_000_000) return `${sign}Rp ${formatUnit(abs / 100_000_000)}亿`;
    if (abs >= 10_000) return `${sign}Rp ${formatUnit(abs / 10_000)}万`;
  } else if (language === 'en') {
    if (abs >= 1_000_000_000) return `${sign}Rp ${formatUnit(abs / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${sign}Rp ${formatUnit(abs / 1_000_000)}M`;
    if (abs >= 1_000) return `${sign}Rp ${formatUnit(abs / 1_000)}K`;
  } else {
    if (abs >= 1_000_000_000) return `${sign}Rp ${formatUnit(abs / 1_000_000_000)}M`;
    if (abs >= 1_000_000) return `${sign}Rp ${formatUnit(abs / 1_000_000)}jt`;
    if (abs >= 1_000) return `${sign}Rp ${formatUnit(abs / 1_000)}rb`;
  }

  return `${sign}Rp ${formatCurrency(abs, language).replace(/^Rp /, '')}`;
}

export function parseCurrencyInput(text: string): number {
  const clean = text.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}