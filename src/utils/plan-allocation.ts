export function validateAllocation(amount: number, available: number): void {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('allocation_invalid');
  if (amount > available + 0.000001) throw new Error('allocation_insufficient');
}

export function splitPlanPurchase(allocations: { wallet_id: string; amount: number }[], price: number) {
  validateAllocation(price, allocations.reduce((sum, row) => sum + row.amount, 0));
  let remaining = price;
  return allocations.map(row => {
    const amount = Math.min(row.amount, remaining);
    remaining -= amount;
    return { wallet_id: row.wallet_id, amount };
  }).filter(row => row.amount > 0);
}
