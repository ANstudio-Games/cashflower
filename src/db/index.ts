import * as SQLite from 'expo-sqlite';
import { Category, Transaction, Debt, Investment, CashflowSummary, DebtSummary, InvestmentSummary } from '@/types';

export const DB_NAME = 'cashflower.db';

export const DEFAULT_CATEGORIES: Omit<Category, 'is_default'>[] = [
  // Pengeluaran
  { id: 'cat_food', name: 'Makanan & Minuman', type: 'expense', icon: 'restaurant-outline', color: '#F97316' },
  { id: 'cat_shopping', name: 'Belanja & Barang', type: 'expense', icon: 'cart-outline', color: '#EC4899' },
  { id: 'cat_transport', name: 'Transportasi', type: 'expense', icon: 'car-outline', color: '#3B82F6' },
  { id: 'cat_bills', name: 'Tagihan & Utilitas', type: 'expense', icon: 'receipt-outline', color: '#8B5CF6' },
  { id: 'cat_entertainment', name: 'Hiburan & Hobi', type: 'expense', icon: 'game-controller-outline', color: '#06B6D4' },
  { id: 'cat_health', name: 'Kesehatan', type: 'expense', icon: 'medkit-outline', color: '#10B981' },
  { id: 'cat_education', name: 'Pendidikan', type: 'expense', icon: 'book-outline', color: '#F59E0B' },
  { id: 'cat_home', name: 'Kebutuhan Rumah', type: 'expense', icon: 'home-outline', color: '#64748B' },
  { id: 'cat_other_exp', name: 'Pengeluaran Lain', type: 'expense', icon: 'grid-outline', color: '#94A3B8' },

  // Pemasukan
  { id: 'cat_salary', name: 'Gaji & Upah', type: 'income', icon: 'briefcase-outline', color: '#10B981' },
  { id: 'cat_business', name: 'Bisnis & Penjualan', type: 'income', icon: 'storefront-outline', color: '#3B82F6' },
  { id: 'cat_bonus', name: 'Bonus & Hadiah', type: 'income', icon: 'gift-outline', color: '#EC4899' },
  { id: 'cat_passive', name: 'Pendapatan Pasif', type: 'income', icon: 'trending-up-outline', color: '#8B5CF6' },
  { id: 'cat_other_inc', name: 'Pemasukan Lain', type: 'income', icon: 'wallet-outline', color: '#059669' },
];

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      person_name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      issue_date TEXT NOT NULL,
      is_paid INTEGER NOT NULL DEFAULT 0,
      paid_date TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      instrument_type TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      buy_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      pnl REAL NOT NULL,
      pnl_percentage REAL NOT NULL,
      trade_date TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  // Insert default categories if not already populated
  const existingCat = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!existingCat || existingCat.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, 1)',
        [cat.id, cat.name, cat.type, cat.icon, cat.color]
      );
    }
  }
}

// ------------------- Category Operations -------------------

export async function getCategories(db: SQLite.SQLiteDatabase, type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return await db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name ASC', [type]);
  }
  return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type ASC, name ASC');
}

export async function addCategory(
  db: SQLite.SQLiteDatabase,
  category: { id: string; name: string; type: 'income' | 'expense'; icon: string; color: string }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, 0)',
    [category.id, category.name, category.type, category.icon, category.color]
  );
}

// ------------------- Transaction Operations -------------------

export async function getTransactions(
  db: SQLite.SQLiteDatabase,
  options?: {
    type?: 'income' | 'expense';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }
): Promise<Transaction[]> {
  let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.type) {
    query += ' AND t.type = ?';
    params.push(options.type);
  }
  if (options?.categoryId) {
    query += ' AND t.category_id = ?';
    params.push(options.categoryId);
  }
  if (options?.startDate) {
    query += ' AND t.date >= ?';
    params.push(options.startDate);
  }
  if (options?.endDate) {
    query += ' AND t.date <= ?';
    params.push(options.endDate);
  }
  if (options?.search && options.search.trim()) {
    query += ' AND (t.title LIKE ? OR t.notes LIKE ?)';
    params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
  }

  query += ' ORDER BY t.date DESC, t.created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return await db.getAllAsync<Transaction>(query, params);
}

export async function addTransaction(
  db: SQLite.SQLiteDatabase,
  item: Omit<Transaction, 'category_name' | 'category_icon' | 'category_color'>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions (id, title, amount, type, category_id, date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.title, item.amount, item.type, item.category_id, item.date, item.notes ?? null, item.created_at]
  );
}

export async function deleteTransaction(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getCashflowSummary(
  db: SQLite.SQLiteDatabase,
  startDate?: string,
  endDate?: string
): Promise<CashflowSummary> {
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as transactionCount
    FROM transactions
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  const row = await db.getFirstAsync<{ totalIncome: number; totalExpense: number; transactionCount: number }>(query, params);
  const totalIncome = row?.totalIncome || 0;
  const totalExpense = row?.totalExpense || 0;
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: row?.transactionCount || 0,
  };
}

