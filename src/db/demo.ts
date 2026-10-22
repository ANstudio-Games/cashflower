import type { SQLiteDatabase } from 'expo-sqlite';
import { initDatabase } from '@/db';
import { createDemoTransactions } from '@/utils/demo-data';

/** Only called with cashflower-demo.db, never the user's main database. */
export async function initDemoDatabase(db: SQLiteDatabase): Promise<void> {
  await initDatabase(db);
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM transactions');
  if (existing?.count) return;
  await db.withTransactionAsync(async () => {
    for (const item of createDemoTransactions()) {
      await db.runAsync(
        'INSERT INTO transactions (id, title, amount, type, category_id, wallet_id, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        item.id, item.title, item.amount, item.type, item.category_id, item.wallet_id ?? null, item.date, item.notes ?? null, item.created_at,
      );
    }
    for (const key of ['daily_reminder_enabled', 'debt_reminder_enabled']) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', key, 'false');
    }
  });
}
