import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { InvestmentItem } from '@/components/investment-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

const INSTRUMENT_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'saham', label: 'Saham' },
  { id: 'kripto', label: 'Kripto' },
  { id: 'forex', label: 'Forex' },
  { id: 'emas', label: 'Emas' },
  { id: 'reksadana', label: 'Reksa Dana' },
  { id: 'lainnya', label: 'Lainnya' },
];

export default function InvestmentsScreen() {
  const router = useRouter();
  const { investments, investmentSummary, deleteInvestmentById } = useFinance();

  const [selectedInstrument, setSelectedInstrument] = useState('all');

  const filteredInvestments = useMemo(() => {
    if (selectedInstrument === 'all') return investments;
    return investments.filter((inv) => inv.instrument_type === selectedInstrument);
  }, [investments, selectedInstrument]);

  const isNetProfit = investmentSummary.totalPnl >= 0;
  const winRate =
    investmentSummary.totalTrades > 0
      ? ((investmentSummary.winCount / investmentSummary.totalTrades) * 100).toFixed(1)
      : '0.0';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trading & Investasi</Text>
          <Text style={styles.headerSubtitle}>Jurnal keuntungan dan performa trading</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/add-investment')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Portfolio Performance Card */}
      <View style={[styles.portfolioCard, shadowStyles.md]}>
        <View style={styles.portfolioTop}>
          <View>
            <Text style={styles.portfolioLabel}>Net Profit / Loss</Text>
            <Text
              style={[
                styles.portfolioPnl,
                { color: isNetProfit ? colors.incomeDark : colors.expenseDark },
              ]}>
              {isNetProfit ? '+' : ''}
              {formatCurrency(investmentSummary.totalPnl)}
            </Text>
          </View>
          <View
            style={[
              styles.returnBadge,
              { backgroundColor: isNetProfit ? colors.incomeSoft : colors.expenseSoft },
            ]}>
            <Ionicons
              name={isNetProfit ? 'trending-up' : 'trending-down'}
              size={16}
              color={isNetProfit ? colors.incomeDark : colors.expenseDark}
            />
            <Text
              style={[
                styles.returnText,
                { color: isNetProfit ? colors.incomeDark : colors.expenseDark },
              ]}>
              {isNetProfit ? '+' : ''}
              {investmentSummary.netReturnPercentage.toFixed(1)}% ROI
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statColLabel}>Total Modal</Text>
            <Text style={styles.statColVal}>{formatCurrency(investmentSummary.totalCapital)}</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.statCol}>
            <Text style={styles.statColLabel}>Win Rate</Text>
            <Text style={styles.statColVal}>{winRate}%</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.statCol}>
            <Text style={styles.statColLabel}>Menang / Kalah</Text>
            <Text style={styles.statColVal}>
              <Text style={{ color: colors.incomeDark }}>{investmentSummary.winCount}W</Text> :{' '}
              <Text style={{ color: colors.expenseDark }}>{investmentSummary.lossCount}L</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Instrument Filter Scroll */}
      <View style={{ height: 44, marginVertical: 6 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {INSTRUMENT_FILTERS.map((item) => {
            const isSelected = selectedInstrument === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedInstrument(item.id)}>
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Investment List */}
      <FlatList
        data={filteredInvestments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InvestmentItem
            item={item}
            onDelete={(id) => deleteInvestmentById(id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="trending-up-outline"
            title="Belum Ada Catatan Trading"
            description="Catat hasil beli dan jual saham, kripto, atau aset investasi Anda untuk mengukur untung/rugi secara akurat."
            actionText="Catat Trading Baru"
            onActionPress={() => router.push('/modal/add-investment')}
          />
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portfolioTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  portfolioPnl: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  returnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 3,
  },
  statColVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 110,
    marginTop: 6,
  },
});
