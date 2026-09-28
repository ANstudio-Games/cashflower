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
import { colors } from '@/theme/colors';
import { useI18n } from '@/i18n';

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, categories, wallets, deleteTransactionById, isMultiWalletEnabled } = useFinance();
  const {
    t,
    getCategoryName,
    getWalletName,
    getTransactionTitle,
    getTransactionNotes,
  } = useI18n();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search title or notes
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = getTransactionTitle(tx).toLowerCase().includes(q);
        const matchNotes = getTransactionNotes(tx).toLowerCase().includes(q);
        if (!matchTitle && !matchNotes) return false;
      }
      // Type filter
      if (typeFilter !== 'all' && tx?.type !== typeFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && tx?.category_id !== categoryFilter) {
        return false;
      }
      // Wallet filter (only when multi-wallet is enabled)
      if (isMultiWalletEnabled && walletFilter !== 'all') {
        const matchSource = tx?.wallet_id === walletFilter;
        const matchDest = tx?.destination_wallet_id === walletFilter;
        if (!matchSource && !matchDest) return false;
      }
      return true;
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    walletFilter,
    isMultiWalletEnabled,
    getTransactionTitle,
    getTransactionNotes,
  ]);

  const handleEdit = (id: string) => {
    router.push({
      pathname: '/modal/add-transaction',
      params: { id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('tx_header_title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('tx_header_subtitle', { filtered: filteredTransactions.length, total: transactions.length })}
          </Text>
        </View>
        <View style={styles.headerRightActions}>
          <Pressable
            style={({ pressed }) => [styles.transferBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/transfer-funds')}>
            <Ionicons name="swap-horizontal" size={18} color={colors.primaryDark} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/export-report')}>
            <Ionicons name="document-text-outline" size={18} color={colors.primaryDark} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/modal/add-transaction')}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('tx_search_placeholder')}
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

      {/* Type Filter Buttons */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.typeTab, typeFilter === 'all' && styles.typeTabActive]}
          onPress={() => setTypeFilter('all')}>
          <Text
            style={[styles.typeTabText, typeFilter === 'all' && styles.typeTabTextActive]}
            numberOfLines={1}>
            {t('common_all')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeTab, typeFilter === 'expense' && styles.typeTabActiveExpense]}
          onPress={() => setTypeFilter('expense')}>
          <Ionicons
            name="arrow-up"
            size={13}
            color={typeFilter === 'expense' ? colors.expenseDark : colors.textSecondary}
          />
          <Text
            style={[styles.typeTabText, typeFilter === 'expense' && styles.typeTabTextActiveExpense]}
            numberOfLines={1}>
            {t('common_expense')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeTab, typeFilter === 'income' && styles.typeTabActiveIncome]}
          onPress={() => setTypeFilter('income')}>
          <Ionicons
            name="arrow-down"
            size={13}
            color={typeFilter === 'income' ? colors.incomeDark : colors.textSecondary}
          />
          <Text
            style={[styles.typeTabText, typeFilter === 'income' && styles.typeTabTextActiveIncome]}
            numberOfLines={1}>
            {t('common_income')}
          </Text>
        </Pressable>
        {isMultiWalletEnabled && (
          <Pressable
            style={[styles.typeTab, typeFilter === 'transfer' && styles.typeTabActiveTransfer]}
            onPress={() => setTypeFilter('transfer')}>
            <Ionicons
              name="swap-horizontal"
              size={13}
              color={typeFilter === 'transfer' ? '#4338CA' : colors.textSecondary}
            />
            <Text
              style={[styles.typeTabText, typeFilter === 'transfer' && styles.typeTabTextActiveTransfer]}
              numberOfLines={1}>
              {t('common_transfer')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal Wallet Filter Chips */}
      {isMultiWalletEnabled && (
        <View style={styles.walletScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            <Pressable
              style={[styles.catChip, walletFilter === 'all' && styles.catChipActive]}
              onPress={() => setWalletFilter('all')}>
              <Ionicons
                name="wallet-outline"
                size={14}
                color={walletFilter === 'all' ? colors.primaryDark : colors.textSecondary}
              />
              <Text style={[styles.catChipText, walletFilter === 'all' && styles.catChipTextActive]}>
                {t('common_all_wallets')}
              </Text>
            </Pressable>

            {wallets.map((w) => {
              const isSelected = walletFilter === w.id;
              return (
                <Pressable
                  key={w.id}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: `${w.color}20`, borderColor: w.color },
                  ]}
                  onPress={() => setWalletFilter(w.id)}>
                  <Ionicons
                    name={(w.icon || 'wallet-outline') as any}
                    size={14}
                    color={isSelected ? w.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      isSelected && { color: w.color, fontWeight: '700' },
                    ]}>
                    {getWalletName(w)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Horizontal Category Chips Container with Guaranteed Visibility */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          <Pressable
            style={[styles.catChip, categoryFilter === 'all' && styles.catChipActive]}
            onPress={() => setCategoryFilter('all')}>
            <Text style={[styles.catChipText, categoryFilter === 'all' && styles.catChipTextActive]}>
              {t('tx_all_categories')}
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
                  {getCategoryName(cat)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            showWalletBadge={isMultiWalletEnabled}
            onEdit={() => handleEdit(item.id)}
            onDelete={(id) => deleteTransactionById(id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={t('tx_empty_title')}
            description={
              search || typeFilter !== 'all' || categoryFilter !== 'all' || walletFilter !== 'all'
                ? t('tx_empty_desc_filtered')
                : t('tx_empty_desc_empty')
            }
            actionText={t('tx_record_action')}
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginVertical: 6,
    paddingHorizontal: 12,
    height: 42,
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
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  typeTabActive: {
    backgroundColor: colors.surfaceHover,
  },
  typeTabActiveExpense: {
    backgroundColor: colors.expenseSoft,
  },
  typeTabActiveIncome: {
    backgroundColor: colors.incomeSoft,
  },
  typeTabActiveTransfer: {
    backgroundColor: '#EEF2FF',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  typeTabTextActiveExpense: {
    color: colors.expenseDark,
    fontWeight: '700',
  },
  typeTabTextActiveIncome: {
    color: colors.incomeDark,
    fontWeight: '700',
  },
  typeTabTextActiveTransfer: {
    color: '#4338CA',
    fontWeight: '700',
  },
  walletScrollContainer: {
    height: 44,
    marginTop: 2,
    marginBottom: 4,
  },
  categoryScrollContainer: {
    height: 46,
    marginTop: 2,
    marginBottom: 6,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    height: 36,
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
    paddingBottom: 110,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
