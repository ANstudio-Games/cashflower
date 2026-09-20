import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateShort, getTodayISO, formatMonthYear } from '@/utils/format-date';
import { exportTransactionsToPdf } from '@/utils/report-pdf';
import { exportTransactionsToCsv } from '@/utils/report-csv';

type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'all' | 'custom';
type ExportFormat = 'pdf' | 'csv';

export default function ExportReportModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const { transactions } = useFinance();

  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [businessName, setBusinessName] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState(getTodayISO());
  const [isExporting, setIsExporting] = useState(false);

  // Compute date range based on preset
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (period === 'this_month') {
      const start = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        startDate: start,
        endDate: end,
        periodLabel: formatMonthYear(start),
      };
    }

    if (period === 'last_month') {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();
      const start = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      const end = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        startDate: start,
        endDate: end,
        periodLabel: formatMonthYear(start),
      };
    }

    if (period === 'last_3_months') {
      const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
      const start = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
      const end = getTodayISO();
      return {
        startDate: start,
        endDate: end,
        periodLabel: `3 Bulan Terakhir (${formatDateShort(start)} - ${formatDateShort(end)})`,
      };
    }

    if (period === 'all') {
      return {
        startDate: '',
        endDate: '',
        periodLabel: 'Seluruh Riwayat Transaksi',
      };
    }

    // Custom
    const s = customStart.trim() || 'Awal Catatan';
    const e = customEnd.trim() || getTodayISO();
    return {
      startDate: customStart.trim(),
      endDate: customEnd.trim(),
      periodLabel: `${s} s/d ${e}`,
    };
  }, [period, customStart, customEnd]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }
      if (startDate && t.date < startDate) {
        return false;
      }
      if (endDate && t.date > endDate) {
        return false;
      }
      return true;
    });
  }, [transactions, filterType, startDate, endDate]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert('Data Kosong', 'Tidak ada transaksi yang sesuai dengan filter periode ini untuk diekspor.');
      return;
    }

    try {
      setIsExporting(true);
      const meta = {
        businessName: businessName.trim() || 'Cashflower Accounting',
        reporterName: reporterName.trim() || 'Staf / Kasir',
        periodLabel,
        startDate,
        endDate,
      };

      if (format === 'pdf') {
        await exportTransactionsToPdf(filteredTransactions, meta);
      } else {
        await exportTransactionsToCsv(filteredTransactions, meta);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      Alert.alert('Gagal Mengekspor', err?.message || 'Terjadi kesalahan saat membuat dokumen laporan.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Ekspor Laporan Keuangan</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Format Selector */}
          <Text style={styles.sectionTitle}>PILIH FORMAT LAPORAN</Text>
          <View style={styles.formatRow}>
            <Pressable
              style={[
                styles.formatCard,
                format === 'pdf' && styles.formatCardActive,
                shadowStyles.sm,
              ]}
              onPress={() => setFormat('pdf')}>
              <View style={[styles.formatIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="document-text" size={26} color="#DC2626" />
              </View>
              <Text style={styles.formatTitle}>Dokumen PDF</Text>
              <Text style={styles.formatDesc}>Laporan resmi siap print, kop surat, rincian kategori & lembar tanda tangan.</Text>
              {format === 'pdf' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.formatCard,
                format === 'csv' && styles.formatCardActive,
                shadowStyles.sm,
              ]}
              onPress={() => setFormat('csv')}>
              <View style={[styles.formatIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="grid" size={26} color="#059669" />
              </View>
              <Text style={styles.formatTitle}>Excel / CSV</Text>
              <Text style={styles.formatDesc}>Format tabel data mentah yang dapat diolah di Microsoft Excel & Google Sheets.</Text>
              {format === 'csv' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </Pressable>
          </View>

          {/* Period Selector */}
          <Text style={styles.sectionTitle}>PERIODE LAPORAN</Text>
          <View style={styles.presetWrap}>
            {[
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
              { id: 'last_3_months', label: '3 Bulan' },
              { id: 'all', label: 'Semua' },
              { id: 'custom', label: 'Kustom' },
            ].map((p) => {
              const active = period === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => setPeriod(p.id as PeriodPreset)}>
                  <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Date Inputs if 'custom' */}
          {period === 'custom' && (
            <View style={styles.customDateBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tanggal Mulai (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 2026-09-01"
                  placeholderTextColor={colors.textMuted}
                  value={customStart}
                  onChangeText={setCustomStart}
                  maxLength={10}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tanggal Akhir (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 2026-09-30"
                  placeholderTextColor={colors.textMuted}
                  value={customEnd}
                  onChangeText={setCustomEnd}
                  maxLength={10}
                />
              </View>
            </View>
          )}

          {/* Filter Type */}
          <Text style={styles.sectionTitle}>JENIS TRANSAKSI</Text>
          <View style={styles.typeRow}>
            {[
              { id: 'all', label: 'Semua (Masuk & Keluar)' },
              { id: 'expense', label: 'Hanya Pengeluaran' },
              { id: 'income', label: 'Hanya Pemasukan' },
            ].map((t) => {
              const active = filterType === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setFilterType(t.id as any)}>
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Metadata Inputs */}
          <Text style={styles.sectionTitle}>INFORMASI KOP LAPORAN (OPSIONAL)</Text>
          <View style={styles.metaCard}>
            <View style={styles.metaField}>
              <Text style={styles.inputLabel}>Nama Usaha / Toko / Proyek</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Toko Berkah / Kasir Cabang 1"
                placeholderTextColor={colors.textMuted}
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.inputLabel}>Nama Pelapor / Kasir</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Budi (Kasir)"
                placeholderTextColor={colors.textMuted}
                value={reporterName}
                onChangeText={setReporterName}
              />
            </View>
          </View>

          {/* Live Summary Preview */}
          <Text style={styles.sectionTitle}>RINGKASAN DATA YANG DIEKSPOR</Text>
          <View style={[styles.summaryCard, shadowStyles.sm]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryPeriodLabel}>{periodLabel}</Text>
                <Text style={styles.summaryCount}>{summary.count} Transaksi Terpilih</Text>
              </View>
              <View
                style={[
                  styles.badgeBalance,
                  { backgroundColor: summary.balance >= 0 ? colors.primarySoft : colors.expenseSoft },
                ]}>
                <Text
                  style={[
                    styles.badgeBalanceText,
                    { color: summary.balance >= 0 ? colors.primaryDark : colors.expenseDark },
                  ]}>
                  {summary.balance >= 0 ? 'Surplus' : 'Defisit'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Pemasukan</Text>
                <Text style={[styles.statVal, { color: colors.income }]}>
                  {formatCurrency(summary.income)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Pengeluaran</Text>
                <Text style={[styles.statVal, { color: colors.expense }]}>
                  {formatCurrency(summary.expense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Export Button */}
          <Pressable
            style={({ pressed }) => [
              styles.exportBtn,
              isExporting && styles.exportBtnDisabled,
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleExport}
            disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={format === 'pdf' ? 'share-social-outline' : 'download-outline'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.exportBtnText}>
                  {format === 'pdf' ? 'Cetak & Bagikan Laporan PDF' : 'Ekspor & Bagikan Spreadsheet CSV'}
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.helperNotice}>
            💡 Dokumen akan diproses secara instan di perangkat lokal tanpa internet, dan dapat langsung Anda kirim via WhatsApp, email, atau simpan ke Google Drive.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 10,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  formatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  formatCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  formatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  formatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  formatDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customDateBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  metaCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: 10,
  },
  metaField: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPeriodLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  summaryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeBalance: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeBalanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  exportBtnDisabled: {
    opacity: 0.7,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperNotice: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
