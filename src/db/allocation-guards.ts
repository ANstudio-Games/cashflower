// Check final balances, including edits/deletions of income and incoming transfers.
// Trigger abort rolls back the statement (and its enclosing purchase transaction).
export const ALLOCATION_GUARDS_SQL = ['INSERT', 'UPDATE', 'DELETE'].map(event => `
CREATE TRIGGER IF NOT EXISTS protect_allocations_${event.toLowerCase()}
AFTER ${event} ON transactions
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM wallets w
    WHERE COALESCE((SELECT SUM(amount) FROM plan_allocations WHERE wallet_id = w.id), 0) > 0
    AND w.initial_balance
      + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0)
      - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type IN ('expense','transfer')), 0)
      + COALESCE((SELECT SUM(amount) FROM transactions WHERE destination_wallet_id = w.id AND type = 'transfer'), 0)
      < (SELECT SUM(amount) FROM plan_allocations WHERE wallet_id = w.id) - 0.000001
  ) THEN RAISE(ABORT, 'allocation_insufficient') END;
END;
`).join('\n') + `
CREATE TRIGGER IF NOT EXISTS protect_allocated_wallet_delete
BEFORE DELETE ON wallets WHEN EXISTS (SELECT 1 FROM plan_allocations WHERE wallet_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'allocation_wallet_reserved'); END;
CREATE TRIGGER IF NOT EXISTS protect_allocated_wallet_edit
BEFORE UPDATE OF initial_balance ON wallets
WHEN EXISTS (SELECT 1 FROM plan_allocations WHERE wallet_id = OLD.id)
AND NEW.initial_balance < OLD.initial_balance
BEGIN SELECT RAISE(ABORT, 'allocation_wallet_reserved'); END;
`;
