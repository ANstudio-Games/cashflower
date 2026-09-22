import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateShort, formatDateFull } from '@/utils/format-date';
import { ReportMetadata } from './report-csv';

export async function exportTransactionsToPdf(
  transactions: Transaction[],
  meta: ReportMetadata
): Promise<string | null> {
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
  for (const t of transactions) {
    if (t.type === 'expense') {
      const catName = t.category_name || 'Lainnya';
      const color = t.category_color || '#94A3B8';
      const existing = categoryMap.get(catName) || { name: catName, color, total: 0, count: 0 };
      existing.total += t.amount;
      existing.count += 1;
      categoryMap.set(catName, existing);
    }
  }

  const categoryBreakdowns = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  const now = new Date();
  const printDateStr = formatDateFull(now.toISOString().split('T')[0]) + ' ' + 
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // HTML rows for categories
  const categoryRowsHtml = categoryBreakdowns.length > 0
    ? categoryBreakdowns.map((cat) => {
        const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : '0';
        return `
          <tr>
            <td style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${cat.color};"></span>
              <strong>${cat.name}</strong>
            </td>
            <td style="text-align: center;">${cat.count} trx</td>
            <td style="text-align: right; font-weight: 600; color: #0F172A;">${formatCurrency(cat.total)}</td>
            <td style="text-align: right; color: #64748B;">${pct}%</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 12px;">Tidak ada pengeluaran pada periode ini.</td></tr>';

  // HTML rows for transactions
  const transactionRowsHtml = transactions.length > 0
    ? transactions.map((t, idx) => {
        const isInc = t.type === 'income';
        const isTrf = t.type === 'transfer';
        let typeBadge = '';
        if (isTrf) {
          typeBadge = '<span style="background: #EEF2FF; color: #4338CA; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Transfer</span>';
        } else if (isInc) {
          typeBadge = '<span style="background: #ECFDF5; color: #047857; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Masuk</span>';
        } else {
          typeBadge = '<span style="background: #FEF2F2; color: #B91C1C; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Keluar</span>';
        }

        const amountFormatted = isTrf
          ? `<span style="color: #4338CA; font-weight: 700;">${formatCurrency(t.amount)}</span>`
          : isInc
          ? `<span style="color: #047857; font-weight: 700;">+${formatCurrency(t.amount)}</span>`
          : `<span style="color: #B91C1C; font-weight: 700;">-${formatCurrency(t.amount)}</span>`;

        const walletDisplay = isTrf
          ? `${t.wallet_name || 'Dompet'} ➔ ${t.destination_wallet_name || 'Tujuan'}`
          : (t.wallet_name || 'Dompet Utama');

        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="text-align: center; color: #64748B; font-size: 12px;">${idx + 1}</td>
            <td style="white-space: nowrap; font-size: 12px; color: #334155;">${formatDateShort(t.date)}</td>
            <td style="text-align: center;">${typeBadge}</td>
            <td style="font-size: 11px; color: #475569; font-weight: 600;">${walletDisplay}</td>
            <td style="font-size: 12px; color: #475569;">${t.category_name || (isTrf ? 'Transfer' : '-')}</td>
            <td style="font-size: 13px; font-weight: 500; color: #0F172A;">
              ${t.title}
              ${t.notes ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">Nota/Ket: ${t.notes}</div>` : ''}
            </td>
            <td style="text-align: right; white-space: nowrap; font-size: 13px;">${amountFormatted}</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7" style="text-align: center; color: #94A3B8; padding: 20px;">Belum ada catatan transaksi pada periode ini.</td></tr>';

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Keuangan - ${meta.businessName || 'Cashflower'}</title>
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

  <!-- Header -->
  <div class="header-box">
    <div>
      <div class="brand-title">🌸 Cashflower</div>
      <div class="brand-sub">${meta.businessName || 'Laporan Arus Kas Bisnis & Pribadi'}</div>
      <div style="margin-top: 4px; font-size: 12px; color: #475569;">
        Periode: <strong>${meta.periodLabel}</strong>
      </div>
    </div>
    <div class="report-meta">
      <div>Tanggal Cetak: <strong>${printDateStr}</strong></div>
      <div>Dibuat Oleh: <strong>${meta.reporterName || 'Staf / Kasir'}</strong></div>
      <div>Total Transaksi: <strong>${transactions.length} baris</strong></div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="summary-card card-income">
      <div class="card-label">Total Pemasukan</div>
      <div class="card-value val-income">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="summary-card card-expense">
      <div class="card-label">Total Pengeluaran</div>
      <div class="card-value val-expense">${formatCurrency(totalExpense)}</div>
    </div>
    <div class="summary-card card-balance">
      <div class="card-label">Arus Kas Bersih (${isSurplus ? 'Surplus' : 'Defisit'})</div>
      <div class="card-value val-balance">${isSurplus ? '+' : ''}${formatCurrency(netBalance)}</div>
    </div>
  </div>

  <!-- Category Breakdown (if expenses exist) -->
  ${categoryBreakdowns.length > 0 ? `
    <div class="no-break">
      <div class="section-title">📊 Rincian Pengeluaran Berdasarkan Pos / Kategori</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Kategori</th>
            <th style="text-align: center;">Frekuensi</th>
            <th style="text-align: right;">Total Pengeluaran</th>
            <th style="text-align: right;">Porsi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRowsHtml}
        </tbody>
      </table>
    </div>
  ` : ''}

  <!-- Transaction Detail Table -->
  <div class="no-break">
    <div class="section-title">📋 Riwayat Rincian Mutasi Kas (${meta.periodLabel})</div>
    <table>
      <thead>
        <tr>
          <th style="width: 28px; text-align: center;">No</th>
          <th style="width: 80px; text-align: left;">Tanggal</th>
          <th style="width: 70px; text-align: center;">Jenis</th>
          <th style="width: 95px; text-align: left;">Dompet/Akun</th>
          <th style="width: 100px; text-align: left;">Kategori</th>
          <th style="text-align: left;">Keterangan & Catatan</th>
          <th style="width: 105px; text-align: right;">Nominal</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Signatures Block for Proof and SOP -->
  <div class="signature-grid">
    <div class="sig-box">
      <div class="sig-role">Dibuat & Dilaporkan Oleh:</div>
      <div class="sig-name">${meta.reporterName || 'Staf Keuangan / Kasir'}</div>
      <div class="sig-sub">Penanggung Jawab Input</div>
    </div>
    <div class="sig-box">
      <div class="sig-role">Mengetahui & Disetujui Oleh:</div>
      <div class="sig-name">................................................</div>
      <div class="sig-sub">Atasan / Pemilik Usaha</div>
    </div>
  </div>

  <!-- Footer Notice -->
  <div class="footer-note">
    Laporan ini dibuat otomatis menggunakan <strong>Cashflower</strong> (100% Offline-First Accounting System).<br>
    Data tersimpan terenkripsi pada perangkat lokal. Dokumen sah untuk rekonsiliasi kas internal.
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
      dialogTitle: `Laporan Keuangan - ${meta.businessName || 'Cashflower'}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Fitur berbagi file tidak tersedia di perangkat ini.');
  }

  return uri;
}
