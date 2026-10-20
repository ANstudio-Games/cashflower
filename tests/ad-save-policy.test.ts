import { it } from 'node:test';
import assert from 'node:assert/strict';
import { processAdSave } from '../src/utils/ad-save-policy';

it('keeps the first ad due across unavailable loads and only advances after display', async () => {
  let counter = 0;
  const persist = async (next: number) => { counter = next; };
  await processAdSave(counter, async () => false, persist);
  assert.equal(counter, 0);
  await processAdSave(counter, async () => false, persist);
  assert.equal(counter, 0);
  await processAdSave(counter, async () => true, persist);
  assert.equal(counter, 1);
});
it('allows two saves after a displayed ad then retains a missed turn', async () => {
  let counter = 1;
  let attempts = 0;
  const persist = async (next: number) => { counter = next; };
  const unavailable = async () => { attempts++; return false; };
  await processAdSave(counter, unavailable, persist);
  await processAdSave(counter, unavailable, persist);
  assert.equal(counter, 3);
  assert.equal(attempts, 0);
  await processAdSave(counter, unavailable, persist);
  assert.equal(counter, 3);
  await processAdSave(counter, async () => true, persist);
  assert.equal(counter, 4);
});
it('preserves existing stored cadence and does not consume rejected displays', async () => {
  let persisted: number | undefined;
  await assert.rejects(processAdSave(6, async () => { throw new Error('show failed'); }, async next => { persisted = next; }));
  assert.equal(persisted, undefined);
  await processAdSave(7, async () => { throw new Error('must not show during cooldown'); }, async next => { persisted = next; });
  assert.equal(persisted, 8);
});
