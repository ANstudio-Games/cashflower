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
import { colors } from '@/theme/colors';
import { scheduleDailyReminder, cancelDailyReminder } from '@/utils/notifications';

export default function SettingsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const { backupData, restoreData, transactions, debts, investments } = useFinance();

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [debtReminderEnabled, setDebtReminderEnabled] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      await backupData();
    } catch (err: any) {
      Alert.alert('Gagal Cadangkan', err.message || 'Terjadi kesalahan saat mencadangkan data.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Konfirmasi Pemulihan Data',
      'Memulihkan data akan menggantikan data saat ini dengan data dari file cadangan. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Pilih File & Pulihkan',
          onPress: async () => {
            try {
              setIsRestoring(true);
              const restoredCount = await restoreData();
              if (restoredCount > 0) {
                Alert.alert('Berhasil Dipulihkan', `Berhasil memulihkan ${restoredCount} transaksi.`);
              }
            } catch (err: any) {
              Alert.alert('Gagal Memulihkan', err.message || 'Format file cadangan tidak sesuai.');
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
      await scheduleDailyReminder(20, 0);
      Alert.alert('Pengingat Aktif', 'Notifikasi harian akan muncul setiap jam 20:00.');
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
        <Text style={styles.headerTitle}>Pengaturan & Cadangan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Cadangan & Google Drive */}
        <Text style={styles.sectionHeader}>CADANGAN & CLOUD</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={handleBackup}
            disabled={isBackingUp}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Cadangkan ke Google Drive / File</Text>
              <Text style={styles.actionDesc}>
                {isBackingUp ? 'Sedang mengekspor data...' : 'Simpan cadangan data keuangan Anda ke Google Drive'}
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
              <Text style={styles.actionTitle}>Pulihkan Data dari Cadangan</Text>
              <Text style={styles.actionDesc}>
                {isRestoring ? 'Memproses pemulihan...' : 'Pilih file cadangan (.json) dari Google Drive / HP'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Ekspor Laporan */}
        <Text style={styles.sectionHeader}>LAPORAN & DOKUMEN</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/export-report')}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="document-text-outline" size={20} color="#DC2626" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Ekspor Laporan Keuangan</Text>
              <Text style={styles.actionDesc}>Cetak PDF resmi atau simpan spreadsheet Excel/CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Target Budgeting */}
        <Text style={styles.sectionHeader}>PERENCANAAN ANGGARAN</Text>
        <View style={styles.cardGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/budget')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Atur Target Budgeting</Text>
              <Text style={styles.actionDesc}>Batas pengeluaran bulanan global & per kategori</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Section: Pengingat Otomatis */}
        <Text style={styles.sectionHeader}>PENGINGAT OTOMATIS</Text>
        <View style={styles.cardGroup}>
          <View style={styles.actionRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.incomeSoft }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.income} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Pengingat Catat Belanjaan</Text>
              <Text style={styles.actionDesc}>Notifikasi ramah setiap jam 20:00 malam</Text>
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
              <Text style={styles.actionTitle}>Pengingat Jatuh Tempo Hutang</Text>
              <Text style={styles.actionDesc}>Peringatan otomatis saat tagihan pinjaman tiba</Text>
            </View>
            <Switch
              value={debtReminderEnabled}
              onValueChange={setDebtReminderEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: Ringkasan Database Lokal */}
        <Text style={styles.sectionHeader}>STATUS PENYIMPANAN LOKAL</Text>
        <View style={styles.cardGroup}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Transaksi</Text>
            <Text style={styles.statsVal}>{transactions.length} data</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Catatan Pinjaman</Text>
            <Text style={styles.statsVal}>{debts.length} data</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Catatan Trading</Text>
            <Text style={styles.statsVal}>{investments.length} data</Text>
          </View>
        </View>

        {/* Info App */}
        <View style={styles.footerInfo}>
          <Text style={styles.appName}>🌸 Cashflower v1.1.1</Text>
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
