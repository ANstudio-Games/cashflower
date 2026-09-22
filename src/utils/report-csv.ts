import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateShort } from '@/utils/format-date';

export interface ReportMetadata {
  businessName?: string;
  reporterName?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Escape CSV string according to RFC 4180
 */
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generate CSV and share via native sharing dialog
 */
export async function exportTransactionsToCsv(
  transactions: Transaction[],
  meta: ReportMetadata
): Promise<string> {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const lines: string[] = [];

  // Header metadata block
  lines.push(`${escapeCsv('LAPORAN ARUS KAS & KEUANGAN CASHFLOWER')}`);
  lines.push(`${escapeCsv('Nama Usaha / Unit')},${escapeCsv(meta.businessName || 'Cashflower')}`);
  lines.push(`${escapeCsv('Dibuat Oleh')},${escapeCsv(meta.reporterName || 'Staf Keuangan')}`);
  lines.push(`${escapeCsv('Periode')},${escapeCsv(meta.periodLabel)}`);
  lines.push(`${escapeCsv('Tanggal Ekspor')},${escapeCsv(new Date().toLocaleString('id-ID'))}`);
  lines.push('');
  lines.push(`${escapeCsv('RINGKASAN KAS')}`);
  lines.push(`${escapeCsv('Total Pemasukan')},${escapeCsv(formatCurrency(totalIncome))}`);
  lines.push(`${escapeCsv('Total Pengeluaran')},${escapeCsv(formatCurrency(totalExpense))}`);
  lines.push(`${escapeCsv('Arus Kas Bersih (Surplus/Defisit)')},${escapeCsv(formatCurrency(netBalance))}`);
  lines.push(`${escapeCsv('Total Transaksi')},${escapeCsv(transactions.length)}`);
  lines.push('');

  // Table header
  lines.push([
    escapeCsv('No'),
    escapeCsv('Tanggal'),
    escapeCsv('Jenis Transaksi'),
    escapeCsv('Dompet / Akun'),
    escapeCsv('Kategori'),
    escapeCsv('Keterangan / Nama Barang'),
    escapeCsv('Nominal (Rp)'),
    escapeCsv('Catatan / Nomor Nota'),
  ].join(','));

  // Table rows
  transactions.forEach((t, idx) => {
    const isIncome = t.type === 'income';
    const isTransfer = t.type === 'transfer';
    const typeLabel = isTransfer ? 'Transfer' : isIncome ? 'Pemasukan' : 'Pengeluaran';
    const walletLabel = isTransfer
      ? `${t.wallet_name || 'Dompet'} ➔ ${t.destination_wallet_name || 'Tujuan'}`
      : (t.wallet_name || 'Dompet Utama');
    const amountStr = isTransfer ? `${t.amount}` : isIncome ? `+${t.amount}` : `-${t.amount}`;

    lines.push([
      escapeCsv(idx + 1),
      escapeCsv(t.date),
      escapeCsv(typeLabel),
      escapeCsv(walletLabel),
      escapeCsv(t.category_name || (isTransfer ? 'Transfer' : 'Lainnya')),
      escapeCsv(t.title),
      escapeCsv(amountStr),
      escapeCsv(t.notes || ''),
    ].join(','));
  });

  // Prepend UTF-8 BOM so Excel opens it with correct Indonesian accents and numbers
  const csvContent = '\uFEFF' + lines.join('\r\n');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  const safeBusiness = (meta.businessName || 'Cashflower').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Keuangan_${safeBusiness}_${dateStr}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Bagikan Laporan Spreadsheet CSV/Excel',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('Fitur berbagi file tidak tersedia di perangkat ini.');
  }

  return fileUri;
}
