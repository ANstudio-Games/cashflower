import type { Transaction } from '@/types';

/** Deterministic sample records for the isolated web demo database. */
export function createDemoTransactions(now = new Date()): Transaction[] {
  const transactions: Transaction[] = [];
  const expenses = [
    ['cat_food', 'Makan & kopi', 55000],
    ['cat_transport', 'Transportasi', 35000],
    ['cat_shopping', 'Belanja kebutuhan', 110000],
    ['cat_bills', 'Tagihan bulanan', 85000],
    ['cat_entertainment', 'Hiburan', 45000],
    ['cat_health', 'Kesehatan', 25000],
  ] as const;
  for (let year = now.getFullYear() - 9; year <= now.getFullYear(); year++) {
    for (let month = 0; month < 12; month++) {
      const lastDay = year === now.getFullYear()
        ? month > now.getMonth() ? 0 : month === now.getMonth() ? now.getDate() : new Date(year, month + 1, 0).getDate()
        : new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const add = (type: 'income' | 'expense', category: string, title: string, amount: number) => {
          transactions.push({
            id: `demo-${date}-${type}`,
            title,
            type,
            category_id: category,
            wallet_id: 'wallet_bank',
            amount,
            date,
            notes: 'Data dummy untuk preview, bukan transaksi asli.',
            created_at: new Date(year, month, day, 12).getTime(),
          });
        };
        const growth = 1 + (year - (now.getFullYear() - 9)) * 0.08;
        if (day === 1) add('income', 'cat_salary', 'Gaji (demo)', Math.round(6500000 * growth));
        if (day === 15) add('income', 'cat_business', 'Freelance (demo)', Math.round((900000 + month * 75000) * growth));
        const [category, title, base] = expenses[(day + month) % expenses.length];
        add('expense', category, `${title} (demo)`, Math.round(base * growth * (0.8 + ((day * 7 + month * 3 + year) % 11) / 10)));
      }
    }
  }
  return transactions;
}
