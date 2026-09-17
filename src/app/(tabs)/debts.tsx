import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { DebtItem } from '@/components/debt-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

type FilterType = 'all' | 'unpaid' | 'receivable' | 'payable' | 'paid';

export default function DebtsScreen() {
  const router = useRouter();
  const { debts, debtSummary, toggleDebtStatus, deleteDebtById } = useFinance();

  const [filter, setFilter] = useState<FilterType>('unpaid');

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (filter === 'unpaid') return d.is_paid === 0;
      if (filter === 'paid') return d.is_paid === 1;
      if (filter === 'receivable') return d.type === 'receivable' && d.is_paid === 0;
      if (filter === 'payable') return d.type === 'payable' && d.is_paid === 0;
      return true;
    });
  }, [debts, filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hutang & Piutang</Text>
          <Text style={styles.headerSubtitle}>Kelola pinjaman dan penagihan uang</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/add-debt')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        {/* Piutang Card */}
        <View style={[styles.summaryCard, shadowStyles.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.receivableSoft }]}>
              <Ionicons name="arrow-forward-circle" size={16} color={colors.receivable} />
            </View>
            <Text style={styles.cardTag}>Piutang</Text>
          </View>
          <Text style={styles.cardLabel}>Uang di Orang (Tagih)</Text>
          <Text style={[styles.cardValue, { color: colors.receivableDark }]}>
            {formatCurrency(debtSummary.totalReceivable)}
          </Text>
        </View>

        {/* Hutang Card */}
        <View style={[styles.summaryCard, shadowStyles.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.debtSoft }]}>
              <Ionicons name="arrow-back-circle" size={16} color={colors.debt} />
            </View>
            <Text style={styles.cardTag}>Hutang</Text>
          </View>
          <Text style={styles.cardLabel}>Harus Dibayar</Text>
          <Text style={[styles.cardValue, { color: colors.debtDark }]}>
            {formatCurrency(debtSummary.totalPayable)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === 'unpaid' && styles.filterChipActive]}
          onPress={() => setFilter('unpaid')}>
          <Text style={[styles.filterText, filter === 'unpaid' && styles.filterTextActive]}>
            Belum Lunas ({debtSummary.unpaidCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'receivable' && styles.filterChipActive]}
          onPress={() => setFilter('receivable')}>
          <Text style={[styles.filterText, filter === 'receivable' && styles.filterTextActive]}>
            Piutang Saja
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'payable' && styles.filterChipActive]}
          onPress={() => setFilter('payable')}>
          <Text style={[styles.filterText, filter === 'payable' && styles.filterTextActive]}>
            Hutang Saja
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'paid' && styles.filterChipActive]}
          onPress={() => setFilter('paid')}>
          <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>
            Lunas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Semua
          </Text>
        </Pressable>
      </View>

      {/* Debt List */}
      <FlatList
        data={filteredDebts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DebtItem
            item={item}
            onTogglePaid={(id, isPaid) => toggleDebtStatus(id, isPaid)}
            onDelete={(id) => deleteDebtById(id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Tidak Ada Catatan"
            description={
              filter === 'unpaid'
                ? 'Semua hutang & piutang telah lunas! Tidak ada tagihan aktif saat ini.'
                : 'Belum ada catatan pinjaman yang sesuai filter.'
            }
            actionText="Catat Hutang / Piutang"
            onActionPress={() => router.push('/modal/add-debt')}
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 110,
    marginTop: 6,
  },
});
