import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format-currency';
import {
  formatDateShortForLanguage,
  formatDateTimeForLanguage,
  getCategoryNameForLanguage,
  getTransactionNotesForLanguage,
  getTransactionTitleForLanguage,
  getWalletNameForLanguage,
  translate,
} from '@/i18n';

export interface ReportMetadata {
  language: 'en' | 'id' | 'zh';
  businessName?: string;
  reporterName?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const raw = String(value);
  const safe = typeof value === 'string' && /^[=+\-@]/.test(raw.trimStart())
    ? `'${raw}`
    : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportTransactionsToCsv(
  transactions: Transaction[],
  meta: ReportMetadata
): Promise<string> {
  const language = meta.language;
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(language, key, params);
  const businessName = meta.businessName?.trim() || 'Cashflower';
  const reporterName = meta.reporterName?.trim() || t('export_default_reporter_name');
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const lines: string[] = [];

  lines.push(escapeCsv(t('report_title')));
  lines.push(`${escapeCsv(t('report_business_unit'))},${escapeCsv(businessName)}`);
  lines.push(`${escapeCsv(t('report_created_by'))},${escapeCsv(reporterName)}`);
  lines.push(`${escapeCsv(t('report_period'))},${escapeCsv(meta.periodLabel)}`);
  lines.push(`${escapeCsv(t('report_exported_at'))},${escapeCsv(formatDateTimeForLanguage(new Date(), language))}`);
  lines.push('');
  lines.push(escapeCsv(t('report_cash_summary')));
  lines.push(`${escapeCsv(t('report_total_income'))},${escapeCsv(formatCurrency(totalIncome, language))}`);
  lines.push(`${escapeCsv(t('report_total_expense'))},${escapeCsv(formatCurrency(totalExpense, language))}`);
  lines.push(`${escapeCsv(t('report_net_cashflow'))},${escapeCsv(formatCurrency(netBalance, language))}`);
  lines.push(`${escapeCsv(t('report_total_transactions'))},${escapeCsv(transactions.length)}`);
  lines.push('');
  lines.push([
    escapeCsv(t('report_no')),
    escapeCsv(t('report_date')),
    escapeCsv(t('report_transaction_type')),
    escapeCsv(t('report_wallet_account')),
    escapeCsv(t('report_category')),
    escapeCsv(t('report_description_item')),
    escapeCsv(t('report_amount_idr')),
    escapeCsv(t('report_notes_receipt')),
  ].join(','));

  transactions.forEach((transaction, index) => {
    const isIncome = transaction.type === 'income';
    const isTransfer = transaction.type === 'transfer';
    const typeLabel = isTransfer
      ? t('common_transfer')
      : isIncome
      ? t('common_income')
      : t('common_expense');
    const sourceWallet = getWalletNameForLanguage(language, {
      id: transaction.wallet_id,
      name: transaction.wallet_name,
    });
    const destinationWallet = getWalletNameForLanguage(language, {
      id: transaction.destination_wallet_id,
      name: transaction.destination_wallet_name,
    });
    const walletLabel = isTransfer
      ? `${sourceWallet || t('common_wallet')} ➔ ${destinationWallet || t('common_destination')}`
      : sourceWallet || t('common_primary_wallet');
    const categoryLabel = getCategoryNameForLanguage(language, {
      id: transaction.category_id,
      name: transaction.category_name,
    }) || (isTransfer ? t('common_transfer') : t('common_others'));
    const amount = isTransfer
      ? transaction.amount
      : isIncome
      ? transaction.amount
      : -transaction.amount;

    lines.push([
      escapeCsv(index + 1),
      escapeCsv(formatDateShortForLanguage(transaction.date, language)),
      escapeCsv(typeLabel),
      escapeCsv(walletLabel),
      escapeCsv(categoryLabel),
      escapeCsv(getTransactionTitleForLanguage(transaction, language)),
      escapeCsv(amount),
      escapeCsv(getTransactionNotesForLanguage(transaction, language)),
    ].join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `Cashflower_Report_${dateStr}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: t('report_share_csv_title'),
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('sharing_unavailable');
  }

  return fileUri;
}
