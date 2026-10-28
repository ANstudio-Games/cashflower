import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run the actual form handlers without mounting native views or the AdMob SDK.
function getHandler(file: string, name: string, scope: Record<string, any>) {
  const source = ts.createSourceFile(file, readFileSync(`src/app/modal/${file}.tsx`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler = '';
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) handler = node.initializer!.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(handler);
  const js = ts.transpileModule(`const handler = ${handler};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(scope), `${js}; return handler;`)(...Object.values(scope));
}

const editCases = [
  ['add-transaction', 'handleSubmit', 'editTransaction', 'transaction'],
  ['add-wallet', 'handleSubmit', 'editWallet', 'wallet'],
  ['add-plan', 'handleSubmit', 'editPlan', 'plan'],
  ['add-investment', 'handleSave', 'editInvestment', 'trading'],
  ['budget', 'handleSave', 'saveNewBudget', 'budget'],
];
for (const [file, handler, save, category] of editCases) {
  for (const fails of [false, true]) it(`${file}: edited save ${fails ? 'failure skips ads' : 'attempts one ad before completion'}`, async () => {
    const events: string[] = [];
    const noop = () => {};
    const scope = {
      db: {}, isEditing: true, params: { id: 'existing' }, id: 'existing', existing: {}, isLegacy: false,
      transactions: [], isMultiWalletEnabled: false, wallets: [], rawAmount: '100', title: 'Test',
      date: '2026-01-01', isValidISODate: () => true, selectedCategory: 'global', notes: '',
      type: 'expense', existingCreatedAt: 1, name: 'Test', rawInitialBalance: '100', icon: 'star', color: '#fff', isDefault: false,
      parsedAmount: 100, existingPlan: {}, targetDate: '', isPinned: false,
      capital: 100, buyPrice: 10, sellPrice: 12, rawSell: '12', result: { pnl: 20 }, assetName: 'TEST', instrument: 'stock', tradeDate: '2026-01-01',
      rawLimit: '100', budgets: [{ id: 'budget_global' }], setRawLimit: noop,
      t: (key: string) => key, Alert: { alert: () => events.push('finish') }, console: { error: noop },
      router: { back: () => events.push('finish') },
      [save]: async () => { events.push('save'); if (fails) throw new Error('database failed'); },
      handleSavedWithAd: async (_db: unknown, kind: string, finish: () => void) => { events.push(kind); finish(); },
      handleTransactionSavedWithAd: async (_db: unknown, finish: () => void) => { events.push('transaction'); finish(); },
    };
    await getHandler(file, handler, scope)();
    assert.deepEqual(events, fails ? ['save', 'finish'] : ['save', category, 'finish']);
  });
}

const cases = [
  ['add-category', 'handleSave', 'createCategory', 'category'],
  ['add-wallet', 'handleSubmit', 'createWallet', 'wallet'],
  ['add-plan', 'handleSubmit', 'createPlan', 'plan'],
  ['budget', 'handleSave', 'saveNewBudget', 'budget'],
  ['transfer-funds', 'handleSubmit', 'transferBetweenWallets', 'transfer'],
  ['debt-detail', 'handleSavePayment', 'createDebtPayment', 'debt-payment'],
];
for (const [file, handler, save, category] of cases) {
  for (const fails of [false, true]) it(`${file}: ${fails ? 'failed save skips ads' : 'successful save attempts one ad after persistence'}`, async () => {
    const events: string[] = [];
    const noop = () => {};
    const scope: Record<string, any> = {
      db: {}, name: 'Test', title: 'Test', type: 'cash', selectedIcon: 'star', selectedColor: '#fff',
      isEditing: false, params: {}, rawInitialBalance: '100', icon: 'star', color: '#fff', isDefault: false,
      parsedAmount: 100, selectedCategory: 'global', targetDate: '', isPinned: true, notes: '', rawLimit: '100', budgets: [],
      sourceId: 'a', destId: 'b', transferAmount: 100, date: '2026-01-01', isValidISODate: () => true,
      paymentDate: '2026-01-01', rawAmount: '100', remainingAmount: 200, selectedWalletId: 'a', wallets: [], debt: { id: 'debt1' },
      t: (key: string) => key, Alert: { alert: noop }, console: { error: noop }, router: { back: noop },
      setRawLimit: noop, setIsSubmitting: noop, setShowPaymentForm: noop, setRawAmount: noop, setNotes: noop, loadPayments: async () => {},
      [save]: async () => { events.push('save'); if (fails) throw new Error('database failed'); },
      handleSavedWithAd: async (_db: unknown, kind: string, finish: () => void) => { events.push(kind); finish(); },
    };
    await getHandler(file, handler, scope)();
    assert.deepEqual(events, fails ? ['save'] : ['save', category]);
  });
}
