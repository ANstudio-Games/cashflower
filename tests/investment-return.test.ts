import { it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestmentReturn } from '../src/utils/investment-return';

it('calculates units, proceeds and profit from capital and unit prices', () => {
  assert.deepEqual(calculateInvestmentReturn(1000000, 2000, 2500), {
    units: 500, finalValue: 1250000, pnl: 250000, pnlPercentage: 25,
  });
});
it('handles losses, fractional units, decimals, break-even and total loss', () => {
  const result = calculateInvestmentReturn(100, 0.5, 0.4);
  assert.equal(result.units, 200);
  assert.equal(result.finalValue, 80);
  assert.ok(Math.abs(result.pnl + 20) < 1e-10);
  assert.equal(calculateInvestmentReturn(100, 3, 3).pnl, 0);
  assert.equal(calculateInvestmentReturn(100, 3, 0).pnl, -100);
});
it('rejects invalid capital and prices instead of producing infinite returns', () => {
  for (const args of [[0, 1, 2], [-1, 1, 2], [100, 0, 2], [100, 1, -2], [NaN, 1, 2], [100, Infinity, 2], [100, 1, NaN], [Number.MAX_VALUE, Number.MIN_VALUE, 1]]) {
    assert.throws(() => calculateInvestmentReturn(args[0], args[1], args[2]), RangeError);
  }
});
