import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Wallet } from '@/types';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  compact?: boolean;
}

export function WalletCard({ wallet, onPress, compact = false }: WalletCardProps) {
  const { t, language, getWalletName } = useI18n();
  const balance = wallet.balance ?? wallet.initial_balance ?? 0;
  const isNegative = balance < 0;
  const isDefault = wallet.is_default === 1;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return t('wallet_type_cash');
      case 'bank':
        return t('wallet_type_bank');
      case 'ewallet':
        return t('wallet_type_ewallet');
      case 'savings':
        return t('wallet_type_savings');
      default:
        return t('wallet_type_other');
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact ? styles.cardCompact : styles.cardFull,
        isDefault && styles.cardDefault,
        shadowStyles.sm,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${wallet.color}18` }]}>
          <Ionicons name={(wallet.icon || 'wallet-outline') as any} size={18} color={wallet.color} />
        </View>

        <View style={[styles.tagGroup, compact && styles.tagGroupCompact]}>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={9} color="#D97706" />
              <Text style={styles.defaultBadgeText}>{t('wallet_badge_default')}</Text>
            </View>
          )}
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${wallet.color}12`, borderColor: `${wallet.color}25` },
            ]}>
            <Text style={[styles.typeBadgeText, { color: wallet.color }]} numberOfLines={1}>
              {getTypeLabel(wallet.type)}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Name & Balance */}
      <View style={styles.bottomSection}>
        <Text style={styles.walletName} numberOfLines={1}>
          {getWalletName(wallet)}
        </Text>
        <Text
          style={[styles.walletBalance, isNegative && styles.negativeBalance]}
          numberOfLines={1}>
          {formatCurrency(balance, language)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  cardCompact: {
    width: 162,
    minHeight: 116,
  },
  cardFull: {
    width: '100%',
    marginBottom: 10,
  },
  cardDefault: {
    borderColor: '#FDE68A',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagGroupCompact: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bottomSection: {
    justifyContent: 'flex-end',
  },
  walletName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 3,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  negativeBalance: {
    color: colors.expenseDark,
  },
});
