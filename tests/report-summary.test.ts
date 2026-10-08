import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReportSummary } from '../src/utils/report-summary';

test('CSV keeps current wallet funds distinct from filtered cash flow and transfers', () => {
  const result = getReportSummary([
    { type: 'income', amount: 100 },
    { type: 'expense', amount: 40 },
    { type: 'transfer', amount: 500 },
  ], 1060);
  assert.deepEqual(result, { totalIncome: 100, totalExpense: 40, netCashflow: 60, currentWalletBalance: 1060 });
  assert.equal(getReportSummary([{ type: 'expense', amount: 40 }], 1060).currentWalletBalance, 1060);
  assert.equal(getReportSummary([], -25).currentWalletBalance, -25);
});

test('CSV renders the current wallet balance and export supplies the unfiltered wallet total', () => {
  const csv = readFileSync('src/utils/report-csv.ts', 'utf8');
  assert.match(csv, /report_current_wallet_balance/);
  assert.match(csv, /formatCurrency\(summary.currentWalletBalance, language\)/);
  const screen = readFileSync('src/app/modal/export-report.tsx', 'utf8');
  assert.match(screen, /currentWalletBalance: wallets.reduce/);
});
