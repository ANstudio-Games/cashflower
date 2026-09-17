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
import { parseCurrencyInput } from '@/utils/format-currency';
import { getTodayISO } from '@/utils/format-date';
import { TransactionType } from '@/types';

export default function AddTransactionModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { categories, transactions, createTransaction, editTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayISO());
  const [notes, setNotes] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
        setExistingCreatedAt(existing.created_at || Date.now());
      }
    }
  }, [params.id, transactions]);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  // Set default category if none selected
  useEffect(() => {
    if (availableCategories.length > 0 && (!selectedCategory || !availableCategories.find((c) => c.id === selectedCategory))) {
      setSelectedCategory(availableCategories[0].id);
    }
  }, [type, availableCategories, selectedCategory]);

  const handleAmountChange = (text: string) => {
    const num = parseCurrencyInput(text);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const handleSubmit = async () => {
    const amount = parseInt(rawAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Perhatian', 'Mohon masukkan nominal uang yang valid.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Mohon isi nama barang atau keterangan transaksi.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Perhatian', 'Mohon pilih kategori transaksi.');
      return;
    }

    try {
      if (isEditing && params.id) {
        await editTransaction({
          id: params.id,
          title: title.trim(),
          amount,
          type,
          category_id: selectedCategory,
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
          date,
          notes: notes.trim() || null,
        });
      }
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', isEditing ? 'Gagal memperbarui transaksi.' : 'Gagal menyimpan transaksi.');
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Transaksi' : 'Catat Transaksi'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
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
              Pengeluaran
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
              Pemasukan
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.inputLabel}>Nominal Uang</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawAmount ? parseInt(rawAmount, 10).toLocaleString('id-ID') : ''}
              onChangeText={handleAmountChange}
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Title / Item Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {type === 'expense' ? 'Barang yang Dibeli' : 'Sumber Pemasukan'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={
              type === 'expense'
                ? 'Contoh: Nasi Padang, Beli Baju, Bensin'
                : 'Contoh: Gaji Bulanan, Jual Baju Bekas'
            }
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Selector */}
        <View style={styles.inputSection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionTitle}>Pilih Kategori</Text>
            <Pressable
              onPress={() => router.push('/modal/add-category')}
              hitSlop={8}
              style={styles.addCategoryBtn}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.addCategoryText}>Tambah Baru</Text>
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
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Tanggal Transaksi (YYYY-MM-DD)</Text>
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
              <Text style={styles.todayBtnText}>Hari Ini</Text>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Catatan Tambahan (Opsional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Catatan kecil tentang belanjaan ini..."
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
            {isEditing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
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
});
