import { isValidISODate } from './validate-date';

export type DateFilter = { year: number | 'all'; month: number | 'all'; exactDate: string };
export const ALL_DATES: DateFilter = { year: 'all', month: 'all', exactDate: '' };

export function updateDateFilter(current: DateFilter, change: Partial<DateFilter>): DateFilter {
  if (change.exactDate) return { ...ALL_DATES, exactDate: change.exactDate };
  return { ...current, ...change, exactDate: '' };
}

export function matchesDateFilter(date: string, filter: DateFilter): boolean {
  if (filter.exactDate) return isValidISODate(filter.exactDate) && date === filter.exactDate;
  if (filter.year === 'all' && filter.month === 'all') return true;
  if (!isValidISODate(date)) return false;
  return (filter.year === 'all' || Number(date.slice(0, 4)) === filter.year) &&
    (filter.month === 'all' || Number(date.slice(5, 7)) === filter.month);
}

export function categoryForType(type: string, selected: string, categories: { id: string; type: string }[]): string {
  if (type === 'transfer') return 'all';
  if (type === 'all' || categories.some(c => c.id === selected && c.type === type)) return selected;
  return 'all';
}

// Use local noon, not UTC parsing: selecting a day must never shift its date by timezone.
export function isoToDate(value: string): Date {
  const date = new Date();
  if (isValidISODate(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date.setFullYear(year, month - 1, day);
  }
  date.setHours(12, 0, 0, 0);
  return date;
}

export function dateToISO(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
