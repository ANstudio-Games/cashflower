interface CashflowEntry {
  type: string;
  amount: number;
}

/** Report-period cash flow is distinct from the current, unfiltered wallet balance. */
export function getReportSummary(transactions: CashflowEntry[], currentWalletBalance: number) {
  const totalIncome = transactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : 0), 0);
  const totalExpense = transactions.reduce((sum, item) => sum + (item.type === 'expense' ? item.amount : 0), 0);
  return {
    totalIncome,
    totalExpense,
    netCashflow: totalIncome - totalExpense,
    currentWalletBalance,
  };
}
