import { isValidISODate } from './validate-date';

export type ReminderStatus = 'checking' | 'off' | 'active' | 'permission-denied' | 'error';
export const REMINDER_KEYS = {
  daily: 'daily_reminder_enabled',
  debt: 'debt_reminder_enabled',
} as const;

export function debtReminderIsEligible(debt: { due_date?: string | null; is_paid: number }, now = Date.now()): boolean {
  if (!debt.due_date || !isValidISODate(debt.due_date) || debt.is_paid === 1) return false;
  const due = new Date(`${debt.due_date}T09:00:00`).getTime();
  return Number.isFinite(due) && due > now;
}
