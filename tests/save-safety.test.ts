import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSaveGuard } from '../src/utils/save-guard';
import { isValidISODate } from '../src/utils/validate-date';

it('rejects invalid calendar dates and accepts leap days', () => {
  for (const date of ['2025-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '', '0000-01-01']) {
    assert.equal(isValidISODate(date), false, date);
  }
  assert.equal(isValidISODate('2024-02-29'), true);
  assert.equal(isValidISODate('2026-10-06'), true);
});
it('protects transfer rows and wires guarded saves in all eight forms', () => {
  const read = (path: string) => readFileSync(path, 'utf8');
  assert.match(read('src/components/transaction-item.tsx'), /onPress=\{\(\) => !isTransfer && onEdit && onEdit\(item\)\}/);
  assert.match(read('src/context/finance-context.tsx'), /Transfers require a dedicated editor/);
  for (const name of ['add-transaction', 'add-debt', 'add-investment', 'add-category', 'add-plan', 'add-wallet', 'transfer-funds', 'budget']) {
    const source = read(`src/app/modal/${name}.tsx`);
    assert.match(source, /disabled=\{isSaving\}/, name);
    assert.match(source, /void runSave\(handle(?:Submit|Save)\)/, name);
  }
});
it('ignores concurrent saves and unlocks after completion or failure', async () => {
  const guard = createSaveGuard();
  let release!: () => void;
  let calls = 0;
  const first = guard(async () => { calls++; await new Promise<void>(r => { release = r; }); });
  await guard(async () => { calls++; });
  assert.equal(calls, 1);
  release(); await first;
  await assert.rejects(guard(async () => { throw new Error('failed'); }));
  await guard(async () => { calls++; });
  assert.equal(calls, 2);
});
