import { it } from 'node:test';
import assert from 'node:assert/strict';
import { updateDateFilter, matchesDateFilter, categoryForType, dateToISO, isoToDate } from '../src/utils/transaction-filters';

it('selecting a specific date clears the previous month and year', () => {
  assert.deepEqual(updateDateFilter({ year: 2025, month: 3, exactDate: '' }, { exactDate: '2026-02-28' }), { year: 'all', month: 'all', exactDate: '2026-02-28' });
});
it('selecting month or year clears a specific date and preserves the other period', () => {
  assert.deepEqual(updateDateFilter({ year: 'all', month: 'all', exactDate: '2026-02-28' }, { month: 3 }), { year: 'all', month: 3, exactDate: '' });
  assert.deepEqual(updateDateFilter({ year: 'all', month: 3, exactDate: '' }, { year: 2025 }), { year: 2025, month: 3, exactDate: '' });
});
it('matches full dates and month-only filters, rejecting impossible dates', () => {
  assert.equal(matchesDateFilter('2024-02-29', { year: 'all', month: 2, exactDate: '' }), true);
  assert.equal(matchesDateFilter('2025-02-29', { year: 'all', month: 2, exactDate: '' }), false);
  assert.equal(matchesDateFilter('2026-03-01', { year: 2025, month: 'all', exactDate: '' }), false);
  assert.equal(matchesDateFilter('2026-03-01', { year: 'all', month: 'all', exactDate: '2026-03-02' }), false);
  assert.equal(matchesDateFilter('2026-03-02', { year: 'all', month: 'all', exactDate: '2026-03-02' }), true);
});
it('clears categories for transfers and incompatible types', () => {
  const categories = [{ id: 'food', type: 'expense' }, { id: 'salary', type: 'income' }];
  assert.equal(categoryForType('transfer', 'food', categories), 'all');
  assert.equal(categoryForType('income', 'food', categories), 'all');
  assert.equal(categoryForType('expense', 'food', categories), 'food');
  assert.equal(categoryForType('all', 'food', categories), 'food');
});
it('round-trips picker dates in local time, including years below 100', () => {
  for (const value of ['2024-02-29', '2026-01-01', '0099-12-31']) {
    const date = isoToDate(value);
    assert.equal(date.getHours(), 12);
    assert.equal(dateToISO(date), value);
  }
});
