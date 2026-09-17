import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
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
    deleteTransactionById,
    refreshAll,
    isLoading,
  } = useFinance();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const recentTransactions = transactions.slice(0, 5);

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

        <Pressable
          style={({ pressed }) => [styles.addHeaderBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/add-transaction')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
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
  addHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
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
