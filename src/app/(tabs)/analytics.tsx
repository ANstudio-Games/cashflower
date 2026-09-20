import React, { useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { CashflowBarChart } from '@/components/cashflow-bar-chart';
import { CategoryDonutChart } from '@/components/category-donut-chart';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

// Error boundary to prevent any chart error from crashing the entire app
class ChartErrorBoundary extends Component<{ children: ReactNode; title: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Chart render error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
          <Text style={styles.errorText}>Grafik sementara tidak dapat ditampilkan.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { transactions, categories, cashflowSummary } = useFinance();

  // Safe category breakdown calculation
  const categoryBreakdown = useMemo(() => {
    const safeTxs = Array.isArray(transactions) ? transactions : [];
    const safeCats = Array.isArray(categories) ? categories : [];
    const expenseTxs = safeTxs.filter((t) => t?.type === 'expense');
    const totalExpense = expenseTxs.reduce((sum, t) => sum + (t?.amount || 0), 0);
    if (totalExpense <= 0) return [];

    const map = new Map<string, number>();
    for (const t of expenseTxs) {
      if (t?.category_id) {
        map.set(t.category_id, (map.get(t.category_id) || 0) + (t.amount || 0));
      }
    }

    const items = Array.from(map.entries()).map(([catId, amount]) => {
      const cat = safeCats.find((c) => c.id === catId);
      return {
        categoryId: catId,
        name: cat?.name || 'Lainnya',
        color: cat?.color || colors.expense,
        icon: cat?.icon || 'grid-outline',
        total: amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    });

    items.sort((a, b) => b.total - a.total);
    return items;
  }, [transactions, categories]);

  // Safe savings rate calculation
  const savingsRate = useMemo(() => {
    const income = cashflowSummary?.totalIncome || 0;
    const expense = cashflowSummary?.totalExpense || 0;
    if (income <= 0) return 0;
    const saved = income - expense;
    const rate = (saved / income) * 100;
    return isNaN(rate) ? 0 : Math.max(0, Math.min(100, rate));
  }, [cashflowSummary]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Grafik & Analisis</Text>
          <Text style={styles.headerSubtitle}>Visualisasi arus kas dan pola pengeluaran</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.exportHeaderBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/export-report')}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.exportHeaderBtnText}>Ekspor</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Cards Row */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, shadowStyles.sm]}>
            <Text style={styles.kpiLabel}>Total Masuk</Text>
            <Text style={[styles.kpiValue, { color: colors.incomeDark }]}>
              {formatCurrency(cashflowSummary?.totalIncome || 0)}
            </Text>
            <View style={[styles.kpiPill, { backgroundColor: colors.incomeSoft }]}>
              <Ionicons name="arrow-down" size={12} color={colors.incomeDark} />
              <Text style={[styles.kpiPillText, { color: colors.incomeDark }]}>Arus Masuk</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, shadowStyles.sm]}>
            <Text style={styles.kpiLabel}>Total Belanja</Text>
            <Text style={[styles.kpiValue, { color: colors.expenseDark }]}>
              {formatCurrency(cashflowSummary?.totalExpense || 0)}
            </Text>
            <View style={[styles.kpiPill, { backgroundColor: colors.expenseSoft }]}>
              <Ionicons name="arrow-up" size={12} color={colors.expenseDark} />
              <Text style={[styles.kpiPillText, { color: colors.expenseDark }]}>Pengeluaran</Text>
            </View>
          </View>
        </View>

        {/* Savings Rate Card */}
        <View style={[styles.savingsCard, shadowStyles.sm]}>
          <View style={styles.savingsHeader}>
            <View>
              <Text style={styles.savingsTitle}>Tingkat Penghematan</Text>
              <Text style={styles.savingsSub}>Persentase sisa uang kas dari pemasukan</Text>
            </View>
            <Text style={styles.savingsPercent}>{savingsRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.savingsTrack}>
            <View style={[styles.savingsFill, { width: `${savingsRate}%` }]} />
          </View>
        </View>

        {/* Section: Tren Waktu (Bar Chart) */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Tren Arus Kas (Waktu)</Text>
        </View>
        <ChartErrorBoundary title="Tren Arus Kas">
          <CashflowBarChart transactions={transactions} />
        </ChartErrorBoundary>

        {/* Section: Donut Chart Kategori */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="pie-chart" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Proporsi Kategori Belanja</Text>
        </View>
        <ChartErrorBoundary title="Kategori Pengeluaran">
          <CategoryDonutChart
            data={categoryBreakdown}
            totalExpense={cashflowSummary?.totalExpense || 0}
          />
        </ChartErrorBoundary>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  exportHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 110, // Ruang lega di bawah agar tidak terhalang tab bar yang lebih tinggi
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  kpiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kpiPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  savingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  savingsSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  savingsPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  savingsTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  errorCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});
