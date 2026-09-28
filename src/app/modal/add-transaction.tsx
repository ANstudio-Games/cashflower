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
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { formatCurrency, parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { TransactionType } from '@/types';
import { useI18n } from '@/i18n';

export default function AddTransactionModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { categories, transactions, wallets, createTransaction, editTransaction, isMultiWalletEnabled } = useFinance();
  const { t, getCategoryName, getWalletName, language } = useI18n();

  const [type, setType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayISO());
  const [notes, setNotes] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [existingCreatedAt, setExistingCreatedAt] = useState<number>(Date.now());

  // If editing, pre-fill form
  useEffect(() => {
    if (params.id) {
      const existing = transactions.find((t) => t.id === params.id);
      if (existing) {
        setType(existing.type);
        setRawAmount(existing.amount ? existing.amount.toString() : '');
        setTitle(existing.title || '');
        setDate(existing.date || getTodayISO());
        setNotes(existing.notes || '');
        setSelectedCategory(existing.category_id || '');
        setSelectedWallet(existing.wallet_id || '');
        setExistingCreatedAt(existing.created_at || Date.now());
      }
    }
  }, [params.id, transactions]);

  // Set default wallet if none selected
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      const defaultW = wallets.find((w) => w.is_default === 1) || wallets[0];
      setSelectedWallet(defaultW.id);
    }
  }, [wallets, selectedWallet]);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  // Set default category if none selected
  useEffect(() => {
    if (availableCategories.length > 0 && !isEditing) {
      const currentExists = availableCategories.some((c) => c.id === selectedCategory);
      if (!currentExists) {
        setSelectedCategory(availableCategories[0].id);
      }
    }
  }, [type, availableCategories, selectedCategory, isEditing]);

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setRawAmount(clean);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common_attention'), t('tx_modal_err_amount'));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t('common_attention'), t('tx_modal_err_title'));
      return;
    }
    if (!selectedCategory) {
      Alert.alert(t('common_attention'), t('tx_modal_err_category'));
      return;
    }

    const walletId = isMultiWalletEnabled
      ? (selectedWallet || (wallets.length > 0 ? wallets[0].id : 'wallet_cash'))
      : null;

    try {
      if (isEditing && params.id) {
        await editTransaction({
          id: params.id,
          title: title.trim(),
          amount,
          type,
          category_id: selectedCategory,
          wallet_id: walletId,
          destination_wallet_id: null,
          date,
          notes: notes.trim() || null,
          created_at: existingCreatedAt,
        });
      } else {
        await createTransaction({
          title: title.trim(),
          amount,
          type,
          category_id: selectedCategory,
          wallet_id: walletId,
          destination_wallet_id: null,
          date,
          notes: notes.trim() || null,
        });
      }
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t('common_error'), isEditing ? t('tx_modal_err_update') : t('tx_modal_err_save'));
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
        <Text style={styles.headerTitle}>{isEditing ? t('tx_modal_edit_title') : t('tx_modal_add_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Transfer Banner */}
        {isMultiWalletEnabled && (
          <Pressable
            style={styles.transferBanner}
            onPress={() => {
              router.replace('/modal/transfer-funds');
            }}>
            <View style={styles.transferBannerIcon}>
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
            </View>
            <Text style={styles.transferBannerText}>
              {t('tx_modal_transfer_banner')}
            </Text>
          </Pressable>
        )}

        {/* Type Switcher */}
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
            onPress={() => setType('expense')}>
            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={type === 'expense' ? colors.expenseDark : colors.textSecondary}
            />
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActiveExpense]}>
              {t('common_expense')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
            onPress={() => setType('income')}>
            <Ionicons
              name="arrow-down-circle-outline"
              size={18}
              color={type === 'income' ? colors.incomeDark : colors.textSecondary}
            />
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActiveIncome]}>
              {t('common_income')}
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.inputLabel}>{t('tx_modal_amount_label')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawAmount}
              onChangeText={handleAmountChange}
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Wallet Selection */}
        {isMultiWalletEnabled && (
          <View style={styles.inputSection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.sectionTitle}>
                {type === 'expense' ? t('tx_modal_wallet_pay') : t('tx_modal_wallet_receive')}
              </Text>
              <Pressable
                onPress={() => router.push('/modal/wallets')}
                hitSlop={8}
                style={styles.addCategoryBtn}>
                <Ionicons name="wallet-outline" size={15} color={colors.primary} />
                <Text style={styles.addCategoryText}>{t('tx_modal_wallet_manage')}</Text>
              </Pressable>
            </View>

            <View style={styles.walletsSelectGrid}>
              {wallets.map((w) => {
                const isSelected = selectedWallet === w.id;
                return (
                  <Pressable
                    key={w.id}
                    style={[
                      styles.walletSelectChip,
                      isSelected && { backgroundColor: `${w.color}18`, borderColor: w.color },
                    ]}
                    onPress={() => setSelectedWallet(w.id)}>
                    <Ionicons
                      name={(w.icon || 'wallet-outline') as any}
                      size={16}
                      color={isSelected ? w.color : colors.textSecondary}
                    />
                    <View style={{ flexShrink: 1 }}>
                      <Text
                        style={[
                          styles.walletSelectName,
                          isSelected && { color: w.color, fontWeight: '700' },
                        ]}
                        numberOfLines={1}>
                        {getWalletName(w)}
                      </Text>
                      <Text style={styles.walletSelectBalance} numberOfLines={1}>
                        {formatCurrency(w.balance || 0, language)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Title / Item Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {type === 'expense' ? t('tx_modal_item_expense') : t('tx_modal_item_income')}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={
              type === 'expense'
                ? t('tx_modal_placeholder_expense')
                : t('tx_modal_placeholder_income')
            }
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Selector */}
        <View style={styles.inputSection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionTitle}>{t('tx_modal_select_category')}</Text>
            <Pressable
              onPress={() => router.push('/modal/add-category')}
              hitSlop={8}
              style={styles.addCategoryBtn}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.addCategoryText}>{t('tx_modal_add_category')}</Text>
            </Pressable>
          </View>

          <View style={styles.categoriesGrid}>
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}>
                  <Ionicons
                    name={(cat.icon || 'grid-outline') as any}
                    size={16}
                    color={isSelected ? cat.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && { color: cat.color, fontWeight: '700' },
                    ]}>
                    {getCategoryName(cat)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('tx_modal_date_label')}</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              style={styles.todayBtn}
              onPress={() => setDate(getTodayISO())}>
              <Text style={styles.todayBtnText}>{t('common_today')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('common_notes_optional')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={t('tx_modal_notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isEditing ? t('tx_modal_save_edit') : t('tx_modal_save_add')}
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
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnActiveExpense: {
    backgroundColor: colors.expenseSoft,
  },
  typeBtnActiveIncome: {
    backgroundColor: colors.incomeSoft,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTextActiveExpense: {
    color: colors.expenseDark,
    fontWeight: '700',
  },
  typeTextActiveIncome: {
    color: colors.incomeDark,
    fontWeight: '700',
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  inputSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
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
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginTop: 10,
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
  transferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  transferBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  walletsSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '48%',
  },
  walletSelectName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  walletSelectBalance: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
