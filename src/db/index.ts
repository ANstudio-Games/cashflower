import * as SQLite from 'expo-sqlite';
import {
  Category,
  Transaction,
  Debt,
  Investment,
  Budget,
  FinancialPlan,
  BackupData,
  CashflowSummary,
  DebtSummary,
  InvestmentSummary,
  Wallet,
} from '@/types';

export const DB_NAME = 'cashflower.db';

export const DEFAULT_WALLETS: Omit<Wallet, 'created_at' | 'balance'>[] = [
  { id: 'wallet_cash', name: 'Uang Tunai', type: 'cash', initial_balance: 0, icon: 'cash-outline', color: '#10B981', is_default: 1 },
  { id: 'wallet_bank', name: 'Rekening Bank', type: 'bank', initial_balance: 0, icon: 'card-outline', color: '#3B82F6', is_default: 0 },
  { id: 'wallet_ewallet', name: 'E-Wallet', type: 'ewallet', initial_balance: 0, icon: 'phone-portrait-outline', color: '#8B5CF6', is_default: 0 },
];

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
  // Transfer
  { id: 'cat_transfer', name: 'Transfer Antar Dompet', type: 'expense', icon: 'swap-horizontal-outline', color: '#6366F1' },
];

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

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
      wallet_id TEXT,
      destination_wallet_id TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      generated_kind TEXT,
      source_plan_id TEXT,
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

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      monthly_limit REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financial_plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      category_id TEXT,
      target_date TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration for existing transactions table to ensure wallet_id and destination_wallet_id exist
  try {
    const txTableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions);');
    const hasWalletId = txTableInfo.some((col) => col.name === 'wallet_id');
    if (!hasWalletId) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN wallet_id TEXT;');
    }
    const hasDestWalletId = txTableInfo.some((col) => col.name === 'destination_wallet_id');
    if (!hasDestWalletId) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN destination_wallet_id TEXT;');
    }
    const hasGeneratedKind = txTableInfo.some((col) => col.name === 'generated_kind');
    if (!hasGeneratedKind) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN generated_kind TEXT;');
    }
    const hasSourcePlanId = txTableInfo.some((col) => col.name === 'source_plan_id');
    if (!hasSourcePlanId) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN source_plan_id TEXT;');
    }
    await db.runAsync(
      `UPDATE transactions
       SET generated_kind = 'plan_purchase'
       WHERE generated_kind IS NULL
         AND type = 'expense'
         AND title LIKE 'Beli: %'
         AND (notes = 'Target impian tercapai.' OR notes LIKE 'Target impian tercapai. %')`
    );
  } catch (migErr) {
    console.warn('Migration check warning:', migErr);
  }

  // Insert default wallets if not already populated
  const existingWallets = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets');
  if (!existingWallets || existingWallets.count === 0) {
    const now = Date.now();
    for (const w of DEFAULT_WALLETS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO wallets (id, name, type, initial_balance, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [w.id, w.name, w.type, w.initial_balance, w.icon, w.color, w.is_default, now]
      );
    }
  }

  // Link any orphaned transactions without wallet_id to default wallet
  await db.runAsync("UPDATE transactions SET wallet_id = 'wallet_cash' WHERE wallet_id IS NULL");

  // Default language is English for new installations.
  await db.runAsync(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('language', 'en')`
  );

  // Insert default categories if not already populated
  const existingCat = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!existingCat || existingCat.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, 1)',
        [cat.id, cat.name, cat.type, cat.icon, cat.color]
      );
    }
  } else {
    // Ensure transfer category exists even if categories already seeded
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES ('cat_transfer', 'Transfer Antar Dompet', 'expense', 'swap-horizontal-outline', '#6366F1', 1)"
    );
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

// ------------------- Wallet Operations -------------------

export async function getWallets(db: SQLite.SQLiteDatabase): Promise<Wallet[]> {
  const query = `
    SELECT 
      w.*,
      (
        w.initial_balance 
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'transfer'), 0)
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE destination_wallet_id = w.id AND type = 'transfer'), 0)
      ) as balance
    FROM wallets w
    ORDER BY w.is_default DESC, w.created_at ASC
  `;
  return await db.getAllAsync<Wallet>(query);
}

export async function getWalletById(db: SQLite.SQLiteDatabase, id: string): Promise<Wallet | null> {
  const query = `
    SELECT 
      w.*,
      (
        w.initial_balance 
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'transfer'), 0)
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE destination_wallet_id = w.id AND type = 'transfer'), 0)
      ) as balance
    FROM wallets w
    WHERE w.id = ?
  `;
  return await db.getFirstAsync<Wallet>(query, [id]);
}

export async function addWallet(
  db: SQLite.SQLiteDatabase,
  wallet: Omit<Wallet, 'balance'>
): Promise<void> {
  if (wallet.is_default === 1) {
    await db.runAsync('UPDATE wallets SET is_default = 0 WHERE is_default = 1');
  }
  await db.runAsync(
    'INSERT INTO wallets (id, name, type, initial_balance, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [wallet.id, wallet.name, wallet.type, wallet.initial_balance, wallet.icon, wallet.color, wallet.is_default, wallet.created_at]
  );
}

export async function updateWallet(
  db: SQLite.SQLiteDatabase,
  wallet: Omit<Wallet, 'balance'>
): Promise<void> {
  if (wallet.is_default === 1) {
    await db.runAsync('UPDATE wallets SET is_default = 0 WHERE id != ?', [wallet.id]);
  }
  await db.runAsync(
    'UPDATE wallets SET name = ?, type = ?, initial_balance = ?, icon = ?, color = ?, is_default = ? WHERE id = ?',
    [wallet.name, wallet.type, wallet.initial_balance, wallet.icon, wallet.color, wallet.is_default, wallet.id]
  );
}

export async function deleteWallet(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  // Reassign transactions referencing this wallet to default or fallback wallet
  const fallback = await db.getFirstAsync<Wallet>(
    'SELECT * FROM wallets WHERE id != ? ORDER BY is_default DESC, created_at ASC LIMIT 1',
    [id]
  );
  if (fallback) {
    await db.runAsync('UPDATE transactions SET wallet_id = ? WHERE wallet_id = ?', [fallback.id, id]);
    await db.runAsync('UPDATE transactions SET destination_wallet_id = ? WHERE destination_wallet_id = ?', [fallback.id, id]);
  }
  await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

export async function transferWalletFunds(
  db: SQLite.SQLiteDatabase,
  params: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    date: string;
    notes?: string | null;
  }
): Promise<void> {
  const source = await db.getFirstAsync<Wallet>('SELECT * FROM wallets WHERE id = ?', [params.sourceWalletId]);
  const dest = await db.getFirstAsync<Wallet>('SELECT * FROM wallets WHERE id = ?', [params.destinationWalletId]);

  const title = source && dest
    ? `${source.name} ➔ ${dest.name}`
    : `${params.sourceWalletId} ➔ ${params.destinationWalletId}`;
  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  await db.runAsync(
    `INSERT INTO transactions (id, title, amount, type, category_id, wallet_id, destination_wallet_id, date, notes, created_at)
     VALUES (?, ?, ?, 'transfer', 'cat_transfer', ?, ?, ?, ?, ?)`,
    [txId, title, params.amount, params.sourceWalletId, params.destinationWalletId, params.date, params.notes ?? null, Date.now()]
  );
}

// ------------------- Transaction Operations -------------------

export async function getTransactions(
  db: SQLite.SQLiteDatabase,
  options?: {
    type?: 'income' | 'expense' | 'transfer';
    categoryId?: string;
    walletId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }
): Promise<Transaction[]> {
  let query = `
    SELECT 
      t.*, 
      c.name as category_name, 
      c.icon as category_icon, 
      c.color as category_color,
      w.name as wallet_name,
      w.icon as wallet_icon,
      w.color as wallet_color,
      dw.name as destination_wallet_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN wallets dw ON t.destination_wallet_id = dw.id
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
  if (options?.walletId && options.walletId !== 'all') {
    query += ' AND (t.wallet_id = ? OR t.destination_wallet_id = ?)';
    params.push(options.walletId, options.walletId);
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

export async function getTransactionById(db: SQLite.SQLiteDatabase, id: string): Promise<Transaction | null> {
  return await db.getFirstAsync<Transaction>(
    `SELECT 
       t.*, 
       c.name as category_name, 
       c.icon as category_icon, 
       c.color as category_color,
       w.name as wallet_name,
       w.icon as wallet_icon,
       w.color as wallet_color,
       dw.name as destination_wallet_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     LEFT JOIN wallets dw ON t.destination_wallet_id = dw.id
     WHERE t.id = ?`,
    [id]
  );
}

export async function addTransaction(
  db: SQLite.SQLiteDatabase,
  item: Omit<Transaction, 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions (id, title, amount, type, category_id, wallet_id, destination_wallet_id, date, notes, generated_kind, source_plan_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.title,
      item.amount,
      item.type,
      item.category_id,
      item.wallet_id ?? 'wallet_cash',
      item.destination_wallet_id ?? null,
      item.date,
      item.notes ?? null,
      item.generated_kind ?? null,
      item.source_plan_id ?? null,
      item.created_at,
    ]
  );
}

