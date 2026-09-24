import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Language, LanguageOption, TranslationDictionary } from './types';
import { en } from './locales/en';
import { id } from './locales/id';
import { zh } from './locales/zh';

export * from './types';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'zh', label: 'Chinese', nativeLabel: '简体中文', flag: '🇨🇳' },
];

const dictionaries: Record<Language, TranslationDictionary> = {
  en,
  id,
  zh,
};

const MONTHS_SHORT: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const MONTHS_FULL: Record<Language, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  id: [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ],
  zh: [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ],
};

const DAYS_SHORT: Record<Language, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  id: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
};

const DAYS_FULL: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDateShort: (isoDate: string) => string;
  formatDateFull: (isoDate: string) => string;
  formatMonthYear: (isoDate: string) => string;
  getRelativeDateLabel: (isoDate: string) => string;
  getMonthNames: () => string[];
  getDayNames: () => string[];
  getCategoryName: (cat?: { id?: string | null; name?: string; is_default?: number } | null) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM app_settings WHERE key = 'language'"
        );
        if (isMounted && row?.value && row.value in dictionaries) {
          setLanguageState(row.value as Language);
        }
      } catch (err) {
        console.warn('Failed to load language setting from SQLite:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [db]);

  const setLanguage = useCallback(
    async (nextLang: Language) => {
      if (!dictionaries[nextLang]) return;
      setLanguageState(nextLang);
      try {
        await db.runAsync(
          "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('language', ?)",
          nextLang
        );
      } catch (err) {
        console.error('Failed to save language to SQLite:', err);
      }
    },
    [db]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[language] || dictionaries.en;
      let template = dict[key] ?? dictionaries.en[key] ?? key;

      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
        });
      }

      return template;
    },
    [language]
  );

  const formatDateShort = useCallback(
    (isoDate: string): string => {
      if (!isoDate) return '';
      const parts = isoDate.split('-');
      if (parts.length !== 3) return isoDate;
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (language === 'zh') {
        return `${year}年${monthIdx + 1}月${day}日`;
      }
      const monthName = MONTHS_SHORT[language]?.[monthIdx] || MONTHS_SHORT.en[monthIdx] || '';
      return `${day} ${monthName} ${year}`;
    },
    [language]
  );

  const formatDateFull = useCallback(
    (isoDate: string): string => {
      if (!isoDate) return '';
      const d = new Date(isoDate + 'T00:00:00');
      if (isNaN(d.getTime())) return isoDate;
      const dayName = DAYS_FULL[language]?.[d.getDay()] || DAYS_FULL.en[d.getDay()];
      const day = d.getDate();
      const monthIdx = d.getMonth();
      const year = d.getFullYear();

      if (language === 'zh') {
        return `${year}年${monthIdx + 1}月${day}日 ${dayName}`;
      }
      const month = MONTHS_FULL[language]?.[monthIdx] || MONTHS_FULL.en[monthIdx];
      return `${dayName}, ${day} ${month} ${year}`;
    },
    [language]
  );

  const formatMonthYear = useCallback(
    (isoDate: string): string => {
      if (!isoDate) return '';
      const parts = isoDate.split('-');
      if (parts.length < 2) return isoDate;
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;

      if (language === 'zh') {
        return `${year}年${monthIdx + 1}月`;
      }
      const month = MONTHS_FULL[language]?.[monthIdx] || MONTHS_FULL.en[monthIdx];
      return `${month} ${year}`;
    },
    [language]
  );

  const getRelativeDateLabel = useCallback(
    (isoDate: string): string => {
      if (!isoDate) return '';
      const now = new Date();
      const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;

      if (isoDate === todayISO) {
        return t('common_today');
      }

      const dToday = new Date(todayISO + 'T00:00:00');
      const dTarget = new Date(isoDate + 'T00:00:00');
      const diffDays = Math.round((dToday.getTime() - dTarget.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return t('common_yesterday');
      if (diffDays === -1) return t('common_tomorrow');
      return formatDateShort(isoDate);
    },
    [t, formatDateShort]
  );

  const getMonthNames = useCallback(() => {
    return MONTHS_SHORT[language] || MONTHS_SHORT.en;
  }, [language]);

  const getDayNames = useCallback(() => {
    return DAYS_SHORT[language] || DAYS_SHORT.en;
  }, [language]);

  const getCategoryName = useCallback(
    (cat?: { id?: string | null; name?: string; is_default?: number } | null): string => {
      if (!cat) return '';
      if (cat.id && (cat.is_default === 1 || cat.id.startsWith('cat_'))) {
        const dict = dictionaries[language] || dictionaries.en;
        if (dict[cat.id]) return dict[cat.id];
      }
      return cat.name || '';
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDateShort,
      formatDateFull,
      formatMonthYear,
      getRelativeDateLabel,
      getMonthNames,
      getDayNames,
      getCategoryName,
    }),
    [
      language,
      setLanguage,
      t,
      formatDateShort,
      formatDateFull,
      formatMonthYear,
      getRelativeDateLabel,
      getMonthNames,
      getDayNames,
      getCategoryName,
    ]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
