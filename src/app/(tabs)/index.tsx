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
import { WalletCard } from '@/components/wallet-card';
import { TransactionItem } from '@/components/transaction-item';
import { PlanItem } from '@/components/plan-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const {
    transactions,
    wallets,
    cashflowSummary,
    debtSummary,
    investmentSummary,
    budgets,
    plans,
    deleteTransactionById,
    refreshAll,
    isMultiWalletEnabled,
  } = useFinance();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const recentTransactions = transactions.slice(0, 5);

  const activePlans = React.useMemo(() => (plans || []).filter((p) => p.is_completed === 0), [plans]);
  const pinnedPlans = React.useMemo(() => activePlans.filter((p) => p.is_pinned === 1), [activePlans]);

  const globalBudget = budgets.find((b) => b.category_id === null);
  const spent = globalBudget?.current_spent || 0;
  const limit = globalBudget?.monthly_limit || 0;
  const budgetPct = limit > 0 ? (spent / limit) * 100 : 0;
  const isOver = spent > limit && limit > 0;

  let budgetColor = colors.income;
  if (budgetPct >= 70 && !isOver) budgetColor = colors.warning;
  if (isOver) budgetColor = colors.expense;

  const displayedBalance = isMultiWalletEnabled
    ? (cashflowSummary.totalWalletBalance ?? cashflowSummary.balance)
    : cashflowSummary.balance;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandEmoji}>🌸</Text>
            <Text style={styles.brandTitle}>Cashflower</Text>
          </View>
          <Text style={styles.headerSubtitle}>{t('app_tagline')}</Text>
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
          balance={displayedBalance}
          totalIncome={cashflowSummary.totalIncome}
          totalExpense={cashflowSummary.totalExpense}
          onAddPress={() => router.push('/modal/add-transaction')}
        />

        {/* Wallets / Multi-Account Carousel Section */}
        {isMultiWalletEnabled && (
          <View style={styles.walletsSection}>
          <View style={styles.walletsSectionHeader}>
            <View style={styles.walletsSectionTitleWrap}>
              <View style={[styles.walletsHeaderIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="wallet" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.walletsSectionTitle}>{t('home_wallets_title')}</Text>
                <Text style={styles.walletsSectionSub}>
                  {t('home_wallets_storage_count', { count: wallets.length })}
                </Text>
              </View>
            </View>

            <View style={styles.walletsHeaderActions}>
              <Pressable
                style={({ pressed }) => [styles.transferQuickBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/modal/transfer-funds')}>
                <Ionicons name="swap-horizontal" size={13} color={colors.primaryDark} />
                <Text style={styles.transferQuickBtnText}>{t('home_wallets_transfer_btn')}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.seeAllWalletsBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/modal/wallets')}>
                <Text style={styles.seeAllWalletsText}>{t('common_manage')}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletsScrollContent}>
            {wallets.map((w) => (
              <WalletCard
                key={w.id}
                wallet={w}
                compact={true}
                onPress={() => router.push('/modal/wallets')}
              />
            ))}

            {/* Add Wallet Card */}
            <Pressable
              style={({ pressed }) => [styles.addWalletCard, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/modal/add-wallet')}>
              <View style={styles.addWalletCircle}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <Text style={styles.addWalletText}>{t('home_wallets_add_short')}</Text>
            </Pressable>
          </ScrollView>
        </View>
        )}

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
                  {globalBudget ? t('home_budget_title') : t('home_budget_setup')}
                </Text>
                <Text style={styles.budgetWidgetSub}>
                  {globalBudget
                    ? t('home_budget_spent_of', { spent: formatCurrency(spent, language), limit: formatCurrency(limit, language) })
                    : t('home_budget_tip')}
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

        {/* Pinned Plans / Financial Goals Widget */}
        <View style={[styles.plansWidget, shadowStyles.sm]}>
          <View style={styles.plansWidgetHeader}>
            <View style={styles.plansWidgetLeft}>
              <View style={[styles.plansIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.plansWidgetTitle}>{t('settings_plans_title')}</Text>
                <Text style={styles.plansWidgetSub}>
                  {pinnedPlans.length > 0
                    ? t('home_plans_pinned_sub', { count: pinnedPlans.length })
                    : activePlans.length > 0
                    ? t('home_plans_active_sub', { count: activePlans.length })
                    : t('home_plans_empty_sub')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/modal/plans')}
              style={({ pressed }) => [styles.seeAllPlansBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.seeAllPlansText}>{t('common_manage')}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {pinnedPlans.length > 0 ? (
            <View style={styles.pinnedList}>
              {pinnedPlans.map((plan) => (
                <PlanItem
                  key={plan.id}
                  plan={plan}
                  currentBalance={cashflowSummary.balance}
                  compact={true}
                  onPress={() => router.push('/modal/plans')}
                />
              ))}
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.emptyPlanBox, pressed && { opacity: 0.8 }]}
              onPress={() => router.push(activePlans.length > 0 ? '/modal/plans' : '/modal/add-plan')}>
              <Ionicons
                name={activePlans.length > 0 ? 'star-outline' : 'add-circle-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.emptyPlanText}>
                {activePlans.length > 0
                  ? t('home_plans_pin_tip')
                  : t('home_plans_add_new_btn')}
              </Text>
            </Pressable>
          )}
        </View>

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
            <Text style={styles.widgetTitle}>{t('home_receivable_title')}</Text>
            <Text style={[styles.widgetValue, { color: colors.receivableDark }]}>
              {formatCurrency(debtSummary.totalReceivable, language)}
            </Text>
            <Text style={styles.widgetSubtext}>
              {debtSummary.unpaidCount > 0
                ? t('home_receivable_active', { count: debtSummary.unpaidCount })
                : t('home_no_active_debt')}
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
            <Text style={styles.widgetTitle}>{t('home_trading_result')}</Text>
            <Text
              style={[
                styles.widgetValue,
                { color: investmentSummary.totalPnl >= 0 ? colors.incomeDark : colors.expenseDark },
              ]}>
              {investmentSummary.totalPnl >= 0 ? '+' : ''}
              {formatCurrency(investmentSummary.totalPnl, language)}
            </Text>
            <Text style={styles.widgetSubtext}>
              {investmentSummary.totalTrades > 0
                ? `${investmentSummary.winCount}W / ${investmentSummary.lossCount}L (${investmentSummary.netReturnPercentage.toFixed(1)}%)`
                : t('home_no_trades')}
            </Text>
          </Pressable>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home_recent_transactions')}</Text>
          {transactions.length > 0 ? (
            <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
              <Text style={styles.seeAllText}>{t('common_see_all')}</Text>
            </Pressable>
          ) : null}
        </View>

        {recentTransactions.length > 0 ? (
          <View style={[styles.transactionsCard, shadowStyles.sm]}>
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                item={tx}
                showWalletBadge={isMultiWalletEnabled}
                onEdit={() => router.push({ pathname: '/modal/add-transaction', params: { id: tx.id } })}
                onDelete={(id) => deleteTransactionById(id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.transactionsCard, shadowStyles.sm]}>
            <EmptyState
              icon="receipt-outline"
              title={t('home_empty_title')}
              description={t('home_empty_desc')}
              actionText={t('home_add_transaction')}
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
    marginBottom: 12,
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
  plansWidget: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plansWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  plansWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  plansIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansWidgetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  plansWidgetSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  seeAllPlansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  seeAllPlansText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pinnedList: {
    marginTop: 4,
  },
  emptyPlanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  emptyPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  walletsSection: {
    marginVertical: 4,
    marginBottom: 10,
  },
  walletsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  walletsSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletsHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  walletsSectionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  walletsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transferQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  transferQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  seeAllWalletsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  seeAllWalletsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  walletsScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  addWalletCard: {
    width: 110,
    minHeight: 116,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  addWalletCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWalletText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