export async function updateTransaction(
  db: SQLite.SQLiteDatabase,
  item: Omit<Transaction, 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>
): Promise<void> {
  await db.runAsync(
    `UPDATE transactions
     SET title = ?, amount = ?, type = ?, category_id = ?, wallet_id = ?, destination_wallet_id = ?, date = ?, notes = ?,
         generated_kind = CASE WHEN ? = 'expense' THEN generated_kind ELSE NULL END,
         source_plan_id = CASE WHEN ? = 'expense' THEN source_plan_id ELSE NULL END
     WHERE id = ?`,
    [
      item.title,
      item.amount,
      item.type,
      item.category_id,
      item.wallet_id ?? 'wallet_cash',
      item.destination_wallet_id ?? null,
      item.date,
      item.notes ?? null,
      item.type,
      item.type,
      item.id,
    ]
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

  // Calculate real total wallet balance across all wallets
  const wallets = await getWallets(db);
  const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: row?.transactionCount || 0,
    totalWalletBalance,
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

// ------------------- Target Budgeting Operations -------------------

export async function getBudgets(db: SQLite.SQLiteDatabase): Promise<Budget[]> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const query = `
    SELECT 
      b.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(
        (SELECT SUM(t.amount) 
         FROM transactions t 
         WHERE t.type = 'expense' 
           AND t.date LIKE '${yearMonth}%'
           AND (
             (b.category_id IS NULL) 
             OR (t.category_id = b.category_id)
           )
        ), 0
      ) as current_spent
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.category_id IS NULL DESC, current_spent DESC
  `;

  return await db.getAllAsync<Budget>(query);
}

export async function saveBudget(
  db: SQLite.SQLiteDatabase,
  budget: { id: string; category_id: string | null; monthly_limit: number }
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (id, category_id, monthly_limit, created_at)
     VALUES (?, ?, ?, ?)`,
    [budget.id, budget.category_id ?? null, budget.monthly_limit, Date.now()]
  );
}

export async function deleteBudget(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

// ------------------- Financial Plan & Wishlist Operations -------------------

export async function getPlans(
  db: SQLite.SQLiteDatabase,
  options?: { isCompleted?: boolean; isPinned?: boolean }
): Promise<FinancialPlan[]> {
  let query = `
    SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM financial_plans p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.isCompleted !== undefined) {
    query += ' AND p.is_completed = ?';
    params.push(options.isCompleted ? 1 : 0);
  }
  if (options?.isPinned !== undefined) {
    query += ' AND p.is_pinned = ?';
    params.push(options.isPinned ? 1 : 0);
  }

  query += ' ORDER BY p.is_pinned DESC, p.target_amount ASC, p.created_at DESC';
  return await db.getAllAsync<FinancialPlan>(query, params);
}

