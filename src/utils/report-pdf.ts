import { Platform } from 'react-native';
import * as Print from 'expo-print';
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
import { ReportMetadata } from './report-csv';

export async function exportTransactionsToPdf(
  transactions: Transaction[],
  meta: ReportMetadata
): Promise<string | null> {
  const language = meta.language;
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(language, key, params);
  const businessName = meta.businessName?.trim() || 'Cashflower';
  const reporterName = meta.reporterName?.trim() || t('export_default_reporter_name');
  const escapeHtml = (value: string | number) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const isSurplus = netBalance >= 0;

  // Category expense breakdown
  const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
  for (const transaction of transactions) {
    if (transaction.type === 'expense') {
      const catName = getCategoryNameForLanguage(language, {
        id: transaction.category_id,
        name: transaction.category_name,
      }) || t('common_others');
      const color = /^#[0-9A-Fa-f]{6}$/.test(transaction.category_color || '')
        ? transaction.category_color!
        : '#94A3B8';
      const existing = categoryMap.get(catName) || { name: catName, color, total: 0, count: 0 };
      existing.total += transaction.amount;
      existing.count += 1;
      categoryMap.set(catName, existing);
    }
  }

  const categoryBreakdowns = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  const printDateStr = formatDateTimeForLanguage(new Date(), language);

  // HTML rows for categories
  const categoryRowsHtml = categoryBreakdowns.length > 0
    ? categoryBreakdowns.map((cat) => {
        const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : '0';
        return `
          <tr>
            <td style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${cat.color};"></span>
              <strong>${escapeHtml(cat.name)}</strong>
            </td>
            <td style="text-align: center;">${escapeHtml(t('report_short_tx_count', { count: cat.count }))}</td>
            <td style="text-align: right; font-weight: 600; color: #0F172A;">${escapeHtml(formatCurrency(cat.total, language))}</td>
            <td style="text-align: right; color: #64748B;">${pct}%</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 12px;">${escapeHtml(t('report_no_expenses_period'))}</td></tr>`;

  const transactionRowsHtml = transactions.length > 0
    ? transactions.map((transaction, index) => {
        const isIncome = transaction.type === 'income';
        const isTransfer = transaction.type === 'transfer';
        const typeBadge = isTransfer
          ? `<span style="background: #EEF2FF; color: #4338CA; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">${escapeHtml(t('common_transfer'))}</span>`
          : isIncome
          ? `<span style="background: #ECFDF5; color: #047857; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">${escapeHtml(t('common_income'))}</span>`
          : `<span style="background: #FEF2F2; color: #B91C1C; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">${escapeHtml(t('common_expense'))}</span>`;
        const amountFormatted = isTransfer
          ? `<span style="color: #4338CA; font-weight: 700;">${escapeHtml(formatCurrency(transaction.amount, language))}</span>`
          : isIncome
          ? `<span style="color: #047857; font-weight: 700;">+${escapeHtml(formatCurrency(transaction.amount, language))}</span>`
          : `<span style="color: #B91C1C; font-weight: 700;">-${escapeHtml(formatCurrency(transaction.amount, language))}</span>`;
        const sourceWallet = getWalletNameForLanguage(language, {
          id: transaction.wallet_id,
          name: transaction.wallet_name,
        });
        const destinationWallet = getWalletNameForLanguage(language, {
          id: transaction.destination_wallet_id,
          name: transaction.destination_wallet_name,
        });
        const walletDisplay = isTransfer
          ? `${sourceWallet || t('common_wallet')} ➔ ${destinationWallet || t('common_destination')}`
          : sourceWallet || t('common_primary_wallet');
        const categoryDisplay = getCategoryNameForLanguage(language, {
          id: transaction.category_id,
          name: transaction.category_name,
        }) || (isTransfer ? t('common_transfer') : '-');
        const title = getTransactionTitleForLanguage(transaction, language);
        const notes = getTransactionNotesForLanguage(transaction, language);

        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="text-align: center; color: #64748B; font-size: 12px;">${index + 1}</td>
            <td style="white-space: nowrap; font-size: 12px; color: #334155;">${escapeHtml(formatDateShortForLanguage(transaction.date, language))}</td>
            <td style="text-align: center;">${typeBadge}</td>
            <td style="font-size: 11px; color: #475569; font-weight: 600;">${escapeHtml(walletDisplay)}</td>
            <td style="font-size: 12px; color: #475569;">${escapeHtml(categoryDisplay)}</td>
            <td style="font-size: 13px; font-weight: 500; color: #0F172A;">
              ${escapeHtml(title)}
              ${notes ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${escapeHtml(t('report_note_prefix', { notes }))}</div>` : ''}
            </td>
            <td style="text-align: right; white-space: nowrap; font-size: 13px;">${amountFormatted}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="7" style="text-align: center; color: #94A3B8; padding: 20px;">${escapeHtml(t('report_no_transactions_period'))}</td></tr>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(t('report_html_title', { business: businessName }))}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #FFFFFF;
      color: #0F172A;
      padding: 32px;
      font-size: 13px;
      line-height: 1.5;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-break {
        page-break-inside: avoid;
      }
    }
    .header-box {
      border-bottom: 2px solid #0D9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-sub {
      font-size: 13px;
      color: #0D9488;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .report-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-card {
      border-radius: 8px;
      padding: 14px 16px;
      border: 1px solid #E2E8F0;
    }
    .card-income {
      background: #F0FDF4;
      border-color: #86EFAC;
    }
    .card-expense {
      background: #FEF2F2;
      border-color: #FCA5A5;
    }
    .card-balance {
      background: ${isSurplus ? '#F0FDFA' : '#FFF1F2'};
      border-color: ${isSurplus ? '#5EEAD4' : '#FECDD3'};
    }
    .card-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 18px;
      font-weight: 800;
    }
    .val-income { color: #047857; }
    .val-expense { color: #B91C1C; }
    .val-balance { color: ${isSurplus ? '#0F766E' : '#BE123C'}; }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background-color: #F1F5F9;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 8px;
      border-top: 1px solid #E2E8F0;
      border-bottom: 1px solid #CBD5E1;
    }
    td {
      padding: 10px 8px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      padding: 12px;
    }
    .sig-role {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 70px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 13px;
      color: #0F172A;
      border-top: 1px solid #94A3B8;
      display: inline-block;
      padding-top: 4px;
      min-width: 180px;
    }
    .sig-sub {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }

    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      margin-top: 30px;
      border-top: 1px dashed #E2E8F0;
      padding-top: 12px;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div>
      <div class="brand-title">🌸 Cashflower</div>
      <div class="brand-sub">${escapeHtml(businessName)}</div>
      <div style="margin-top: 4px; font-size: 12px; color: #475569;">
        ${escapeHtml(t('report_period'))}: <strong>${escapeHtml(meta.periodLabel)}</strong>
      </div>
    </div>
    <div class="report-meta">
      <div>${escapeHtml(t('report_print_date'))}: <strong>${escapeHtml(printDateStr)}</strong></div>
      <div>${escapeHtml(t('report_created_by'))}: <strong>${escapeHtml(reporterName)}</strong></div>
      <div>${escapeHtml(t('report_total_transactions'))}: <strong>${escapeHtml(t('report_transaction_rows', { count: transactions.length }))}</strong></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card card-income">
      <div class="card-label">${escapeHtml(t('report_total_income'))}</div>
      <div class="card-value val-income">${escapeHtml(formatCurrency(totalIncome, language))}</div>
    </div>
    <div class="summary-card card-expense">
      <div class="card-label">${escapeHtml(t('report_total_expense'))}</div>
      <div class="card-value val-expense">${escapeHtml(formatCurrency(totalExpense, language))}</div>
    </div>
    <div class="summary-card card-balance">
      <div class="card-label">${escapeHtml(t('report_net_cashflow'))} (${escapeHtml(t(isSurplus ? 'export_badge_surplus' : 'export_badge_deficit'))})</div>
      <div class="card-value val-balance">${isSurplus ? '+' : ''}${escapeHtml(formatCurrency(netBalance, language))}</div>
    </div>
  </div>

  ${categoryBreakdowns.length > 0 ? `
    <div class="no-break">
      <div class="section-title">📊 ${escapeHtml(t('report_category_breakdown'))}</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">${escapeHtml(t('report_category'))}</th>
            <th style="text-align: center;">${escapeHtml(t('report_frequency'))}</th>
            <th style="text-align: right;">${escapeHtml(t('report_total_expense'))}</th>
            <th style="text-align: right;">${escapeHtml(t('report_share_percentage'))}</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRowsHtml}
        </tbody>
      </table>
    </div>
  ` : ''}

  <div class="no-break">
    <div class="section-title">📋 ${escapeHtml(t('report_transaction_history', { period: meta.periodLabel }))}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 28px; text-align: center;">${escapeHtml(t('report_no'))}</th>
          <th style="width: 80px; text-align: left;">${escapeHtml(t('report_date'))}</th>
          <th style="width: 70px; text-align: center;">${escapeHtml(t('report_transaction_type'))}</th>
          <th style="width: 95px; text-align: left;">${escapeHtml(t('report_wallet_account'))}</th>
          <th style="width: 100px; text-align: left;">${escapeHtml(t('report_category'))}</th>
          <th style="text-align: left;">${escapeHtml(t('report_description_item'))}</th>
          <th style="width: 105px; text-align: right;">${escapeHtml(t('report_amount_idr'))}</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRowsHtml}
      </tbody>
    </table>
  </div>

  <div class="signature-grid">
    <div class="sig-box">
      <div class="sig-role">${escapeHtml(t('report_prepared_by'))}</div>
      <div class="sig-name">${escapeHtml(reporterName)}</div>
      <div class="sig-sub">${escapeHtml(t('report_input_responsible'))}</div>
    </div>
    <div class="sig-box">
      <div class="sig-role">${escapeHtml(t('report_approved_by'))}</div>
      <div class="sig-name">................................................</div>
      <div class="sig-sub">${escapeHtml(t('report_supervisor_owner'))}</div>
    </div>
  </div>

  <div class="footer-note">
    ${escapeHtml(t('report_footer_line1'))}<br>
    ${escapeHtml(t('report_footer_line2'))}
  </div>

</body>
</html>
  `;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html: htmlContent });
    return null;
  }

  // Print to temporary PDF file
  const { uri } = await Print.printToFileAsync({ html: htmlContent });

  // Share file via native Android/iOS share sheet
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: t('report_share_pdf_title'),
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('sharing_unavailable');
  }

  return uri;
}
