import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface TransactionItemProps {
  item: Transaction;
  onEdit?: (item: Transaction) => void;
  onDelete?: (id: string) => void;
  showWalletBadge?: boolean;
}

export function TransactionItem({
  item,
  onEdit,
  onDelete,
  showWalletBadge = true,
}: TransactionItemProps) {
  const isIncome = item.type === 'income';
  const isTransfer = item.type === 'transfer';
  const { t, getRelativeDateLabel, getCategoryName } = useI18n();

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      t('tx_delete_confirm_title'),
      t('tx_delete_confirm_msg', { title: item.title }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('common_delete'), style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const iconName = isTransfer
    ? 'swap-horizontal-outline'
    : ((item.category_icon || (isIncome ? 'wallet-outline' : 'cart-outline')) as any);
  const categoryColor = isTransfer
    ? '#6366F1'
    : (item.category_color || (isIncome ? colors.income : colors.expense));

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && onEdit && styles.containerPressed]}
      onPress={() => onEdit && onEdit(item)}>
      {/* Category / Transfer Icon */}
      <View style={[styles.iconCircle, { backgroundColor: `${categoryColor}18` }]}>
        <Ionicons name={iconName} size={20} color={categoryColor} />
      </View>

      {/* Info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          {isTransfer ? (
            <View style={[styles.walletBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="swap-horizontal" size={11} color="#6366F1" />
              <Text style={[styles.walletBadgeText, { color: '#6366F1' }]}>
                {item.wallet_name || 'Wallet'} ➔ {item.destination_wallet_name || 'Dest'}
              </Text>
            </View>
          ) : (
            <>
              {showWalletBadge && item.wallet_name && (
                <>
                  <View style={[styles.walletBadge, { backgroundColor: `${item.wallet_color || colors.textMuted}14` }]}>
                    <Ionicons
                      name={(item.wallet_icon || 'wallet-outline') as any}
                      size={11}
                      color={item.wallet_color || colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.walletBadgeText,
                        { color: item.wallet_color || colors.textSecondary },
                      ]}
                      numberOfLines={1}>
                      {item.wallet_name}
                    </Text>
                  </View>
                  <Text style={styles.dot}>•</Text>
                </>
              )}
              <Text style={styles.categoryName}>
                {getCategoryName({ id: item.category_id, name: item.category_name }) ||
                  (isIncome ? t('common_income') : t('common_expense'))}
              </Text>
            </>
          )}
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
        <Text
          style={[
            styles.amount,
            isTransfer ? styles.transferText : isIncome ? styles.incomeText : styles.expenseText,
          ]}>
          {isTransfer
            ? formatCurrency(item.amount)
            : isIncome
            ? `+${formatCurrency(item.amount)}`
            : `-${formatCurrency(item.amount)}`}
        </Text>

        <View style={styles.actionRow}>
          {onEdit && !isTransfer ? (
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
  transferText: {
    color: '#6366F1',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
