import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { TransactionItem } from '@/components/transaction-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, categories, deleteTransactionById } = useFinance();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search title or notes
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchNotes) return false;
      }
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTransactions.length} dari {transactions.length} transaksi tercatat
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/add-transaction')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama barang atau catatan..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.typeTab, typeFilter === 'all' && styles.typeTabActive]}
          onPress={() => setTypeFilter('all')}>
          <Text style={[styles.typeTabText, typeFilter === 'all' && styles.typeTabTextActive]}>
            Semua
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeTab, typeFilter === 'expense' && styles.typeTabActive]}
          onPress={() => setTypeFilter('expense')}>
          <Text style={[styles.typeTabText, typeFilter === 'expense' && styles.typeTabTextActive]}>
            Pengeluaran
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeTab, typeFilter === 'income' && styles.typeTabActive]}
          onPress={() => setTypeFilter('income')}>
          <Text style={[styles.typeTabText, typeFilter === 'income' && styles.typeTabTextActive]}>
            Pemasukan
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}>
        <Pressable
          style={[styles.catChip, categoryFilter === 'all' && styles.catChipActive]}
          onPress={() => setCategoryFilter('all')}>
          <Text style={[styles.catChipText, categoryFilter === 'all' && styles.catChipTextActive]}>
            Semua Kategori
          </Text>
        </Pressable>
        {categories.map((cat) => {
          const isSelected = categoryFilter === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.catChip,
                isSelected && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
              ]}
              onPress={() => setCategoryFilter(cat.id)}>
              <Ionicons
                name={(cat.icon || 'grid-outline') as any}
                size={14}
                color={isSelected ? cat.color : colors.textSecondary}
              />
              <Text
                style={[
                  styles.catChipText,
                  isSelected && { color: cat.color, fontWeight: '700' },
                ]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onDelete={(id) => deleteTransactionById(id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Tidak Ada Transaksi"
            description={
              search || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter atau pencarian Anda.'
                : 'Mulai catat barang belanjaan atau pemasukan uang Anda sekarang.'
            }
            actionText="Catat Transaksi"
            onActionPress={() => router.push('/modal/add-transaction')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeTabActive: {
    backgroundColor: colors.surfaceHover,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeTabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  catChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
