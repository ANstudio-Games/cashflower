import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Wallet } from '@/types';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  compact?: boolean;
}

export function WalletCard({ wallet, onPress, compact = false }: WalletCardProps) {
  const balance = wallet.balance ?? wallet.initial_balance ?? 0;
  const isNegative = balance < 0;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Tunai';
      case 'bank':
        return 'Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'savings':
        return 'Tabungan';
      default:
        return 'Lainnya';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact ? styles.cardCompact : styles.cardFull,
        shadowStyles.sm,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${wallet.color}18` }]}>
          <Ionicons name={(wallet.icon || 'wallet-outline') as any} size={18} color={wallet.color} />
        </View>

        <View style={styles.tagGroup}>
          {wallet.is_default === 1 && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Utama</Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: `${wallet.color}12` }]}>
            <Text style={[styles.typeBadgeText, { color: wallet.color }]}>
              {getTypeLabel(wallet.type)}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Name & Balance */}
      <View style={styles.bottomSection}>
        <Text style={styles.walletName} numberOfLines={1}>
          {wallet.name}
        </Text>
        <Text
          style={[styles.walletBalance, isNegative && styles.negativeBalance]}
          numberOfLines={1}>
          {formatCurrency(balance)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  cardCompact: {
    width: 156,
    minHeight: 110,
  },
  cardFull: {
    width: '100%',
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    gap: 4,
  },
  defaultBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
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
    marginBottom: 4,
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
