import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { useI18n, LANGUAGES, Language } from '@/i18n';
import { colors } from '@/theme/colors';
import { scheduleDailyReminder, cancelDailyReminder } from '@/utils/notifications';

export default function SettingsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const {
    backupData,
    restoreData,
    transactions,
    debts,
    investments,
    plans,
    wallets,
    isMultiWalletEnabled,
    setMultiWalletEnabled,
  } = useFinance();
  const { language, setLanguage, t } = useI18n();

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [debtReminderEnabled, setDebtReminderEnabled] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      await backupData(t('backup_dialog_title'));
    } catch (err: any) {
      Alert.alert(t('settings_backup_err_title'), err.message || t('settings_backup_err_msg'));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      t('settings_restore_confirm_title'),
      t('settings_restore_confirm_msg'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('settings_restore_btn'),
          onPress: async () => {
            try {
              setIsRestoring(true);
              const restoredCount = await restoreData();
              if (restoredCount > 0) {
                Alert.alert(
                  t('settings_restore_success_title'),
                  t('settings_restore_success_msg', { count: restoredCount })
                );
              }
            } catch (err: any) {
              Alert.alert(t('settings_restore_err_title'), err.message || t('settings_restore_err_msg'));
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const toggleDailyReminder = async (val: boolean) => {
    setDailyReminderEnabled(val);
    if (val) {
      await scheduleDailyReminder(20, 0, language);
      Alert.alert(t('settings_reminder_active'), t('settings_reminder_daily_alert'));
    } else {
      await cancelDailyReminder();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings_header_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Language Selection */}
        <Text style={styles.sectionHeader}>{t('settings_language_section')}</Text>
        <View style={styles.cardGroup}>
          {LANGUAGES.map((langItem, idx) => {
            const isSelected = language === langItem.code;
            return (
              <React.Fragment key={langItem.code}>
                {idx > 0 && <View style={styles.rowDivider} />}
                <Pressable
                  style={({ pressed }) => [
                    styles.actionRow,
                    isSelected && styles.languageRowSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setLanguage(langItem.code)}>
                  <View style={[styles.flagWrap, isSelected && styles.flagWrapSelected]}>
                    <Text style={styles.flagEmoji}>{langItem.flag}</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={[styles.actionTitle, isSelected && styles.languageTextSelected]}>
                      {langItem.nativeLabel}
                    </Text>
                    <Text style={styles.actionDesc}>{langItem.label}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.uncheckCircle} />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        {/* Section: Cadangan & Google Drive */}
        <Text style={styles.sectionHeader}>{t('settings_cloud_section')}</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={handleBackup}
            disabled={isBackingUp}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_backup_title')}</Text>
              <Text style={styles.actionDesc}>
                {isBackingUp ? t('settings_backup_running') : t('settings_backup_desc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={handleRestore}
            disabled={isRestoring}>
            <View style={[styles.iconWrap, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.info} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_restore_title')}</Text>
              <Text style={styles.actionDesc}>
                {isRestoring ? t('settings_restore_running') : t('settings_restore_desc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Ekspor Laporan */}
        <Text style={styles.sectionHeader}>{t('settings_report_section')}</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/export-report')}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="document-text-outline" size={20} color="#DC2626" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_export_title')}</Text>
              <Text style={styles.actionDesc}>{t('settings_export_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Target Budgeting & Rencana */}
        <Text style={styles.sectionHeader}>PERENCANAAN & TARGET</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/plans')}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_plans_title')}</Text>
              <Text style={styles.actionDesc}>{t('settings_plans_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/budget')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_budget_title')}</Text>
              <Text style={styles.actionDesc}>{t('settings_budget_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Pengingat Otomatis */}
        <Text style={styles.sectionHeader}>{t('settings_reminder_section')}</Text>
        <View style={styles.cardGroup}>
          <View style={styles.actionRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.incomeSoft }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.income} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_reminder_daily_title')}</Text>
              <Text style={styles.actionDesc}>{t('settings_reminder_daily_desc')}</Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={toggleDailyReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.actionRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.receivableSoft }]}>
              <Ionicons name="alarm-outline" size={20} color={colors.receivable} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_reminder_debt_title')}</Text>
              <Text style={styles.actionDesc}>{t('settings_reminder_debt_desc')}</Text>
            </View>
            <Switch
              value={debtReminderEnabled}
              onValueChange={setDebtReminderEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: Dompet & Akun Keuangan */}
        <Text style={styles.sectionHeader}>{t('settings_wallet_section')}</Text>
        <View style={styles.cardGroup}>
          <View style={styles.actionRow}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isMultiWalletEnabled ? colors.primarySoft : colors.borderLight },
              ]}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={isMultiWalletEnabled ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings_wallet_toggle_title')}</Text>
              <Text style={styles.actionDesc}>
                {isMultiWalletEnabled
                  ? t('settings_wallet_toggle_on')
                  : t('settings_wallet_toggle_off')}
              </Text>
            </View>
            <Switch
              value={isMultiWalletEnabled}
              onValueChange={async (val) => {
                await setMultiWalletEnabled(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isMultiWalletEnabled && (
            <>
              <View style={styles.rowDivider} />

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/modal/wallets')}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="options-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{t('settings_wallet_manage_title')}</Text>
                  <Text style={styles.actionDesc}>
                    {t('settings_wallet_manage_desc', { count: wallets.length })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>

              <View style={styles.rowDivider} />

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/modal/transfer-funds')}>
                <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="swap-horizontal-outline" size={20} color="#6366F1" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{t('settings_wallet_transfer_title')}</Text>
                  <Text style={styles.actionDesc}>{t('settings_wallet_transfer_desc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </View>

        {/* Section: Ringkasan Database Lokal */}
        <Text style={styles.sectionHeader}>{t('settings_storage_section')}</Text>
        <View style={styles.cardGroup}>
          {isMultiWalletEnabled && (
            <>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>{t('settings_stat_wallets')}</Text>
                <Text style={styles.statsVal}>{t('common_data_count', { count: wallets.length })}</Text>
              </View>
              <View style={styles.rowDivider} />
            </>
          )}
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('settings_stat_transactions')}</Text>
            <Text style={styles.statsVal}>{t('common_data_count', { count: transactions.length })}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('settings_stat_debts')}</Text>
            <Text style={styles.statsVal}>{t('common_data_count', { count: debts.length })}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('settings_stat_trades')}</Text>
            <Text style={styles.statsVal}>{t('common_data_count', { count: investments.length })}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('settings_stat_plans')}</Text>
            <Text style={styles.statsVal}>{t('common_data_count', { count: plans.length })}</Text>
          </View>
        </View>

        {/* Info App */}
        <View style={styles.footerInfo}>
          <Text style={styles.appName}>🌸 Cashflower v1.3.0</Text>
          <Text style={styles.appSub}>100% Offline-First • Aman & Privat di HP</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  languageRowSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  flagWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagWrapSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  flagEmoji: {
    fontSize: 20,
  },
  languageTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 66,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
    gap: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  appSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
