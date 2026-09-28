import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency, parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { DebtPayment } from '@/types';
import { useI18n } from '@/i18n';

export default function DebtDetailModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;

  const {
    debts,
    wallets,
    getDebtPayments,
    createDebtPayment,
    deleteDebtPaymentById,
    toggleDebtStatus,
    isMultiWalletEnabled,
  } = useFinance();

  const { t, language, formatDateShort } = useI18n();

  // Find debt from context
  const debt = debts.find((d) => d.id === id);

  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [rawAmount, setRawAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default wallet
  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      const def = wallets.find((w) => w.is_default === 1) || wallets[0];
      setSelectedWalletId(def.id);
    }
  }, [wallets, selectedWalletId]);

  const loadPayments = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingPayments(true);
      const list = await getDebtPayments(id);
      setPayments(list);
    } catch (err) {
      console.error('Error fetching debt payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [id, getDebtPayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  if (!debt) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('common_attention')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('debt_detail_not_found')}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{t('common_back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isReceivable = debt.type === 'receivable';
  const isPaid = debt.is_paid === 1;
  const paidAmount = debt.paid_amount ?? (isPaid ? debt.amount : 0);
  const remainingAmount = debt.remaining_amount ?? (isPaid ? 0 : Math.max(0, debt.amount - paidAmount));
  const progressPercent = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 0;

  const isOverdue =
    !isPaid &&
    debt.due_date &&
    new Date(debt.due_date + 'T23:59:59').getTime() < Date.now();

  const themeColor = isReceivable ? colors.receivable : colors.debt;
  const themeSoft = isReceivable ? colors.receivableSoft : colors.debtSoft;

  const handleAmountChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const handleOpenInstallmentForm = (prefillFull: boolean = false) => {
    if (prefillFull) {
      setRawAmount(remainingAmount > 0 ? remainingAmount.toString() : '');
    } else {
      setRawAmount('');
    }
    setPaymentDate(getTodayISO());
    setNotes('');
    setShowPaymentForm(true);
  };

  const handleSavePayment = async () => {
    const amount = parseInt(rawAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert(t('common_attention'), t('debt_detail_err_amount'));
      return;
    }

    if (remainingAmount > 0 && amount > remainingAmount) {
      Alert.alert(
        t('common_attention'),
        t('debt_detail_err_excess', {
          amount: formatCurrency(amount, language),
          remaining: formatCurrency(remainingAmount, language),
        })
      );
      return;
    }

    const walletId = selectedWalletId || (wallets.length > 0 ? wallets[0].id : 'wallet_cash');

    try {
      setIsSubmitting(true);
      await createDebtPayment({
        debtId: debt.id,
        amount,
        paymentDate,
        walletId,
        notes: notes.trim() || null,
      });

      await loadPayments();
      setShowPaymentForm(false);
      setRawAmount('');
      setNotes('');
    } catch (err) {
      console.error('Error saving payment:', err);
      Alert.alert(t('common_error'), t('debt_detail_err_save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = (payment: DebtPayment) => {
    Alert.alert(
      t('debt_detail_delete_payment_title'),
      t('debt_detail_delete_payment_msg', { amount: formatCurrency(payment.amount, language) }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDebtPaymentById(payment.id);
              await loadPayments();
            } catch (err) {
              console.error('Error deleting payment:', err);
              Alert.alert(t('common_error'), 'Gagal menghapus pembayaran.');
            }
          },
        },
      ]
    );
  };

  const handleReopenDebt = () => {
    Alert.alert(
      t('debt_detail_reopen_title'),
      t('debt_detail_reopen_msg'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('debt_detail_reopen_btn'),
          onPress: async () => {
            await toggleDebtStatus(debt.id, false);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isReceivable ? t('debt_detail_title_receivable') : t('debt_detail_title_payable')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Main Debt Overview Card */}
        <View style={[styles.card, shadowStyles.sm]}>
          <View style={styles.topRow}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: themeSoft }]}>
              <Ionicons
                name={isReceivable ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
                size={16}
                color={themeColor}
              />
              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                {isReceivable ? t('debt_item_badge_receivable') : t('debt_item_badge_payable')}
              </Text>
            </View>

            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                isPaid ? styles.statusBadgePaid : styles.statusBadgeUnpaid,
              ]}>
              <Ionicons
                name={isPaid ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={isPaid ? colors.incomeDark : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  isPaid ? styles.statusTextPaid : styles.statusTextUnpaid,
                ]}>
                {isPaid ? t('debt_status_settled') : t('debt_status_unsettled')}
              </Text>
            </View>
          </View>

          {/* Counterparty Name */}
          <Text style={styles.personName}>{debt.person_name}</Text>

          {/* Notes if any */}
          {debt.notes ? (
            <Text style={styles.notesText}>{debt.notes}</Text>
          ) : null}

          {/* Amount Balance Overview Grid */}
          <View style={styles.amountGrid}>
            <View style={styles.amountBox}>
              <Text style={styles.amountBoxLabel}>{t('debt_detail_total')}</Text>
              <Text style={styles.amountBoxValue}>{formatCurrency(debt.amount, language)}</Text>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountBoxLabel}>{t('debt_detail_paid')}</Text>
              <Text style={[styles.amountBoxValue, { color: colors.incomeDark }]}>
                {formatCurrency(paidAmount, language)}
              </Text>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountBoxLabel}>{t('debt_detail_remaining')}</Text>
              <Text
                style={[
                  styles.amountBoxValue,
                  { color: isPaid ? colors.textMuted : themeColor },
                ]}>
                {formatCurrency(remainingAmount, language)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isPaid ? colors.incomeDark : themeColor,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressPercentLabel}>
                {progressPercent}% {t('debt_status_settled').toLowerCase()}
              </Text>
              {isPaid && debt.paid_date ? (
                <Text style={styles.paidDateLabel}>
                  {t('debt_detail_settled_on', { date: formatDateShort(debt.paid_date) })}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Dates metadata */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {t('debt_borrow_date', { date: formatDateShort(debt.issue_date) })}
              </Text>
            </View>
            {debt.due_date ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="alarm-outline"
                  size={14}
                  color={isOverdue ? colors.expenseDark : colors.textMuted}
                />
                <Text
                  style={[
                    styles.metaText,
                    isOverdue && { color: colors.expenseDark, fontWeight: '700' },
                  ]}>
                  {isOverdue
                    ? t('debt_overdue', { date: formatDateShort(debt.due_date) })
                    : t('debt_due_date', { date: formatDateShort(debt.due_date) })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Settled Banner if fully paid */}
        {isPaid ? (
          <View style={styles.settledBanner}>
            <Ionicons name="checkmark-circle" size={24} color={colors.incomeDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settledBannerTitle}>
                {t('debt_detail_settled_banner')}
              </Text>
              {debt.paid_date ? (
                <Text style={styles.settledBannerSub}>
                  {t('debt_detail_settled_on', { date: formatDateShort(debt.paid_date) })}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={handleReopenDebt}
              style={({ pressed }) => [styles.reopenBtn, pressed && { opacity: 0.7 }]}>
              <Text style={styles.reopenBtnText}>{t('debt_detail_reopen_btn')}</Text>
            </Pressable>
          </View>
        ) : (
          /* Action Buttons for Unpaid Debt */
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnPrimary,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => handleOpenInstallmentForm(false)}>
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnPrimaryText}>
                {t('debt_detail_btn_add_payment')}
              </Text>
            </Pressable>

            {remainingAmount > 0 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.actionBtnSecondary,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => handleOpenInstallmentForm(true)}>
                <Ionicons name="checkmark-done" size={18} color={themeColor} />
                <Text style={[styles.actionBtnSecondaryText, { color: themeColor }]}>
                  {t('debt_detail_btn_settle_all')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Payment Input Form */}
        {showPaymentForm && !isPaid && (
          <View style={[styles.formCard, shadowStyles.sm]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t('debt_detail_form_title')}</Text>
              <Pressable onPress={() => setShowPaymentForm(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Amount Input */}
            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>{t('debt_detail_amount_label')}</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.amountPrefix}>Rp</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={rawAmount ? formatCurrency(parseInt(rawAmount, 10)).replace('Rp ', '') : ''}
                  onChangeText={handleAmountChange}
                  autoFocus
                />
              </View>

              {/* Quick shortcut chip */}
              {remainingAmount > 0 && (
                <View style={styles.quickChipsRow}>
                  <Pressable
                    style={styles.quickChip}
                    onPress={() => setRawAmount(remainingAmount.toString())}>
                    <Text style={styles.quickChipText}>
                      {t('debt_detail_btn_settle_all')}: {formatCurrency(remainingAmount, language)}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Wallet Selection */}
            {isMultiWalletEnabled && wallets.length > 0 && (
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>{t('debt_detail_wallet_label')}</Text>
                <View style={styles.walletGrid}>
                  {wallets.map((w) => {
                    const isSelected = selectedWalletId === w.id;
                    return (
                      <Pressable
                        key={w.id}
                        style={[
                          styles.walletChip,
                          isSelected && { backgroundColor: `${w.color}18`, borderColor: w.color },
                        ]}
                        onPress={() => setSelectedWalletId(w.id)}>
                        <Ionicons
                          name={(w.icon || 'wallet-outline') as any}
                          size={15}
                          color={isSelected ? w.color : colors.textSecondary}
                        />
                        <View style={{ flexShrink: 1 }}>
                          <Text
                            style={[
                              styles.walletName,
                              isSelected && { color: w.color, fontWeight: '700' },
                            ]}
                            numberOfLines={1}>
                            {w.name}
                          </Text>
                          <Text style={styles.walletBalance} numberOfLines={1}>
                            {formatCurrency(w.balance || 0, language)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Payment Date */}
            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>{t('debt_detail_date_label')}</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable
                  style={styles.todayBtn}
                  onPress={() => setPaymentDate(getTodayISO())}>
                  <Text style={styles.todayBtnText}>{t('common_today')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>{t('debt_detail_notes_label')}</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder={t('debt_detail_notes_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Form Action Buttons */}
            <View style={styles.formBtnRow}>
              <Pressable
                style={[styles.formBtn, styles.formBtnCancel]}
                onPress={() => setShowPaymentForm(false)}>
                <Text style={styles.formBtnCancelText}>{t('common_cancel')}</Text>
              </Pressable>

              <Pressable
                style={[styles.formBtn, styles.formBtnSubmit, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                onPress={handleSavePayment}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.formBtnSubmitText}>
                    {t('debt_detail_submit_payment')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Payment History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('debt_detail_history_title')}</Text>
            {payments.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {t('debt_detail_history_count', { count: payments.length })}
              </Text>
            )}
          </View>

          {loadingPayments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.noHistoryCard}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={styles.noHistoryText}>{t('debt_detail_no_history')}</Text>
            </View>
          ) : (
            <View style={styles.paymentsList}>
              {payments.map((p) => {
                return (
                  <View key={p.id} style={[styles.paymentCard, shadowStyles.sm]}>
                    <View style={styles.paymentMain}>
                      <View
                        style={[
                          styles.walletIconWrap,
                          { backgroundColor: `${p.wallet_color || colors.primary}18` },
                        ]}>
                        <Ionicons
                          name={(p.wallet_icon || 'wallet-outline') as any}
                          size={18}
                          color={p.wallet_color || colors.primary}
                        />
                      </View>

                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentDate}>
                          {formatDateShort(p.payment_date)}
                        </Text>
                        {p.notes ? (
                          <Text style={styles.paymentNotes} numberOfLines={2}>
                            {p.notes}
                          </Text>
                        ) : null}
                        {p.wallet_name ? (
                          <View style={styles.paymentWalletTag}>
                            <Text style={styles.paymentWalletText}>
                              {p.wallet_name}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.paymentRight}>
                        <Text
                          style={[
                            styles.paymentAmount,
                            { color: isReceivable ? colors.incomeDark : colors.expenseDark },
                          ]}>
                          {isReceivable ? '+' : '-'} {formatCurrency(p.amount, language)}
                        </Text>

                        <Pressable
                          onPress={() => handleDeletePayment(p)}
                          hitSlop={8}
                          style={styles.paymentDeleteBtn}>
                          <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePaid: {
    backgroundColor: colors.incomeSoft,
  },
  statusBadgeUnpaid: {
    backgroundColor: colors.surfaceHover,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: colors.incomeDark,
  },
  statusTextUnpaid: {
    color: colors.textSecondary,
  },
  personName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    justifyContent: 'space-between',
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountBoxLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  amountBoxValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  progressSection: {
    marginTop: 14,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressPercentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  paidDateLabel: {
    fontSize: 11,
    color: colors.incomeDark,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  settledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.incomeSoft,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: `${colors.incomeDark}30`,
  },
  settledBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.incomeDark,
  },
  settledBannerSub: {
    fontSize: 11,
    color: colors.incomeDark,
    marginTop: 2,
    opacity: 0.8,
  },
  reopenBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reopenBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  formInputGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  quickChipText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '47%',
    flex: 1,
  },
  walletName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  walletBalance: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    height: 40,
  },
  todayBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnCancel: {
    backgroundColor: colors.surfaceHover,
  },
  formBtnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  formBtnSubmit: {
    backgroundColor: colors.primary,
  },
  formBtnSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historySection: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noHistoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noHistoryText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  paymentsList: {
    gap: 8,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  paymentNotes: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentWalletTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  paymentWalletText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  paymentDeleteBtn: {
    padding: 4,
  },
});
