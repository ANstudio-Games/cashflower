import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { formatCurrencyShort } from '@/utils/format-currency';
import { Transaction } from '@/types';

type TimeFilter = 'daily' | 'monthly' | 'yearly';

interface CashflowBarChartProps {
  transactions: Transaction[];
}

interface ChartBarData {
  label: string;
  income: number;
  expense: number;
}

export function CashflowBarChart({ transactions }: CashflowBarChartProps) {
  const [filter, setFilter] = useState<TimeFilter>('monthly');

  // Aggregate transaction data based on selected filter
  const chartData = useMemo<ChartBarData[]>(() => {
    const now = new Date();

    if (filter === 'daily') {
      // Last 7 days
      const days: ChartBarData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const label = i === 0 ? 'Hari ini' : dayNames[d.getDay()];

        const dayTxs = transactions.filter((t) => t.date === iso);
        const income = dayTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = dayTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        days.push({ label, income, expense });
      }
      return days;
    }

    if (filter === 'monthly') {
      // Last 6 months
      const months: ChartBarData[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const prefix = `${y}-${m}`;
        const label = `${monthNames[d.getMonth()]}`;

        const monthTxs = transactions.filter((t) => t.date.startsWith(prefix));
        const income = monthTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        months.push({ label, income, expense });
      }
      return months;
    }

    // Yearly: Last 4 years
    const years: ChartBarData[] = [];
    const currentYear = now.getFullYear();
    for (let y = currentYear - 3; y <= currentYear; y++) {
      const prefix = `${y}-`;
      const yearTxs = transactions.filter((t) => t.date.startsWith(prefix));
      const income = yearTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = yearTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      years.push({ label: `${y}`, income, expense });
    }
    return years;
  }, [transactions, filter]);

  // Find maximum value to scale the bars
  const maxVal = useMemo(() => {
    let max = 0;
    for (const d of chartData) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return max > 0 ? max : 100000;
  }, [chartData]);

  const chartHeight = 150;

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, filter === 'daily' && styles.filterTabActive]}
          onPress={() => setFilter('daily')}>
          <Text style={[styles.filterText, filter === 'daily' && styles.filterTextActive]}>Harian</Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'monthly' && styles.filterTabActive]}
          onPress={() => setFilter('monthly')}>
          <Text style={[styles.filterText, filter === 'monthly' && styles.filterTextActive]}>Bulanan</Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'yearly' && styles.filterTabActive]}
          onPress={() => setFilter('yearly')}>
          <Text style={[styles.filterText, filter === 'yearly' && styles.filterTextActive]}>Tahunan</Text>
        </Pressable>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Pemasukan</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Pengeluaran</Text>
        </View>
      </View>

      {/* Bar Chart Area */}
      <View style={[styles.chartArea, { height: chartHeight + 35 }]}>
        {/* Horizontal grid guide lines */}
        <View style={styles.gridLine} />
        <View style={[styles.gridLine, { bottom: chartHeight * 0.5 + 25 }]} />
        <View style={[styles.gridLine, { bottom: chartHeight + 25 }]} />

        <View style={styles.barsRow}>
          {chartData.map((item, index) => {
            const incomeHeight = Math.max(4, (item.income / maxVal) * chartHeight);
            const expenseHeight = Math.max(4, (item.expense / maxVal) * chartHeight);

            return (
              <View key={index} style={styles.barGroup}>
                <View style={[styles.barColumns, { height: chartHeight }]}>
                  {/* Income bar */}
                  <View style={styles.singleBarWrapper}>
                    {item.income > 0 ? (
                      <View style={[styles.bar, { height: incomeHeight, backgroundColor: colors.income }]} />
                    ) : (
                      <View style={[styles.emptyBar]} />
                    )}
                  </View>

                  {/* Expense bar */}
                  <View style={styles.singleBarWrapper}>
                    {item.expense > 0 ? (
                      <View style={[styles.bar, { height: expenseHeight, backgroundColor: colors.expense }]} />
                    ) : (
                      <View style={[styles.emptyBar]} />
                    )}
                  </View>
                </View>

                {/* Bar Label */}
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Max range indicator */}
      <View style={styles.rangeInfo}>
        <Text style={styles.rangeText}>Puncak: {formatCurrencyShort(maxVal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chartArea: {
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 25,
    height: 1,
    backgroundColor: colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingBottom: 25,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barColumns: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    width: '100%',
    justifyContent: 'center',
  },
  singleBarWrapper: {
    width: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  emptyBar: {
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  rangeInfo: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  rangeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
