export function savingsRate(income: number, expense: number): number | null {
  if (!Number.isFinite(income) || !Number.isFinite(expense) || income <= 0) return null;
  return ((income - expense) / income) * 100;
}
