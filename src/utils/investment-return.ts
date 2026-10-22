/** Full-position, unleveraged return before fees and taxes. Prices share one currency. */
export function calculateInvestmentReturn(capital: number, buyPrice: number, sellPrice: number) {
  if (![capital, buyPrice, sellPrice].every(Number.isFinite) || capital <= 0 || buyPrice <= 0 || sellPrice < 0) {
    throw new RangeError('Invalid investment capital or prices');
  }
  const units = capital / buyPrice;
  const finalValue = capital * (sellPrice / buyPrice);
  const pnl = finalValue - capital;
  const pnlPercentage = (sellPrice / buyPrice - 1) * 100;
  if (![units, finalValue, pnl, pnlPercentage].every(Number.isFinite)) {
    throw new RangeError('Investment return exceeds supported range');
  }
  return { units, finalValue, pnl, pnlPercentage };
}
