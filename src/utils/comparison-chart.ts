import { isValidISODate } from './validate-date';

export type ComparisonMode = 'month' | 'year';
export type ComparisonMetric = 'income' | 'expense' | 'net';
export type ComparisonSeries = { id: number; values: (number | null)[]; partial: boolean };
type Peak = { year: number; month: number; amount: number };
type Entry = { date: string; type: string; amount: number };

export function buildComparison(transactions: Entry[], mode: ComparisonMode, year: number, range: number, metric: ComparisonMetric, now = new Date()) {
  const startYear = mode === 'month' ? year : Math.max(1, year - range + 1);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const months = new Map<string, { income: number; expense: number }>();
  const days = new Map<string, { income: number; expense: number }>();
  let hasData = false;
  for (const tx of transactions) {
    if (!tx || !isValidISODate(tx.date) || tx.date > today || !Number.isFinite(tx.amount) || tx.amount <= 0 || (tx.type !== 'income' && tx.type !== 'expense')) continue;
    const y = Number(tx.date.slice(0, 4));
    if (y < startYear || y > year) continue;
    hasData = true;
    for (const [map, key] of [[months, tx.date.slice(0, 7)], [days, tx.date]] as const) {
      const totals = map.get(key) || { income: 0, expense: 0 };
      totals[tx.type] += tx.amount;
      map.set(key, totals);
    }
  }
  const value = (key: string, daily = false) => {
    const totals = (daily ? days : months).get(key) || { income: 0, expense: 0 };
    return metric === 'net' ? totals.income - totals.expense : totals[metric];
  };
  const prefix = (y: number, m: number) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
  const series: ComparisonSeries[] = [];
  if (mode === 'year') {
    for (let y = startYear; y <= year; y++) {
      series.push({ id: y, partial: y === now.getFullYear(), values: Array.from({ length: 12 }, (_, i) => prefix(y, i + 1) > today.slice(0, 7) ? null : value(prefix(y, i + 1))) });
    }
  } else {
    for (let m = 1; m <= 12; m++) {
      let accumulated = 0;
      const length = new Date(year, m, 0).getDate();
      const values = Array.from({ length: 31 }, (_, i) => {
        const date = `${prefix(year, m)}-${String(i + 1).padStart(2, '0')}`;
        if (i >= length || date > today) return null;
        accumulated += value(date, true);
        return accumulated;
      });
      series.push({ id: m, partial: year === now.getFullYear() && m === now.getMonth() + 1, values });
    }
  }
  let highestIncome: Peak | null = null;
  let highestExpense: Peak | null = null;
  for (const [key, totals] of months) {
    const [y, m] = key.split('-').map(Number);
    if (totals.income > (highestIncome?.amount || 0)) highestIncome = { year: y, month: m, amount: totals.income };
    if (totals.expense > (highestExpense?.amount || 0)) highestExpense = { year: y, month: m, amount: totals.expense };
  }
  return { series, highestIncome, highestExpense, hasData };
}
