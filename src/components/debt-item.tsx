import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Debt } from '@/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface DebtItemProps {
  item: Debt;
  onPress?: (item: Debt) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onDelete: (id: string) => void;
}

export function DebtItem({ item, onPress, onTogglePaid, onDelete }: DebtItemProps) {
  const isReceivable = item.type === 'receivable'; // Orang pinjam ke user (user menagih)
  const isPaid = item.is_paid === 1;
  const { t, language, formatDateShort } = useI18n();

  const paidAmount = item.paid_amount ?? (isPaid ? item.amount : 0);
  const remainingAmount = item.remaining_amount ?? (isPaid ? 0 : Math.max(0, item.amount - paidAmount));
  const hasPayments = paidAmount > 0;
  const progressPercent = item.amount > 0 ? Math.min(100, Math.round((paidAmount / item.amount) * 100)) : 0;

  const handleDelete = () => {
    Alert.alert(
      t('debt_delete_title'),
      t('debt_delete_msg', {
        type: isReceivable ? t('common_receivable') : t('common_payable'),
        person: item.person_name,
      }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('common_delete'), style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const handleToggle = () => {
    Alert.alert(
      isPaid ? t('debt_toggle_title_settled') : t('debt_toggle_title_unsettled'),
      t('debt_toggle_msg', {
        person: item.person_name,
        amount: formatCurrency(item.amount, language),
      }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: isPaid ? t('debt_toggle_btn_unsettled') : t('debt_toggle_btn_settled'),
          onPress: () => onTogglePaid(item.id, !isPaid),
        },
      ]
    );
  };

  const handleStatusPress = () => {
    if (!isPaid && onPress) {
      onPress(item);
    } else {
      handleToggle();
    }
  };

  // Check if overdue
  const isOverdue =
    !isPaid &&
    item.due_date &&
    new Date(item.due_date + 'T23:59:59').getTime() < Date.now();

  const themeColor = isReceivable ? colors.receivable : colors.debt;
  const themeSoft = isReceivable ? colors.receivableSoft : colors.debtSoft;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        isPaid && styles.cardPaid,
        pressed && onPress && { opacity: 0.92 },
      ]}>
      <View style={styles.headerRow}>
        {/* Type Badge */}
        <View style={[styles.badge, { backgroundColor: themeSoft }]}>
          <Ionicons
            name={isReceivable ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
            size={14}
            color={themeColor}
          />
          <Text style={[styles.badgeText, { color: themeColor }]}>
            {isReceivable ? t('debt_item_badge_receivable') : t('debt_item_badge_payable')}
          </Text>
        </View>

        {/* Status Pill */}
        <Pressable
          onPress={handleStatusPress}
          style={({ pressed }) => [
            styles.statusPill,
            isPaid ? styles.statusPillPaid : styles.statusPillUnpaid,
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={isPaid ? colors.incomeDark : colors.textSecondary}
          />
          <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextUnpaid]}>
            {isPaid ? t('debt_status_settled') : t('debt_status_unsettled')}
          </Text>
        </Pressable>
      </View>

      {/* Person & Amount */}
      <View style={styles.bodyRow}>
        <View style={styles.personInfo}>
          <Text style={[styles.personName, isPaid && styles.textStrikethrough]}>
            {item.person_name}
          </Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.amountCol}>
          {!isPaid && hasPayments ? (
            <>
              <Text style={[styles.remainingAmount, { color: themeColor }]}>
                {formatCurrency(remainingAmount, language)}
              </Text>
              <Text style={styles.totalSubText}>
                {t('debt_item_total_sub', { amount: formatCurrency(item.amount, language) })}
              </Text>
            </>
          ) : (
            <Text style={[styles.amount, { color: themeColor }, isPaid && styles.textMutedAmount]}>
              {formatCurrency(item.amount, language)}
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar (if payments have been made) */}
      {hasPayments && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isPaid ? colors.incomeDark : themeColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabelText}>
              {t('debt_item_paid_label', { amount: formatCurrency(paidAmount, language) })}
            </Text>
            <Text
              style={[
                styles.progressPercentText,
                { color: isPaid ? colors.incomeDark : themeColor },
              ]}>
              {progressPercent}%
            </Text>
          </View>
        </View>
      )}

      {/* Dates & Actions footer */}
      <View style={styles.footerRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>{t('debt_borrow_date', { date: formatDateShort(item.issue_date) })}</Text>
          {item.due_date ? (
            <Text style={[styles.dateLabel, isOverdue && styles.overdueText]}>
              {isOverdue
                ? t('debt_overdue', { date: formatDateShort(item.due_date) })
                : t('debt_due_date', { date: formatDateShort(item.due_date) })}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            hitSlop={8}
            onPress={handleStatusPress}
            style={({ pressed }) => [
              styles.actionBtn,
              isPaid ? styles.actionBtnUndo : styles.actionBtnComplete,
              pressed && { opacity: 0.75 },
            ]}>
            <Text
              style={[
                styles.actionBtnText,
                { color: isPaid ? colors.textSecondary : colors.incomeDark },
              ]}>
              {isPaid ? t('debt_action_undo') : t('debt_action_pay_or_installment')}
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('a11y_delete', { name: item.person_name })}
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPaid: {
    backgroundColor: '#FAFBFD',
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillPaid: {
    backgroundColor: colors.incomeSoft,
  },
  statusPillUnpaid: {
    backgroundColor: colors.surfaceHover,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: colors.incomeDark,
  },
  statusTextUnpaid: {
    color: colors.textSecondary,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  personInfo: {
    flex: 1,
    marginRight: 10,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  notes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  totalSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  textMutedAmount: {
    opacity: 0.6,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 2,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateCol: {
    gap: 2,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  overdueText: {
    color: colors.expenseDark,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnComplete: {
    backgroundColor: colors.incomeSoft,
  },
  actionBtnUndo: {
    backgroundColor: colors.surfaceHover,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
});
