import { it } from 'node:test';
import assert from 'node:assert/strict';
import { savingsRate } from '../src/utils/savings-rate';
import { readFileSync } from 'node:fs';
it('shows actual deficit and distinguishes unavailable rates', () => {
  assert.equal(savingsRate(100, 150), -50);
  assert.equal(savingsRate(100, 100), 0);
  assert.equal(savingsRate(100, 25), 75);
  assert.equal(savingsRate(0, 100), null);
  assert.equal(savingsRate(NaN, 100), null);
});
it('category detail retains top 6 categories like 1.6.0', () => {
  const source = readFileSync('src/components/category-donut-chart.tsx', 'utf8');
  assert.match(source, /safeData\.slice\(0, 6\)/);
});
