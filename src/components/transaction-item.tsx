import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { getRelativeDateLabel } from '@/utils/format-date';

interface TransactionItemProps {
  item: Transaction;
  onEdit?: (item: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ item, onEdit, onDelete }: TransactionItemProps) {
  const isIncome = item.type === 'income';

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      'Hapus Transaksi',
      `Yakin ingin menghapus catatan "${item.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const iconName = (item.category_icon || (isIncome ? 'wallet-outline' : 'cart-outline')) as any;
  const categoryColor = item.category_color || (isIncome ? colors.income : colors.expense);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && onEdit && styles.containerPressed]}
      onPress={() => onEdit && onEdit(item)}>
      {/* Category Icon */}
      <View style={[styles.iconCircle, { backgroundColor: `${categoryColor}18` }]}>
        <Ionicons name={iconName} size={20} color={categoryColor} />
      </View>

      {/* Info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.categoryName}>
            {item.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{getRelativeDateLabel(item.date)}</Text>
        </View>
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      {/* Amount & Actions */}
      <View style={styles.rightSection}>
        <Text style={[styles.amount, isIncome ? styles.incomeText : styles.expenseText]}>
          {isIncome ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
        </Text>

        <View style={styles.actionRow}>
          {onEdit ? (
            <Pressable
              hitSlop={8}
              onPress={() => onEdit(item)}
              style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}>
              <Ionicons name="pencil-outline" size={15} color={colors.primary} />
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable
              hitSlop={8}
              onPress={handleDelete}
              style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}>
              <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  containerPressed: {
    backgroundColor: colors.surfaceHover,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dot: {
    marginHorizontal: 4,
    color: colors.textMuted,
    fontSize: 10,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  notes: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  incomeText: {
    color: colors.incomeDark,
  },
  expenseText: {
    color: colors.expenseDark,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  actionIconBtn: {
    padding: 3,
  },
});
