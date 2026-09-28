import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface InvestmentItemProps {
  item: Investment;
  onDelete: (id: string) => void;
}

export function InvestmentItem({ item, onDelete }: InvestmentItemProps) {
  const isProfit = item.pnl >= 0;
  const { t, language, formatDateShort } = useI18n();

  const instrumentMap: Record<string, { label: string; icon: any; color: string }> = {
    saham: { label: t('inst_saham'), icon: 'business-outline', color: '#3B82F6' },
    kripto: { label: t('inst_kripto'), icon: 'logo-bitcoin', color: '#F59E0B' },
    forex: { label: t('inst_forex'), icon: 'swap-horizontal-outline', color: '#10B981' },
    reksadana: { label: t('inst_reksadana'), icon: 'pie-chart-outline', color: '#8B5CF6' },
    emas: { label: t('inst_emas'), icon: 'sparkles-outline', color: '#D97706' },
    lainnya: { label: t('inst_lainnya'), icon: 'stats-chart-outline', color: '#64748B' },
  };

  const instrument = instrumentMap[item.instrument_type] || instrumentMap.lainnya;

  const handleDelete = () => {
    Alert.alert(
      t('inv_delete_title'),
      t('inv_delete_msg', { asset: item.asset_name }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('common_delete'), style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {/* Instrument Badge */}
        <View style={[styles.badge, { backgroundColor: `${instrument.color}15` }]}>
          <Ionicons name={instrument.icon} size={14} color={instrument.color} />
          <Text style={[styles.badgeText, { color: instrument.color }]}>{instrument.label}</Text>
        </View>

        {/* PnL Tag */}
        <View
          style={[
            styles.pnlTag,
            { backgroundColor: isProfit ? colors.incomeSoft : colors.expenseSoft },
          ]}>
          <Ionicons
            name={isProfit ? 'trending-up' : 'trending-down'}
            size={14}
            color={isProfit ? colors.incomeDark : colors.expenseDark}
          />
          <Text style={[styles.pnlText, { color: isProfit ? colors.incomeDark : colors.expenseDark }]}>
            {isProfit ? '+' : ''}
            {formatCurrency(item.pnl, language)} ({isProfit ? '+' : ''}
            {item.pnl_percentage.toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* Asset Name & Prices */}
      <View style={styles.bodyRow}>
        <View style={styles.assetCol}>
          <Text style={styles.assetName}>{item.asset_name}</Text>
          <Text style={styles.date}>{formatDateShort(item.trade_date)}</Text>
        </View>

        <View style={styles.priceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('inv_buy_label')}</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.buy_price, language)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('inv_sell_label')}</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.sell_price, language)}</Text>
          </View>
        </View>
      </View>

      {/* Footer Notes & Delete */}
      <View style={styles.footerRow}>
        <Text style={styles.notes} numberOfLines={1}>
          {item.notes ? item.notes : t('inv_no_notes')}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pnlTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pnlText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetCol: {
    flex: 1,
  },
  assetName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notes: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 2,
    marginLeft: 8,
  },
});
