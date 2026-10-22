import { it } from 'node:test';
import assert from 'node:assert/strict';
import { processAdSave } from '../src/utils/ad-save-policy';

it('attempts an ad exactly once on every successful save without cooldown', async () => {
  let attempts = 0;
  for (let save = 0; save < 6; save++) {
    await processAdSave(async () => { attempts++; return true; });
  }
  assert.equal(attempts, 6);
});
it('does not retry unavailable ads or carry a missed turn to the next save', async () => {
  let attempts = 0;
  await processAdSave(async () => { attempts++; return false; });
  assert.equal(attempts, 1);
  await processAdSave(async () => { attempts++; return true; });
  assert.equal(attempts, 2);
});
it('propagates SDK failures without retrying', async () => {
  let attempts = 0;
  await assert.rejects(processAdSave(async () => { attempts++; throw new Error('SDK failed'); }));
  assert.equal(attempts, 1);
});
