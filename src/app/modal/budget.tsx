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

export default function BudgetModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const { categories, budgets, saveNewBudget, removeBudget } = useFinance();

  const [selectedCategory, setSelectedCategory] = useState<string>('global'); // 'global' or categoryId
  const [rawLimit, setRawLimit] = useState('');

  const globalBudget = budgets.find((b) => b.category_id === null);

  const handleSave = async () => {
    const limit = parseInt(rawLimit, 10);
    if (!limit || limit <= 0) {
      Alert.alert('Perhatian', 'Mohon masukkan nominal batas anggaran yang valid.');
      return;
    }

    try {
      const isGlobal = selectedCategory === 'global';
      const id = isGlobal ? 'budget_global' : `budget_${selectedCategory}`;
      await saveNewBudget({
        id,
        category_id: isGlobal ? null : selectedCategory,
        monthly_limit: limit,
      });
      setRawLimit('');
      Alert.alert('Berhasil', 'Target anggaran berhasil disimpan.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menyimpan target anggaran.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Hapus Anggaran', `Hapus target anggaran untuk ${name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeBudget(id) },
    ]);
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
        <Text style={styles.headerTitle}>Target Budgeting</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form to Set / Update Budget */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Tetapkan Batas Belanja Bulanan</Text>
          <Text style={styles.cardSub}>
            Pasang batas maksimal agar Anda mendapat peringatan saat pengeluaran mendekati limit.
          </Text>

          {/* Scope Selector */}
          <Text style={styles.inputLabel}>Pilih Target Anggaran</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRow}>
            <Pressable
              style={[styles.scopeChip, selectedCategory === 'global' && styles.scopeChipActive]}
              onPress={() => setSelectedCategory('global')}>
              <Ionicons
                name="wallet-outline"
                size={16}
                color={selectedCategory === 'global' ? colors.primaryDark : colors.textSecondary}
              />
              <Text
                style={[
                  styles.scopeChipText,
                  selectedCategory === 'global' && styles.scopeChipTextActive,
                ]}>
                Total Keseluruhan
              </Text>
            </Pressable>

            {categories
              .filter((c) => c.type === 'expense')
              .map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.scopeChip,
                      isSelected && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}>
                    <Ionicons
                      name={(cat.icon || 'grid-outline') as any}
                      size={14}
                      color={isSelected ? cat.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.scopeChipText,
                        isSelected && { color: cat.color, fontWeight: '700' },
                      ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>

          {/* Limit Input */}
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={rawLimit ? parseInt(rawLimit, 10).toLocaleString('id-ID') : ''}
              onChangeText={(t) => {
                const num = parseCurrencyInput(t);
                setRawLimit(num > 0 ? num.toString() : '');
              }}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Simpan Batas Anggaran</Text>
          </Pressable>
        </View>

        {/* List of Active Budgets */}
        <Text style={styles.sectionHeader}>Status Anggaran Bulan Ini</Text>
        {budgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada batas anggaran yang ditetapkan.</Text>
          </View>
        ) : (
          budgets.map((b) => {
            const spent = b.current_spent || 0;
            const limit = b.monthly_limit || 1;
            const percentage = (spent / limit) * 100;
            const isOver = spent > limit;
            const isWarning = percentage >= 70 && !isOver;

            let progressColor = colors.income;
            if (isWarning) progressColor = colors.warning;
            if (isOver) progressColor = colors.expense;

            const title = b.category_id === null ? 'Total Pengeluaran Bulanan' : b.category_name || 'Kategori';

            return (
              <View key={b.id} style={styles.budgetItemCard}>
                <View style={styles.budgetTop}>
                  <View style={styles.budgetTitleCol}>
                    <Text style={styles.budgetTitle}>{title}</Text>
                    <Text style={styles.budgetSub}>
                      Terpakai: {formatCurrency(spent)} dari {formatCurrency(limit)}
                    </Text>
                  </View>
                  <View style={styles.budgetRight}>
                    <Text style={[styles.budgetPercent, { color: progressColor }]}>
                      {percentage.toFixed(0)}%
                    </Text>
                    <Pressable
                      onPress={() => handleDelete(b.id, title)}
                      hitSlop={8}
                      style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(3, percentage))}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                {isOver && (
                  <Text style={styles.overWarningText}>
                    ⚠️ Melebihi anggaran sebesar {formatCurrency(spent - limit)}!
                  </Text>
                )}
              </View>
            );
          })
        )}
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
    paddingBottom: 50,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scopeRow: {
    gap: 8,
    paddingBottom: 10,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  scopeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  scopeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scopeChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginVertical: 12,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  budgetItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  budgetTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  budgetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  budgetSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  budgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetPercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overWarningText: {
    fontSize: 11,
    color: colors.expenseDark,
    fontWeight: '600',
    marginTop: 6,
  },
});
