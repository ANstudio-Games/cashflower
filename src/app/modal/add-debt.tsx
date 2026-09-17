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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { DebtType } from '@/types';

export default function AddDebtModal() {
  const router = useRouter();
  const { createDebt } = useFinance();

  const [type, setType] = useState<DebtType>('receivable'); // default: Piutang (orang pinjam ke saya)
  const [personName, setPersonName] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [issueDate, setIssueDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleAmountChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const handleSave = async () => {
    const amount = parseInt(rawAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Perhatian', 'Mohon masukkan nominal uang yang valid.');
      return;
    }
    if (!personName.trim()) {
      Alert.alert('Perhatian', 'Mohon isi nama orang / pihak terkait.');
      return;
    }

    try {
      await createDebt({
        person_name: personName.trim(),
        type,
        amount,
        issue_date: issueDate,
        due_date: dueDate.trim() || null,
        is_paid: 0,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menyimpan catatan hutang/piutang.');
    }
  };

  const isReceivable = type === 'receivable';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Catat Hutang / Piutang</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Type Switcher */}
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[styles.typeBtn, isReceivable && styles.typeBtnActiveReceivable]}
            onPress={() => setType('receivable')}>
            <Ionicons
              name="arrow-forward-circle-outline"
              size={18}
              color={isReceivable ? colors.receivableDark : colors.textSecondary}
            />
            <Text style={[styles.typeText, isReceivable && styles.typeTextActiveReceivable]}>
              Piutang (Saya Menagih)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.typeBtn, !isReceivable && styles.typeBtnActivePayable]}
            onPress={() => setType('payable')}>
            <Ionicons
              name="arrow-back-circle-outline"
              size={18}
              color={!isReceivable ? colors.debtDark : colors.textSecondary}
            />
            <Text style={[styles.typeText, !isReceivable && styles.typeTextActivePayable]}>
              Hutang (Saya Membayar)
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.inputLabel}>Jumlah Uang Pinjaman</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawAmount ? parseInt(rawAmount, 10).toLocaleString('id-ID') : ''}
              onChangeText={handleAmountChange}
              autoFocus
            />
          </View>
        </View>

        {/* Person Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {isReceivable ? 'Nama Peminjam (Siapa yang berhutang?)' : 'Nama Pemberi Pinjaman'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={isReceivable ? 'Contoh: Budi Santoso, Teman Kantor' : 'Contoh: Bank BCA, Mas Rian'}
            placeholderTextColor={colors.textMuted}
            value={personName}
            onChangeText={setPersonName}
          />
        </View>

        {/* Dates */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Tanggal Pinjam (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={issueDate}
            onChangeText={setIssueDate}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            Tanggal Jatuh Tempo / Tagih (Opsional - YYYY-MM-DD)
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Misal: 2026-10-01"
            placeholderTextColor={colors.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Catatan / Keperluan Pinjaman</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Misal: Pinjam untuk perbaikan motor, janji gajian depan..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Simpan Catatan</Text>
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
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  typeBtnActiveReceivable: {
    backgroundColor: colors.receivableSoft,
  },
  typeBtnActivePayable: {
    backgroundColor: colors.debtSoft,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTextActiveReceivable: {
    color: colors.receivableDark,
    fontWeight: '700',
  },
  typeTextActivePayable: {
    color: colors.debtDark,
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
    marginBottom: 16,
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
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
