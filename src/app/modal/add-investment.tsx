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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { formatCurrency, parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { InvestmentInstrument } from '@/types';
import { useI18n } from '@/i18n';

export default function AddInvestmentModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const { createInvestment } = useFinance();
  const { t } = useI18n();

  const instruments: { id: InvestmentInstrument; label: string; icon: any }[] = [
    { id: 'saham', label: t('inst_saham'), icon: 'business-outline' },
    { id: 'kripto', label: t('inst_kripto'), icon: 'logo-bitcoin' },
    { id: 'forex', label: t('inst_forex'), icon: 'swap-horizontal-outline' },
    { id: 'emas', label: t('inst_emas'), icon: 'sparkles-outline' },
    { id: 'reksadana', label: t('inst_reksadana'), icon: 'pie-chart-outline' },
    { id: 'lainnya', label: t('inst_lainnya'), icon: 'stats-chart-outline' },
  ];

  const [instrument, setInstrument] = useState<InvestmentInstrument>('saham');
  const [assetName, setAssetName] = useState('');
  const [rawBuy, setRawBuy] = useState('');
  const [rawSell, setRawSell] = useState('');
  const [tradeDate, setTradeDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');

  const buyPrice = rawBuy ? parseInt(rawBuy, 10) : 0;
  const sellPrice = rawSell ? parseInt(rawSell, 10) : 0;
  const pnl = sellPrice - buyPrice;
  const pnlPercentage = buyPrice > 0 ? (pnl / buyPrice) * 100 : 0;
  const isProfit = pnl >= 0;

  const handleSave = async () => {
    if (!assetName.trim()) {
      Alert.alert(t('common_attention'), t('inv_modal_err_asset'));
      return;
    }
    if (buyPrice <= 0) {
      Alert.alert(t('common_attention'), t('inv_modal_err_buy'));
      return;
    }

    try {
      await createInvestment({
        instrument_type: instrument,
        asset_name: assetName.trim().toUpperCase(),
        buy_price: buyPrice,
        sell_price: sellPrice,
        trade_date: tradeDate,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t('common_error'), t('inv_modal_err_save'));
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
        <Text style={styles.headerTitle}>{t('inv_modal_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Instrument Selector */}
        <Text style={styles.sectionTitle}>{t('inv_modal_select_inst')}</Text>
        <View style={styles.instrumentsRow}>
          {instruments.map((inst) => {
            const isSelected = instrument === inst.id;
            return (
              <Pressable
                key={inst.id}
                style={[styles.instChip, isSelected && styles.instChipSelected]}
                onPress={() => setInstrument(inst.id)}>
                <Ionicons
                  name={inst.icon}
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.instChipText, isSelected && styles.instChipTextSelected]}>
                  {inst.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Asset Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('inv_modal_asset_name')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('inv_modal_asset_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={assetName}
            onChangeText={setAssetName}
            autoCapitalize="characters"
          />
        </View>

        {/* Prices Row */}
        <View style={styles.pricesRow}>
          <View style={[styles.inputSection, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>{t('inv_modal_buy_price')}</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawBuy ? parseInt(rawBuy, 10).toLocaleString('id-ID') : ''}
              onChangeText={(t) => {
                const num = parseCurrencyInput(t);
                setRawBuy(num > 0 ? num.toString() : '');
              }}
            />
          </View>

          <View style={[styles.inputSection, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>{t('inv_modal_sell_price')}</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawSell ? parseInt(rawSell, 10).toLocaleString('id-ID') : ''}
              onChangeText={(t) => {
                const num = parseCurrencyInput(t);
                setRawSell(num > 0 ? num.toString() : '');
              }}
            />
          </View>
        </View>

        {/* Live PnL Preview Card */}
        {buyPrice > 0 && sellPrice > 0 ? (
          <View
            style={[
              styles.pnlCard,
              { backgroundColor: isProfit ? colors.incomeSoft : colors.expenseSoft },
            ]}>
            <View style={styles.pnlRow}>
              <View>
                <Text style={styles.pnlLabel}>{isProfit ? t('inv_modal_profit') : t('inv_modal_loss')}</Text>
                <Text
                  style={[
                    styles.pnlValue,
                    { color: isProfit ? colors.incomeDark : colors.expenseDark },
                  ]}>
                  {isProfit ? '+' : ''}
                  {formatCurrency(pnl)}
                </Text>
              </View>
              <View
                style={[
                  styles.percentBadge,
                  { backgroundColor: isProfit ? colors.income : colors.expense },
                ]}>
                <Text style={styles.percentText}>
                  {isProfit ? '+' : ''}
                  {pnlPercentage.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Trade Date */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('inv_modal_trade_date')}</Text>
          <TextInput
            style={styles.textInput}
            value={tradeDate}
            onChangeText={setTradeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Strategy Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('inv_modal_notes_label')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={t('inv_modal_notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{t('inv_modal_save')}</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  instrumentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  instChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  instChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  instChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  instChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 16,
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
  pricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pnlCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pnlValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
