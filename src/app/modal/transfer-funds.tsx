import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { formatCurrency, parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { useI18n } from '@/i18n';

export default function TransferFundsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const params = useLocalSearchParams<{ sourceId?: string; destId?: string }>();

  const { wallets, transferBetweenWallets } = useFinance();
  const { t, getWalletName, language } = useI18n();

  const [sourceId, setSourceId] = useState<string>(
    params.sourceId || (wallets.length > 0 ? wallets[0].id : '')
  );
  const [destId, setDestId] = useState<string>(
    params.destId || (wallets.length > 1 ? wallets[1].id : '')
  );
  const [rawAmount, setRawAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayISO());
  const [notes, setNotes] = useState<string>('');

  const sourceWallet = wallets.find((w) => w.id === sourceId);
  const destWallet = wallets.find((w) => w.id === destId);

  const transferAmount = parseInt(rawAmount, 10) || 0;

  const handleAmountChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const handleSwap = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  const handleSubmit = async () => {
    if (!sourceId || !destId) {
      Alert.alert(t('common_attention'), t('transfer_modal_err_select'));
      return;
    }
    if (sourceId === destId) {
      Alert.alert(t('common_attention'), t('transfer_modal_err_same'));
      return;
    }
    if (transferAmount <= 0) {
      Alert.alert(t('common_attention'), t('transfer_modal_err_amount'));
      return;
    }

    try {
      await transferBetweenWallets({
        sourceWalletId: sourceId,
        destinationWalletId: destId,
        amount: transferAmount,
        date,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('common_error'), t('transfer_modal_err_failed'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('transfer_modal_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Source Wallet Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('transfer_modal_from_label')}</Text>
          <View style={styles.walletsRow}>
            {wallets.map((w) => {
              const isSelected = sourceId === w.id;
              const isDest = destId === w.id;
              return (
                <Pressable
                  key={w.id}
                  disabled={isDest}
                  style={[
                    styles.walletChip,
                    isSelected && { backgroundColor: `${w.color}20`, borderColor: w.color },
                    isDest && styles.walletChipDisabled,
                  ]}
                  onPress={() => setSourceId(w.id)}>
                  <Ionicons
                    name={(w.icon || 'wallet-outline') as any}
                    size={16}
                    color={isSelected ? w.color : colors.textSecondary}
                  />
                  <View>
                    <Text style={[styles.walletChipTitle, isSelected && { color: w.color, fontWeight: '700' }]}>
                      {getWalletName(w)}
                    </Text>
                    <Text style={styles.walletChipBalance}>
                      {formatCurrency(w.balance || 0, language)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Swap Button */}
        <View style={styles.swapRow}>
          <View style={styles.swapDivider} />
          <Pressable style={styles.swapBtn} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </Pressable>
          <View style={styles.swapDivider} />
        </View>

        {/* Destination Wallet Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('transfer_modal_to_label')}</Text>
          <View style={styles.walletsRow}>
            {wallets.map((w) => {
              const isSelected = destId === w.id;
              const isSource = sourceId === w.id;
              return (
                <Pressable
                  key={w.id}
                  disabled={isSource}
                  style={[
                    styles.walletChip,
                    isSelected && { backgroundColor: `${w.color}20`, borderColor: w.color },
                    isSource && styles.walletChipDisabled,
                  ]}
                  onPress={() => setDestId(w.id)}>
                  <Ionicons
                    name={(w.icon || 'wallet-outline') as any}
                    size={16}
                    color={isSelected ? w.color : colors.textSecondary}
                  />
                  <View>
                    <Text style={[styles.walletChipTitle, isSelected && { color: w.color, fontWeight: '700' }]}>
                      {getWalletName(w)}
                    </Text>
                    <Text style={styles.walletChipBalance}>
                      {formatCurrency(w.balance || 0, language)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('transfer_modal_amount_label')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawAmount}
              onChangeText={handleAmountChange}
              autoFocus
            />
          </View>
        </View>

        {/* Transfer Impact Preview Card */}
        {sourceWallet && destWallet && transferAmount > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t('transfer_modal_preview_title')}</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{getWalletName(sourceWallet)}:</Text>
              <Text style={styles.previewSub}>
                {formatCurrency(sourceWallet.balance || 0, language)} ➔{' '}
                <Text style={{ color: colors.expenseDark, fontWeight: '700' }}>
                  {formatCurrency((sourceWallet.balance || 0) - transferAmount, language)}
                </Text>
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{getWalletName(destWallet)}:</Text>
              <Text style={styles.previewSub}>
                {formatCurrency(destWallet.balance || 0, language)} ➔{' '}
                <Text style={{ color: colors.incomeDark, fontWeight: '700' }}>
                  {formatCurrency((destWallet.balance || 0) + transferAmount, language)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Date Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('transfer_modal_date_label')}</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.todayBtn} onPress={() => setDate(getTodayISO())}>
              <Text style={styles.todayBtnText}>{t('common_today')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('common_notes_optional')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={t('transfer_modal_notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit}>
          <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{t('transfer_modal_btn_confirm')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  walletsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  walletChipDisabled: {
    opacity: 0.4,
  },
  walletChipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  walletChipBalance: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  swapDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    padding: 0,
  },
  previewCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 6,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  previewSub: {
    fontSize: 13,
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  todayBtn: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
