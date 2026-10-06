import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REMINDER_KEYS, debtReminderIsEligible } from '../src/utils/reminder-policy';

it('only future unpaid debts with a due date qualify', () => {
  const now = new Date('2026-10-01T12:00:00').getTime();
  assert.equal(debtReminderIsEligible({ due_date: '2026-10-02', is_paid: 0 }, now), true);
  for (const debt of [
    { due_date: null, is_paid: 0 }, { due_date: 'invalid', is_paid: 0 },
    { due_date: '2026-10-02', is_paid: 1 }, { due_date: '2026-10-01', is_paid: 0 },
  ]) assert.equal(debtReminderIsEligible(debt, now), false);
});
it('uses separate persisted preferences and a single serialized scheduling owner', () => {
  assert.notEqual(REMINDER_KEYS.daily, REMINDER_KEYS.debt);
  const context = readFileSync('src/context/finance-context.tsx', 'utf8');
  assert.match(context, /setSetting\(db, REMINDER_KEYS\[kind\], String\(enabled\)\)/);
  assert.match(context, /reminderQueue\.current\.then/);
  assert.doesNotMatch(context, /scheduleDailyReminder\(|scheduleDebtReminder\(/);
  const settings = readFileSync('src/app/modal/settings.tsx', 'utf8');
  assert.doesNotMatch(settings, /ReminderEnabled\] = useState\(true\)/);
  assert.match(settings, /reminderStatus\.daily/);
  assert.match(settings, /reminderStatus\.debt/);
});
