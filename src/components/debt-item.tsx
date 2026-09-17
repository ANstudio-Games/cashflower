import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Debt } from '@/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateShort } from '@/utils/format-date';

interface DebtItemProps {
  item: Debt;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onDelete: (id: string) => void;
}

export function DebtItem({ item, onTogglePaid, onDelete }: DebtItemProps) {
  const isReceivable = item.type === 'receivable'; // Orang pinjam ke user (user menagih)
  const isPaid = item.is_paid === 1;

  const handleDelete = () => {
    Alert.alert(
      'Hapus Catatan',
      `Hapus catatan ${isReceivable ? 'piutang' : 'hutang'} "${item.person_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const handleToggle = () => {
    Alert.alert(
      isPaid ? 'Ubah Status ke Belum Lunas?' : 'Tandai Sudah Lunas?',
      `Ubah status pembayaran untuk ${item.person_name} sebesar ${formatCurrency(item.amount)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: isPaid ? 'Tandai Belum Lunas' : 'Ya, Sudah Lunas',
          onPress: () => onTogglePaid(item.id, !isPaid),
        },
      ]
    );
  };

  // Check if overdue
  const isOverdue =
    !isPaid &&
    item.due_date &&
    new Date(item.due_date + 'T23:59:59').getTime() < Date.now();

  const themeColor = isReceivable ? colors.receivable : colors.debt;
  const themeSoft = isReceivable ? colors.receivableSoft : colors.debtSoft;

  return (
    <View style={[styles.card, isPaid && styles.cardPaid]}>
      <View style={styles.headerRow}>
        {/* Type Badge */}
        <View style={[styles.badge, { backgroundColor: themeSoft }]}>
          <Ionicons
            name={isReceivable ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
            size={14}
            color={themeColor}
          />
          <Text style={[styles.badgeText, { color: themeColor }]}>
            {isReceivable ? 'Piutang (Tagih)' : 'Hutang (Bayar)'}
          </Text>
        </View>

        {/* Status Pill */}
        <Pressable
          onPress={handleToggle}
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
            {isPaid ? 'Lunas' : 'Belum Lunas'}
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

        <Text style={[styles.amount, { color: themeColor }, isPaid && styles.textMutedAmount]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Dates & Actions footer */}
      <View style={styles.footerRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Pinjam: {formatDateShort(item.issue_date)}</Text>
          {item.due_date ? (
            <Text style={[styles.dateLabel, isOverdue && styles.overdueText]}>
              {isOverdue ? '⚠️ Lewat Tempo: ' : 'Jatuh Tempo: '}
              {formatDateShort(item.due_date)}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            hitSlop={8}
            onPress={handleToggle}
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
              {isPaid ? 'Batal' : 'Lunaskan'}
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
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
  textMutedAmount: {
    opacity: 0.6,
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
