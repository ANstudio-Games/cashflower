import React, { useState, useEffect } from 'react';
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
  Switch,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { parseCurrencyInput } from '@/utils/format-currency';
import { WalletType } from '@/types';
import { useI18n } from '@/i18n';

const WALLET_TYPES: { type: WalletType; icon: string }[] = [
  { type: 'cash', icon: 'cash-outline' },
  { type: 'bank', icon: 'card-outline' },
  { type: 'ewallet', icon: 'phone-portrait-outline' },
  { type: 'savings', icon: 'archive-outline' },
  { type: 'other', icon: 'wallet-outline' },
];

const AVAILABLE_ICONS = [
  'cash-outline',
  'card-outline',
  'wallet-outline',
  'phone-portrait-outline',
  'business-outline',
  'archive-outline',
  'cube-outline',
  'lock-closed-outline',
  'gift-outline',
  'diamond-outline',
  'storefront-outline',
  'receipt-outline',
];

const AVAILABLE_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#0D9488', // Teal
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export default function AddWalletModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { wallets, createWallet, editWallet } = useFinance();
  const { t, getWalletName } = useI18n();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [rawInitialBalance, setRawInitialBalance] = useState('');
  const [icon, setIcon] = useState('cash-outline');
  const [color, setColor] = useState('#10B981');
  const [isDefault, setIsDefault] = useState(false);
  const [existingCreatedAt, setExistingCreatedAt] = useState(Date.now());

  useEffect(() => {
    if (params.id) {
      const existing = wallets.find((w) => w.id === params.id);
      if (existing) {
        setName(getWalletName(existing) || existing.name || '');
        setType(existing.type || 'cash');
        setRawInitialBalance(existing.initial_balance ? existing.initial_balance.toString() : '');
        setIcon(existing.icon || 'cash-outline');
        setColor(existing.color || '#10B981');
        setIsDefault(existing.is_default === 1);
        setExistingCreatedAt(existing.created_at || Date.now());
      }
    }
  }, [params.id, wallets, getWalletName]);

  const handleBalanceChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawInitialBalance(num > 0 ? num.toString() : '');
  };

  const handleTypeSelect = (selectedType: WalletType) => {
    setType(selectedType);
    // Set appropriate default icon based on type if still default
    if (selectedType === 'cash') setIcon('cash-outline');
    else if (selectedType === 'bank') setIcon('card-outline');
    else if (selectedType === 'ewallet') setIcon('phone-portrait-outline');
    else if (selectedType === 'savings') setIcon('archive-outline');
  };

  const getTypeLabel = (walletType: WalletType) => {
    switch (walletType) {
      case 'cash':
        return t('wallet_type_cash_full');
      case 'bank':
        return t('wallet_type_bank_full');
      case 'ewallet':
        return t('wallet_type_ewallet');
      case 'savings':
        return t('wallet_type_savings_full');
      default:
        return t('wallet_type_other');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('common_attention'), t('wallet_modal_err_name'));
      return;
    }

    const initialBalance = rawInitialBalance ? parseInt(rawInitialBalance, 10) : 0;

    try {
      if (isEditing && params.id) {
        await editWallet({
          id: params.id,
          name: name.trim(),
          type,
          initial_balance: initialBalance,
          icon,
          color,
          is_default: isDefault ? 1 : 0,
          created_at: existingCreatedAt,
        });
      } else {
        await createWallet({
          name: name.trim(),
          type,
          initial_balance: initialBalance,
          icon,
          color,
          is_default: isDefault ? 1 : 0,
        });
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('common_error'), isEditing ? t('wallet_modal_err_update') : t('wallet_modal_err_save'));
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
        <Text style={styles.headerTitle}>
          {isEditing ? t('wallet_modal_edit_title') : t('wallet_modal_add_title')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Wallet Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('wallet_modal_name_label')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('wallet_modal_name_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus={!isEditing}
          />
        </View>

        {/* Wallet Type */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('wallet_modal_type_label')}</Text>
          <View style={styles.typeGrid}>
            {WALLET_TYPES.map((wt) => {
              const isSelected = type === wt.type;
              return (
                <Pressable
                  key={wt.type}
                  style={[
                    styles.typeChip,
                    isSelected && { backgroundColor: `${color}18`, borderColor: color },
                  ]}
                  onPress={() => handleTypeSelect(wt.type)}>
                  <Ionicons
                    name={wt.icon as any}
                    size={16}
                    color={isSelected ? color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      isSelected && { color, fontWeight: '700' },
                    ]}>
                    {getTypeLabel(wt.type)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Initial Balance */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('wallet_modal_balance_label')}</Text>
          <Text style={styles.amountSub}>
            {t('wallet_modal_balance_sub')}
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawInitialBalance}
              onChangeText={handleBalanceChange}
            />
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('wallet_modal_icon_label')}</Text>
          <View style={styles.iconsRow}>
            {AVAILABLE_ICONS.map((ic) => {
              const isSelected = icon === ic;
              return (
                <Pressable
                  key={ic}
                  style={[
                    styles.iconBox,
                    isSelected && { borderColor: color, backgroundColor: `${color}20` },
                  ]}
                  onPress={() => setIcon(ic)}>
                  <Ionicons
                    name={ic as any}
                    size={20}
                    color={isSelected ? color : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>{t('wallet_modal_color_label')}</Text>
          <View style={styles.colorsRow}>
            {AVAILABLE_COLORS.map((c) => {
              const isSelected = color === c;
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => setColor(c)}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Default Wallet Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('wallet_modal_default_title')}</Text>
            <Text style={styles.switchSub}>
              {t('wallet_modal_default_sub')}
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: colors.border, true: color }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: color },
            pressed && styles.submitBtnPressed,
          ]}
          onPress={handleSubmit}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isEditing ? t('wallet_modal_btn_edit') : t('wallet_modal_btn_add')}
          </Text>
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
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  amountSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    padding: 0,
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  switchSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