export async function getCategoryExpenseBreakdown(
  db: SQLite.SQLiteDatabase,
  startDate?: string,
  endDate?: string
): Promise<{ categoryId: string; name: string; color: string; icon: string; total: number; percentage: number }[]> {
  let query = `
    SELECT 
      c.id as categoryId,
      c.name,
      c.color,
      c.icon,
      COALESCE(SUM(t.amount), 0) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
  `;
  const params: any[] = [];

  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY c.id ORDER BY total DESC';

  const rows = await db.getAllAsync<{ categoryId: string; name: string; color: string; icon: string; total: number }>(query, params);
  const overallTotal = rows.reduce((acc, curr) => acc + curr.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: overallTotal > 0 ? (r.total / overallTotal) * 100 : 0,
  }));
}

// ------------------- Debt & Receivable Operations -------------------

export async function getDebts(
  db: SQLite.SQLiteDatabase,
  options?: { type?: 'receivable' | 'payable'; isPaid?: boolean }
): Promise<Debt[]> {
  let query = 'SELECT * FROM debts WHERE 1=1';
  const params: any[] = [];

  if (options?.type) {
    query += ' AND type = ?';
    params.push(options.type);
  }
  if (options?.isPaid !== undefined) {
    query += ' AND is_paid = ?';
    params.push(options.isPaid ? 1 : 0);
  }

  query += ' ORDER BY is_paid ASC, due_date ASC, created_at DESC';
  return await db.getAllAsync<Debt>(query, params);
}

export async function addDebt(db: SQLite.SQLiteDatabase, debt: Debt): Promise<void> {
  await db.runAsync(
    `INSERT INTO debts (id, person_name, type, amount, due_date, issue_date, is_paid, paid_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [debt.id, debt.person_name, debt.type, debt.amount, debt.due_date ?? null, debt.issue_date, debt.is_paid, debt.paid_date ?? null, debt.notes ?? null, debt.created_at]
  );
}

export async function toggleDebtPaid(
  db: SQLite.SQLiteDatabase,
  id: string,
  isPaid: boolean,
  paidDate?: string
): Promise<void> {
  await db.runAsync(
    'UPDATE debts SET is_paid = ?, paid_date = ? WHERE id = ?',
    [isPaid ? 1 : 0, isPaid ? (paidDate || new Date().toISOString().split('T')[0]) : null, id]
  );
}

export async function deleteDebt(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM debts WHERE id = ?', [id]);
}

export async function getDebtSummary(db: SQLite.SQLiteDatabase): Promise<DebtSummary> {
  const row = await db.getFirstAsync<{
    totalReceivable: number;
    totalPayable: number;
    unpaidCount: number;
  }>(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'receivable' AND is_paid = 0 THEN amount ELSE 0 END), 0) as totalReceivable,
      COALESCE(SUM(CASE WHEN type = 'payable' AND is_paid = 0 THEN amount ELSE 0 END), 0) as totalPayable,
      COUNT(CASE WHEN is_paid = 0 THEN 1 END) as unpaidCount
    FROM debts
  `);

  return {
    totalReceivable: row?.totalReceivable || 0,
    totalPayable: row?.totalPayable || 0,
    unpaidCount: row?.unpaidCount || 0,
  };
}

// ------------------- Investment & Trading Operations -------------------

export async function getInvestments(
  db: SQLite.SQLiteDatabase,
  instrument?: string
): Promise<Investment[]> {
  let query = 'SELECT * FROM investments';
  const params: any[] = [];
  if (instrument && instrument !== 'all') {
    query += ' WHERE instrument_type = ?';
    params.push(instrument);
  }
  query += ' ORDER BY trade_date DESC, created_at DESC';
  return await db.getAllAsync<Investment>(query, params);
}

export async function addInvestment(db: SQLite.SQLiteDatabase, item: Investment): Promise<void> {
  await db.runAsync(
    `INSERT INTO investments (id, instrument_type, asset_name, buy_price, sell_price, pnl, pnl_percentage, trade_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.instrument_type, item.asset_name, item.buy_price, item.sell_price, item.pnl, item.pnl_percentage, item.trade_date, item.notes ?? null, item.created_at]
  );
}

export async function deleteInvestment(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM investments WHERE id = ?', [id]);
}

export async function getInvestmentSummary(db: SQLite.SQLiteDatabase): Promise<InvestmentSummary> {
  const row = await db.getFirstAsync<{
    totalCapital: number;
    totalPnl: number;
    winCount: number;
    lossCount: number;
    totalTrades: number;
  }>(`
    SELECT 
      COALESCE(SUM(buy_price), 0) as totalCapital,
      COALESCE(SUM(pnl), 0) as totalPnl,
      COUNT(CASE WHEN pnl > 0 THEN 1 END) as winCount,
      COUNT(CASE WHEN pnl < 0 THEN 1 END) as lossCount,
      COUNT(*) as totalTrades
    FROM investments
  `);

  const totalCapital = row?.totalCapital || 0;
  const totalPnl = row?.totalPnl || 0;
  const netReturn = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  return {
    totalCapital,
    totalPnl,
    winCount: row?.winCount || 0,
    lossCount: row?.lossCount || 0,
    totalTrades: row?.totalTrades || 0,
    netReturnPercentage: netReturn,
  };
}