export async function getPlanById(db: SQLite.SQLiteDatabase, id: string): Promise<FinancialPlan | null> {
  return await db.getFirstAsync<FinancialPlan>(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM financial_plans p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );
}

export async function addPlan(db: SQLite.SQLiteDatabase, plan: FinancialPlan): Promise<void> {
  await db.runAsync(
    `INSERT INTO financial_plans (id, title, target_amount, category_id, target_date, is_pinned, is_completed, completed_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plan.id,
      plan.title,
      plan.target_amount,
      plan.category_id ?? null,
      plan.target_date ?? null,
      plan.is_pinned ?? 0,
      plan.is_completed ?? 0,
      plan.completed_at ?? null,
      plan.notes ?? null,
      plan.created_at || Date.now(),
    ]
  );
}

export async function updatePlan(db: SQLite.SQLiteDatabase, plan: FinancialPlan): Promise<void> {
  await db.runAsync(
    `UPDATE financial_plans 
     SET title = ?, target_amount = ?, category_id = ?, target_date = ?, is_pinned = ?, is_completed = ?, completed_at = ?, notes = ?
     WHERE id = ?`,
    [
      plan.title,
      plan.target_amount,
      plan.category_id ?? null,
      plan.target_date ?? null,
      plan.is_pinned ?? 0,
      plan.is_completed ?? 0,
      plan.completed_at ?? null,
      plan.notes ?? null,
      plan.id,
    ]
  );
}

export async function togglePlanPinned(db: SQLite.SQLiteDatabase, id: string, isPinned: boolean): Promise<void> {
  await db.runAsync('UPDATE financial_plans SET is_pinned = ? WHERE id = ?', [isPinned ? 1 : 0, id]);
}

export async function completePlan(db: SQLite.SQLiteDatabase, id: string, isCompleted: boolean): Promise<void> {
  await db.runAsync(
    'UPDATE financial_plans SET is_completed = ?, completed_at = ? WHERE id = ?',
    [isCompleted ? 1 : 0, isCompleted ? Date.now() : null, id]
  );
}

export async function deletePlan(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM financial_plans WHERE id = ?', [id]);
}

// ------------------- App Settings Operations -------------------

export async function getSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  defaultValue: string = ''
): Promise<string> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// ------------------- Backup & Restore Operations -------------------

export async function exportAllData(db: SQLite.SQLiteDatabase): Promise<BackupData> {
  const [categories, transactions, debts, investments, budgets, plans, wallets, multiWalletVal] = await Promise.all([
    db.getAllAsync<Category>('SELECT * FROM categories'),
    db.getAllAsync<Transaction>('SELECT * FROM transactions'),
    db.getAllAsync<Debt>('SELECT * FROM debts'),
    db.getAllAsync<Investment>('SELECT * FROM investments'),
    db.getAllAsync<Budget>('SELECT * FROM budgets'),
    db.getAllAsync<FinancialPlan>('SELECT * FROM financial_plans'),
    db.getAllAsync<Wallet>('SELECT * FROM wallets'),
    getSetting(db, 'is_multi_wallet_enabled', 'true'),
  ]);

  return {
    version: '1.4.0',
    exported_at: new Date().toISOString(),
    categories,
    transactions,
    debts,
    investments,
    budgets,
    plans,
    wallets,
    settings: {
      isMultiWalletEnabled: multiWalletVal === 'true',
    },
  };
}

export async function importAllData(db: SQLite.SQLiteDatabase, backup: BackupData): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Clear current tables
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM debts;
      DELETE FROM investments;
      DELETE FROM budgets;
      DELETE FROM financial_plans;
      DELETE FROM wallets;
    `);

    // Restore wallets
    if (Array.isArray(backup.wallets)) {
      for (const w of backup.wallets) {
        await db.runAsync(
          'INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [w.id, w.name, w.type, w.initial_balance || 0, w.icon, w.color, w.is_default ?? 0, w.created_at || Date.now()]
        );
      }
    } else {
      // Re-seed default wallets if backup doesn't have wallets
      const now = Date.now();
      for (const w of DEFAULT_WALLETS) {
        await db.runAsync(
          'INSERT OR IGNORE INTO wallets (id, name, type, initial_balance, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [w.id, w.name, w.type, w.initial_balance, w.icon, w.color, w.is_default, now]
        );
      }
    }

    // Restore categories
    if (Array.isArray(backup.categories)) {
      for (const cat of backup.categories) {
        await db.runAsync(
          'INSERT OR REPLACE INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.is_default ?? 0]
        );
      }
    }

    // Restore transactions
    if (Array.isArray(backup.transactions)) {
      for (const t of backup.transactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, title, amount, type, category_id, wallet_id, destination_wallet_id, date, notes, generated_kind, source_plan_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.title,
            t.amount,
            t.type,
            t.category_id,
            t.wallet_id ?? 'wallet_cash',
            t.destination_wallet_id ?? null,
            t.date,
            t.notes ?? null,
            t.generated_kind ?? null,
            t.source_plan_id ?? null,
            t.created_at || Date.now(),
          ]
        );
      }
    }

    // Restore debts
    if (Array.isArray(backup.debts)) {
      for (const d of backup.debts) {
        await db.runAsync(
          `INSERT INTO debts (id, person_name, type, amount, due_date, issue_date, is_paid, paid_date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [d.id, d.person_name, d.type, d.amount, d.due_date ?? null, d.issue_date, d.is_paid, d.paid_date ?? null, d.notes ?? null, d.created_at || Date.now()]
        );
      }
    }

    // Restore investments
    if (Array.isArray(backup.investments)) {
      for (const inv of backup.investments) {
        await db.runAsync(
          `INSERT INTO investments (id, instrument_type, asset_name, buy_price, sell_price, pnl, pnl_percentage, trade_date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [inv.id, inv.instrument_type, inv.asset_name, inv.buy_price, inv.sell_price, inv.pnl, inv.pnl_percentage, inv.trade_date, inv.notes ?? null, inv.created_at || Date.now()]
        );
      }
    }

    // Restore budgets
    if (Array.isArray(backup.budgets)) {
      for (const b of backup.budgets) {
        await db.runAsync(
          'INSERT OR REPLACE INTO budgets (id, category_id, monthly_limit, created_at) VALUES (?, ?, ?, ?)',
          [b.id, b.category_id ?? null, b.monthly_limit, b.created_at || Date.now()]
        );
      }
    }

    // Restore financial plans
    if (Array.isArray(backup.plans)) {
      for (const p of backup.plans) {
        await db.runAsync(
          `INSERT OR REPLACE INTO financial_plans (id, title, target_amount, category_id, target_date, is_pinned, is_completed, completed_at, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.title,
            p.target_amount,
            p.category_id ?? null,
            p.target_date ?? null,
            p.is_pinned ?? 0,
            p.is_completed ?? 0,
            p.completed_at ?? null,
            p.notes ?? null,
            p.created_at || Date.now(),
          ]
        );
      }
    }

    // Restore settings
    if (backup.settings?.isMultiWalletEnabled !== undefined) {
      await setSetting(db, 'is_multi_wallet_enabled', backup.settings.isMultiWalletEnabled ? 'true' : 'false');
    }
  });
}
