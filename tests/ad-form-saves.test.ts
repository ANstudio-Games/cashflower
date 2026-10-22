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
