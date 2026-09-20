import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinancialPlan } from '@/types';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateShort } from '@/utils/format-date';

interface PlanItemProps {
  plan: FinancialPlan;
  currentBalance: number;
  onPress?: () => void;
  onTogglePin?: (id: string, isPinned: boolean) => void;
  onFulfill?: (id: string) => void;
  onEdit?: (plan: FinancialPlan) => void;
  onDelete?: (id: string, title: string) => void;
  compact?: boolean; // For Home screen widget
}

export function PlanItem({
  plan,
  currentBalance,
  onPress,
  onTogglePin,
  onFulfill,
  onEdit,
  onDelete,
  compact = false,
}: PlanItemProps) {
  const isCompleted = plan.is_completed === 1;
  const target = plan.target_amount || 1;
  const balance = Math.max(0, currentBalance);
  const progressPct = isCompleted
    ? 100
    : Math.min(100, Math.max(0, (balance / target) * 100));
  const remaining = Math.max(0, target - balance);
  const isReady = !isCompleted && balance >= target;

  let statusColor = colors.warning;
  let statusBg = colors.warningSoft;
  let statusText = `Kurang ${formatCurrency(remaining)}`;

  if (isCompleted) {
    statusColor = colors.incomeDark;
    statusBg = colors.incomeSoft;
    statusText = 'Tercapai';
  } else if (isReady) {
    statusColor = colors.incomeDark;
    statusBg = colors.incomeSoft;
    statusText = 'Dana Siap Dibeli!';
  } else if (currentBalance <= 0) {
    statusColor = colors.expense;
    statusBg = colors.expenseSoft;
    statusText = `Saldo Kas Kosong`;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact ? styles.cardCompact : shadowStyles.sm,
        isCompleted && styles.cardCompleted,
        pressed && { opacity: 0.95 },
      ]}
      onPress={onPress}>
      {/* Top row: Icon, Title, Pin */}
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: plan.category_color ? `${plan.category_color}1A` : colors.primarySoft },
            ]}>
            <Ionicons
              name={(plan.category_icon as any) || 'sparkles-outline'}
              size={compact ? 16 : 18}
              color={plan.category_color || colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, isCompleted && styles.textCompleted]} numberOfLines={1}>
              {plan.title}
            </Text>
            {plan.category_name && (
              <Text style={styles.categorySub}>{plan.category_name}</Text>
            )}
          </View>
        </View>

        <View style={styles.topActions}>
          {!isCompleted && onTogglePin && (
            <Pressable
              hitSlop={8}
              onPress={() => onTogglePin(plan.id, plan.is_pinned !== 1)}
              style={styles.pinBtn}>
              <Ionicons
                name={plan.is_pinned === 1 ? 'star' : 'star-outline'}
                size={20}
                color={plan.is_pinned === 1 ? '#F59E0B' : colors.textMuted}
              />
            </Pressable>
          )}

          {!compact && onEdit && !isCompleted && (
            <Pressable hitSlop={8} onPress={() => onEdit(plan)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={17} color={colors.textSecondary} />
            </Pressable>
          )}

          {!compact && onDelete && (
            <Pressable hitSlop={8} onPress={() => onDelete(plan.id, plan.title)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={17} color={colors.expense} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Target Amount and Status Badge */}
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.targetLabel}>Target Pembelian</Text>
          <Text style={styles.targetAmount}>{formatCurrency(plan.target_amount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          {isReady && <Ionicons name="checkmark-circle" size={13} color={statusColor} style={{ marginRight: 3 }} />}
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPct}%`,
                backgroundColor: isCompleted || isReady ? colors.income : colors.primary,
              },
            ]}
          />
        </View>
        <View style={styles.progressInfoRow}>
          <Text style={styles.progressSub}>
            {isCompleted
              ? 'Target impian berhasil dibeli'
              : `Saldo Kas: ${formatCurrency(balance)}`}
          </Text>
          <Text
            style={[
              styles.progressPctText,
              { color: isCompleted || isReady ? colors.incomeDark : colors.primaryDark },
            ]}>
            {progressPct.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Target Date or Notes if any */}
      {(plan.target_date || plan.notes) && !compact && (
        <View style={styles.footerRow}>
          {plan.target_date ? (
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={styles.footerText}>Target: {formatDateShort(plan.target_date)}</Text>
            </View>
          ) : null}
          {plan.notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              {plan.notes}
            </Text>
          ) : null}
        </View>
      )}

      {/* Fulfill Action Button for non-compact mode */}
      {!isCompleted && isReady && onFulfill && !compact && (
        <Pressable
          style={({ pressed }) => [styles.fulfillBtn, pressed && { opacity: 0.85 }]}
          onPress={() => onFulfill(plan.id)}>
          <Ionicons name="cart-outline" size={17} color="#FFFFFF" />
          <Text style={styles.fulfillBtnText}>Beli & Catat Pengeluaran</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
  },
  cardCompleted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  categorySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinBtn: {
    padding: 4,
  },
  actionBtn: {
    padding: 4,
    marginLeft: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  fulfillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.income,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  fulfillBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
