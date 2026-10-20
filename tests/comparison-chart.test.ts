import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buildComparison } from '../src/utils/comparison-chart';

const now = new Date(2026, 2, 10, 12);
const txs = [
  { date: '2025-02-01', type: 'income', amount: 100 },
  { date: '2025-02-02', type: 'expense', amount: 150 },
  { date: '2026-03-01', type: 'expense', amount: 25 },
  { date: '2026-03-11', type: 'income', amount: 999 },
  { date: '2026-02-30', type: 'expense', amount: 999 },
  { date: '2026-02-01', type: 'transfer', amount: 999 },
];
it('compares monthly totals across the requested years and preserves negative net', () => {
  const result = buildComparison(txs, 'year', 2026, 5, 'net', now);
  assert.equal(result.series.length, 5);
  assert.equal(result.series[0].id, 2022);
  assert.equal(result.series[3].values[1], -50);
  assert.equal(result.series[4].values[2], -25);
  assert.equal(result.series[4].values[3], null);
  assert.equal(result.highestIncome?.year, 2025);
  assert.equal(result.highestExpense?.amount, 150);
  assert.equal(result.hasData, true);
});
it('compares cumulative daily totals with real month lengths and no future points', () => {
  const result = buildComparison(txs, 'month', 2026, 1, 'expense', now);
  assert.equal(result.series.length, 12);
  assert.equal(result.series[1].values[27], 0);
  assert.equal(result.series[1].values[28], null);
  assert.equal(result.series[2].values[0], 25);
  assert.equal(result.series[2].values[9], 25);
  assert.equal(result.series[2].values[10], null);
  assert.equal(result.series[3].values.every(value => value === null), true);
  assert.equal(result.series[2].partial, true);
});
it('handles leap years, empty data, invalid amounts, and excludes other years in month mode', () => {
  const result = buildComparison([
    { date: '2024-02-29', type: 'income', amount: 10 },
    { date: '2024-02-01', type: 'income', amount: NaN },
  ], 'month', 2024, 1, 'income', now);
  assert.equal(result.series[1].values[28], 10);
  assert.equal(result.series[1].values[29], null);
  const empty = buildComparison(txs, 'month', 2023, 1, 'expense', now);
  assert.equal(empty.hasData, false);
  assert.equal(empty.highestExpense, null);
});
