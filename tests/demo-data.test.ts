import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoTransactions } from '../src/utils/demo-data';
import { buildComparison } from '../src/utils/comparison-chart';

it('provides deterministic multi-year sample data without future transactions', () => {
  const now = new Date(2026, 9, 21);
  const transactions = createDemoTransactions(now);
  assert.deepEqual(transactions, createDemoTransactions(now));
  assert.equal(new Set(transactions.map(item => item.id)).size, transactions.length);
  assert.ok(transactions.every(item => item.date <= '2026-10-21' && item.amount > 0));
  assert.ok(transactions.some(item => item.date === '2026-10-21'));
  assert.ok(transactions.some(item => item.type === 'income'));
  assert.ok(new Set(transactions.filter(item => item.type === 'expense').map(item => item.category_id)).size >= 6);
  const comparison = buildComparison(transactions, 'year', 2026, 5, 'expense', now);
  assert.equal(comparison.hasData, true);
  assert.ok(comparison.series.every(series => series.values.some(value => value !== null && value > 0)));
});

it('keeps demo data available on the first day of a new year', () => {
  const transactions = createDemoTransactions(new Date(2027, 0, 1));
  assert.ok(transactions.some(item => item.date === '2027-01-01'));
  assert.ok(transactions.every(item => item.date <= '2027-01-01'));
});
