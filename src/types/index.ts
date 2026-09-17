export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Ionicons glyph name
  color: string;
  is_default: number;
}

export interface Transaction {
  id: string;
  title: string;       // Nama barang atau sumber uang
  amount: number;      // Nominal Rp
  type: TransactionType;
  category_id: string;
  date: string;        // YYYY-MM-DD
  notes?: string | null;
  created_at: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export type DebtType = 'receivable' | 'payable'; 
// receivable: Piutang (Orang berhutang ke kita / kita menagih)
// payable: Hutang (Kita berhutang ke orang / kita membayar)

export interface Debt {
  id: string;
  person_name: string;
  type: DebtType;
  amount: number;
  due_date?: string | null;   // YYYY-MM-DD
  issue_date: string;        // YYYY-MM-DD
  is_paid: number;           // 0: belum lunas, 1: lunas
  paid_date?: string | null;
  notes?: string | null;
  created_at: number;
}

export type InvestmentInstrument = 'saham' | 'kripto' | 'forex' | 'reksadana' | 'emas' | 'lainnya';

export interface Investment {
  id: string;
  instrument_type: InvestmentInstrument;
  asset_name: string;       // e.g. BBCA, BTC/USDT, EUR/USD, Emas Antam
  buy_price: number;        // Modal / Nilai Beli
  sell_price: number;       // Nilai Jual / Penutupan
  pnl: number;              // Profit atau Loss nominal (sell - buy)
  pnl_percentage: number;   // ((sell - buy) / buy) * 100
  trade_date: string;       // YYYY-MM-DD
  notes?: string | null;
  created_at: number;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface DebtSummary {
  totalReceivable: number; // Piutang aktif
  totalPayable: number;    // Hutang aktif
  unpaidCount: number;
}

export interface InvestmentSummary {
  totalCapital: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  netReturnPercentage: number;
}
