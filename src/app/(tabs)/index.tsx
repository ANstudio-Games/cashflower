import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { BalanceCard } from '@/components/balance-card';
import { TransactionItem } from '@/components/transaction-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

export default function HomeScreen() {
  const router = useRouter();
  const {
    transactions,
    cashflowSummary,
    debtSummary,
    investmentSummary,
    budgets,
    deleteTransactionById,
    refreshAll,
  } = useFinance();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const recentTransactions = transactions.slice(0, 5);

  const globalBudget = budgets.find((b) => b.category_id === null);
  const spent = globalBudget?.current_spent || 0;
  const limit = globalBudget?.monthly_limit || 0;
  const budgetPct = limit > 0 ? (spent / limit) * 100 : 0;
  const isOver = spent > limit && limit > 0;

  let budgetColor = colors.income;
  if (budgetPct >= 70 && !isOver) budgetColor = colors.warning;
  if (isOver) budgetColor = colors.expense;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandEmoji}>🌸</Text>
            <Text style={styles.brandTitle}>Cashflower</Text>
          </View>
          <Text style={styles.headerSubtitle}>Pencatatan Keuangan & Arus Kas</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/settings')}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.addHeaderBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/add-transaction')}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Main Cash Balance Card */}
        <BalanceCard
          balance={cashflowSummary.balance}
          totalIncome={cashflowSummary.totalIncome}
          totalExpense={cashflowSummary.totalExpense}
          onAddPress={() => router.push('/modal/add-transaction')}
        />

        {/* Budgeting Widget Card */}
        <Pressable
          style={({ pressed }) => [styles.budgetWidget, shadowStyles.sm, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/modal/budget')}>
          <View style={styles.budgetWidgetHeader}>
            <View style={styles.budgetWidgetLeft}>
              <View style={[styles.budgetIconWrap, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="pie-chart" size={16} color={colors.warning} />
              </View>
              <View>
                <Text style={styles.budgetWidgetTitle}>
                  {globalBudget ? 'Target Anggaran Bulan Ini' : 'Atur Batas Belanja Bulanan'}
                </Text>
                <Text style={styles.budgetWidgetSub}>
                  {globalBudget
                    ? `${formatCurrency(spent)} dari ${formatCurrency(limit)}`
                    : 'Pasang limit agar tidak boros'}
                </Text>
              </View>
            </View>

            {globalBudget ? (
              <Text style={[styles.budgetWidgetPercent, { color: budgetColor }]}>
                {budgetPct.toFixed(0)}%
              </Text>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            )}
          </View>

          {globalBudget ? (
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  { width: `${Math.min(100, Math.max(3, budgetPct))}%`, backgroundColor: budgetColor },
                ]}
              />
            </View>
          ) : null}
        </Pressable>

        {/* Quick Snapshot Widgets */}
        <View style={styles.widgetsRow}>
          {/* Piutang / Hutang Card */}
          <Pressable
            style={({ pressed }) => [styles.widgetCard, shadowStyles.sm, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/(tabs)/debts')}>
            <View style={styles.widgetHeader}>
              <View style={[styles.widgetIconWrap, { backgroundColor: colors.receivableSoft }]}>
                <Ionicons name="people" size={16} color={colors.receivable} />
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.widgetTitle}>Piutang Tertagih</Text>
            <Text style={[styles.widgetValue, { color: colors.receivableDark }]}>
              {formatCurrency(debtSummary.totalReceivable)}
            </Text>
            <Text style={styles.widgetSubtext}>
              {debtSummary.unpaidCount > 0
                ? `${debtSummary.unpaidCount} tagihan aktif`
                : 'Tidak ada hutang aktif'}
            </Text>
          </Pressable>

          {/* Trading / Investasi Card */}
          <Pressable
            style={({ pressed }) => [styles.widgetCard, shadowStyles.sm, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/(tabs)/investments')}>
            <View style={styles.widgetHeader}>
              <View style={[styles.widgetIconWrap, { backgroundColor: colors.investmentSoft }]}>
                <Ionicons name="trending-up" size={16} color={colors.investment} />
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.widgetTitle}>Hasil Trading</Text>
            <Text
              style={[
                styles.widgetValue,
                { color: investmentSummary.totalPnl >= 0 ? colors.incomeDark : colors.expenseDark },
              ]}>
              {investmentSummary.totalPnl >= 0 ? '+' : ''}
              {formatCurrency(investmentSummary.totalPnl)}
            </Text>
            <Text style={styles.widgetSubtext}>
              {investmentSummary.totalTrades > 0
                ? `${investmentSummary.winCount}W / ${investmentSummary.lossCount}L (${investmentSummary.netReturnPercentage.toFixed(1)}%)`
                : 'Belum ada trading'}
            </Text>
          </Pressable>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Belanjaan & Transaksi Terbaru</Text>
          {transactions.length > 0 ? (
            <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </Pressable>
          ) : null}
        </View>

        {recentTransactions.length > 0 ? (
          <View style={[styles.transactionsCard, shadowStyles.sm]}>
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                item={tx}
                onEdit={() => router.push({ pathname: '/modal/add-transaction', params: { id: tx.id } })}
                onDelete={(id) => deleteTransactionById(id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.transactionsCard, shadowStyles.sm]}>
            <EmptyState
              icon="receipt-outline"
              title="Belum Ada Transaksi"
              description="Catat pengeluaran barang belanjaan atau uang masuk pertama Anda untuk mulai memantau cashflow."
              actionText="Tambah Transaksi"
              onActionPress={() => router.push('/modal/add-transaction')}
            />
          </View>
        )}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandEmoji: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  budgetWidget: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  budgetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetWidgetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  budgetWidgetSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  budgetWidgetPercent: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 3,
  },
  widgetsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  widgetValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  widgetSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  transactionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
