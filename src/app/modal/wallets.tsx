import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { Wallet } from '@/types';

export default function WalletsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;

  const { wallets, deleteWalletById, editWallet } = useFinance();

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const handleDelete = (wallet: Wallet) => {
    if (wallets.length <= 1) {
      Alert.alert('Perhatian', 'Anda harus memiliki minimal satu dompet aktif.');
      return;
    }

    Alert.alert(
      'Hapus Dompet',
      `Yakin ingin menghapus dompet "${wallet.name}"? Semua transaksi yang terkait akan dipindahkan ke dompet lainnya.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWalletById(wallet.id);
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Gagal menghapus dompet.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (wallet: Wallet) => {
    try {
      await editWallet({
        ...wallet,
        is_default: 1,
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menjadikan dompet utama.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Tunai (Cash)';
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'savings':
        return 'Tabungan / Celengan';
      default:
        return 'Lainnya';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Dompet & Rekening</Text>
        <Pressable
          onPress={() => router.push('/modal/add-wallet')}
          hitSlop={12}
          style={styles.addHeaderBtn}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Summary Card */}
        <View style={[styles.summaryCard, shadowStyles.md]}>
          <Text style={styles.summaryLabel}>Total Saldo di Semua Dompet</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.summarySub}>
            Tersimpan di {wallets.length} tempat (Tunai, Bank, E-Wallet, dll)
          </Text>

          <View style={styles.summaryActionRow}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/modal/transfer-funds')}>
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Transfer Antar Dompet</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButtonSecondary, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/modal/add-wallet')}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.actionButtonSecondaryText}>+ Dompet Baru</Text>
            </Pressable>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Daftar Tempat Simpan Uang</Text>
          <Text style={styles.sectionCount}>{wallets.length} Dompet</Text>
        </View>

        {/* Wallets List */}
        <View style={styles.walletsList}>
          {wallets.map((wallet) => {
            const isNegative = (wallet.balance || 0) < 0;
            return (
              <View
                key={wallet.id}
                style={[
                  styles.walletItemCard,
                  wallet.is_default === 1 && styles.walletItemCardDefault,
                  shadowStyles.sm,
                ]}>
                {/* Top Info */}
                <View style={styles.walletItemTop}>
                  <View style={[styles.walletIconCircle, { backgroundColor: `${wallet.color}18` }]}>
                    <Ionicons
                      name={(wallet.icon || 'wallet-outline') as any}
                      size={22}
                      color={wallet.color}
                    />
                  </View>

                  <View style={styles.walletInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.walletItemName} numberOfLines={1}>
                        {wallet.name}
                      </Text>
                      {wallet.is_default === 1 && (
                        <View style={styles.defaultPill}>
                          <Ionicons name="star" size={9} color="#D97706" />
                          <Text style={styles.defaultPillText}>Utama</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.walletItemType}>{getTypeLabel(wallet.type)}</Text>
                  </View>

                  <View style={styles.balanceRight}>
                    <Text style={[styles.currentBalance, isNegative && styles.negativeBalance]}>
                      {formatCurrency(wallet.balance || 0)}
                    </Text>
                    {wallet.initial_balance > 0 && (
                      <Text style={styles.initialBalanceSub}>
                        Saldo awal: {formatCurrency(wallet.initial_balance)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.cardActionsRow}>
                  {wallet.is_default !== 1 && (
                    <Pressable
                      style={({ pressed }) => [styles.cardActionBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => handleSetDefault(wallet)}>
                      <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.cardActionBtnText}>Jadikan Utama</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={({ pressed }) => [styles.cardActionBtn, pressed && { opacity: 0.7 }]}
                    onPress={() =>
                      router.push({
                        pathname: '/modal/add-wallet',
                        params: { id: wallet.id },
                      })
                    }>
                    <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                    <Text style={[styles.cardActionBtnText, { color: colors.primary }]}>Edit</Text>
                  </Pressable>

                  {wallets.length > 1 && (
                    <Pressable
                      style={({ pressed }) => [styles.cardActionBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => handleDelete(wallet)}>
                      <Ionicons name="trash-outline" size={14} color={colors.expense} />
                      <Text style={[styles.cardActionBtnText, { color: colors.expense }]}>Hapus</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={styles.tipText}>
            💡 <Text style={{ fontWeight: '700' }}>Tips Realitas Keuangan:</Text> Pisahkan uang cash di dompet, rekening bank untuk tabungan/gaji, dan e-wallet untuk jajan harian agar pencatatan Anda akurat dengan saldo asli di rekening/dompet Anda.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 4,
  },
  summarySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  summaryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonSecondaryText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  walletsList: {
    gap: 12,
  },
  walletItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  walletItemCardDefault: {
    borderColor: '#FDE68A',
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  walletItemType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  currentBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  negativeBalance: {
    color: colors.expenseDark,
  },
  initialBalanceSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 12,
    paddingTop: 10,
    gap: 14,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginTop: 20,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark,
  },
});
