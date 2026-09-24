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
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { useI18n } from '@/i18n';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency, parseCurrencyInput } from '@/utils/format-currency';

export default function AddPlanModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(params.id);
  const { t, getCategoryName, language } = useI18n();

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;

  const { categories, plans, createPlan, editPlan, cashflowSummary } = useFinance();

  const [title, setTitle] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_shopping');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [existingPlan, setExistingPlan] = useState<any>(null);

  // Filter expense categories for buying things
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (params.id && plans.length > 0) {
      const found = plans.find((p) => p.id === params.id);
      if (found) {
        setExistingPlan(found);
        setTitle(found.title);
        setRawAmount(found.target_amount.toString());
        setSelectedCategory(found.category_id || 'cat_shopping');
        setTargetDate(found.target_date || '');
        setNotes(found.notes || '');
        setIsPinned(found.is_pinned === 1);
      }
    }
  }, [params.id, plans]);

  const handleAmountChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const parsedAmount = parseInt(rawAmount, 10) || 0;
  const currentBalance = Math.max(0, cashflowSummary.balance);
  const progressPct = parsedAmount > 0 ? Math.min(100, Math.max(0, (currentBalance / parsedAmount) * 100)) : 0;
  const isReady = parsedAmount > 0 && currentBalance >= parsedAmount;

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common_attention'), t('plan_modal_err_title'));
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert(t('common_attention'), t('plan_modal_err_amount'));
      return;
    }

    try {
      if (isEditing && params.id && existingPlan) {
        await editPlan({
          id: params.id,
          title: title.trim(),
          target_amount: parsedAmount,
          category_id: selectedCategory || null,
          target_date: targetDate.trim() || null,
          is_pinned: isPinned ? 1 : 0,
          is_completed: existingPlan.is_completed ?? 0,
          completed_at: existingPlan.completed_at ?? null,
          notes: notes.trim() || null,
        });
        Alert.alert(t('common_success'), t('plan_modal_success_edit'), [
          { text: t('common_ok'), onPress: () => router.back() },
        ]);
      } else {
        await createPlan({
          title: title.trim(),
          target_amount: parsedAmount,
          category_id: selectedCategory || null,
          target_date: targetDate.trim() || null,
          is_pinned: isPinned ? 1 : 0,
          notes: notes.trim() || null,
        });
        Alert.alert(t('common_success'), t('plan_modal_success_add'), [
          { text: t('common_ok'), onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('common_error'), t('plan_modal_err_save'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? t('plan_modal_edit_title') : t('plan_modal_add_title')}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Amount Input */}
          <View style={[styles.amountCard, shadowStyles.sm]}>
            <Text style={styles.amountLabel}>{t('plan_modal_amount_label')}</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                keyboardType="numeric"
                value={rawAmount}
                onChangeText={handleAmountChange}
                autoFocus={!isEditing}
              />
            </View>

            {/* Live Progress Preview */}
            {parsedAmount > 0 && (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    {t('plan_modal_current_cash', { amount: formatCurrency(currentBalance, language) })}
                  </Text>
                  <Text
                    style={[
                      styles.previewBadge,
                      { color: isReady ? colors.incomeDark : colors.primaryDark },
                    ]}>
                    {isReady ? t('plan_modal_ready_badge') : t('plan_modal_pct_badge', { pct: progressPct.toFixed(0) })}
                  </Text>
                </View>
                <View style={styles.previewTrack}>
                  <View
                    style={[
                      styles.previewFill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: isReady ? colors.income : colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('plan_modal_title_label')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('plan_modal_title_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Pin to Home Switch */}
          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <View style={[styles.switchIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>{t('plan_modal_pin_title')}</Text>
                <Text style={styles.switchDesc}>
                  {t('plan_modal_pin_desc')}
                </Text>
              </View>
            </View>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('plan_modal_category_label')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {expenseCategories.map((cat) => {
                const selected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selected && { backgroundColor: `${cat.color}22`, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}>
                    <Ionicons
                      name={(cat.icon as any) || 'grid-outline'}
                      size={16}
                      color={selected ? cat.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        selected && { color: cat.color, fontWeight: '700' },
                      ]}>
                      {getCategoryName(cat)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Target Deadline Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('plan_modal_date_label')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('plan_modal_date_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={targetDate}
              onChangeText={setTargetDate}
              maxLength={10}
            />
          </View>

          {/* Notes Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('plan_modal_notes_label')}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder={t('plan_modal_notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
            onPress={handleSubmit}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {isEditing ? t('plan_modal_submit_edit') : t('plan_modal_submit_add')}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    padding: 0,
  },
  previewBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewFill: {
    height: '100%',
    borderRadius: 4,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  switchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  catChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
