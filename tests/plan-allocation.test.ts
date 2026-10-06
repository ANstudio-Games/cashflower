import { it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAllocation, splitPlanPurchase } from '../src/utils/plan-allocation';
it('prevents spending or allocating unavailable and invalid funds', () => {
  for (const amount of [0, -1, NaN, Infinity, 701]) assert.throws(() => validateAllocation(amount, 700));
  assert.doesNotThrow(() => validateAllocation(700, 700));
});
it('purchases from source wallets without double counting and releases surplus', () => {
  const rows = [{ wallet_id: 'cash', amount: 300 }, { wallet_id: 'bank', amount: 800 }];
  assert.deepEqual(splitPlanPurchase(rows, 900), [{ wallet_id: 'cash', amount: 300 }, { wallet_id: 'bank', amount: 600 }]);
  assert.equal(rows.reduce((s,r) => s+r.amount,0) - 900, 200);
  assert.throws(() => splitPlanPurchase(rows, 1101));
});
