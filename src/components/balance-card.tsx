import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  onAddPress: () => void;
}

export function BalanceCard({ balance, totalIncome, totalExpense, onAddPress }: BalanceCardProps) {
  const isPositive = balance >= 0;

  return (
    <View style={[styles.card, shadowStyles.md]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Total Saldo Kas</Text>
          <Text style={[styles.balanceAmount, !isPositive && styles.negativeBalance]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.quickAddBtn, pressed && styles.quickAddBtnPressed]}
          onPress={onAddPress}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.quickAddBtnText}>Catat</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        {/* Pemasukan */}
        <View style={styles.statItem}>
          <View style={[styles.iconPill, { backgroundColor: colors.incomeSoft }]}>
            <Ionicons name="arrow-down-outline" size={16} color={colors.income} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={[styles.statValue, { color: colors.incomeDark }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        {/* Pengeluaran */}
        <View style={styles.statItem}>
          <View style={[styles.iconPill, { backgroundColor: colors.expenseSoft }]}>
            <Ionicons name="arrow-up-outline" size={16} color={colors.expense} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>Pengeluaran</Text>
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
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTexts: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
});
