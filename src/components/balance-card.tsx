import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  onAddPress: () => void;
}

export function BalanceCard({ balance, totalIncome, totalExpense, onAddPress }: BalanceCardProps) {
  const isPositive = balance >= 0;
  const { t } = useI18n();

  return (
    <View style={[styles.card, shadowStyles.md]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>{t('home_total_balance')}</Text>
          <Text style={[styles.balanceAmount, !isPositive && styles.negativeBalance]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.quickAddBtn, pressed && styles.quickAddBtnPressed]}
          onPress={onAddPress}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.quickAddBtnText}>{t('home_record_quick')}</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        {/* Pemasukan / Income */}
        <View style={styles.statItem}>
          <View style={[styles.iconPill, { backgroundColor: colors.incomeSoft }]}>
            <Ionicons name="arrow-down-outline" size={16} color={colors.income} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>{t('common_income')}</Text>
            <Text style={[styles.statValue, { color: colors.incomeDark }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        {/* Pengeluaran / Expense */}
        <View style={styles.statItem}>
          <View style={[styles.iconPill, { backgroundColor: colors.expenseSoft }]}>
            <Ionicons name="arrow-up-outline" size={16} color={colors.expense} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>{t('common_expense')}</Text>
            <Text style={[styles.statValue, { color: colors.expenseDark }]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  negativeBalance: {
    color: colors.expense,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
  },
  quickAddBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTexts: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
    marginHorizontal: 12,
  },
});
