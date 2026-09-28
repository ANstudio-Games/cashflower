import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { useI18n } from '@/i18n';
import { PlanItem } from '@/components/plan-item';
import { EmptyState } from '@/components/empty-state';
import { colors, shadowStyles } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { FinancialPlan } from '@/types';

export default function PlansModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;

  const {
    plans,
    cashflowSummary,
    togglePinPlan,
    fulfillPlan,
    deletePlanById,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [search, setSearch] = useState('');

  const currentBalance = Math.max(0, cashflowSummary.balance);

  const activePlans = useMemo(() => plans.filter((p) => p.is_completed === 0), [plans]);
  const completedPlans = useMemo(() => plans.filter((p) => p.is_completed === 1), [plans]);

  const filteredPlans = useMemo(() => {
    const list = activeTab === 'active' ? activePlans : completedPlans;
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
      return matchTitle || matchNotes;
    });
  }, [activeTab, activePlans, completedPlans, search]);

  const handleEdit = (plan: FinancialPlan) => {
    router.push({
      pathname: '/modal/add-plan',
      params: { id: plan.id },
    });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(t('plans_delete_title'), t('plans_delete_msg', { title }), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('common_delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlanById(id);
          } catch (err) {
            Alert.alert(t('common_error'), t('plans_delete_err'));
          }
        },
      },
    ]);
  };

  const handleFulfill = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;

    Alert.alert(
      t('plans_fulfill_title'),
      t('plans_fulfill_msg', { title: plan.title, amount: formatCurrency(plan.target_amount, language) }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('plans_fulfill_btn_mark_only'),
          onPress: async () => {
            try {
              await fulfillPlan(id, false);
              Alert.alert(t('common_success'), t('plans_fulfill_mark_success', { title: plan.title }));
            } catch (err) {
              Alert.alert(t('common_error'), t('plans_fulfill_err'));
            }
          },
        },
        {
          text: t('plans_fulfill_btn_buy_record'),
          onPress: async () => {
            try {
              await fulfillPlan(id, true);
              Alert.alert(
                t('plans_fulfill_congrats_title'),
                t('plans_fulfill_buy_success', {
                  title: plan.title,
                  amount: formatCurrency(plan.target_amount, language),
                })
              );
            } catch (err) {
              Alert.alert(t('common_error'), t('plans_fulfill_err'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('plans_modal_title')}</Text>
        <Pressable
          style={({ pressed }) => [styles.addHeaderBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/modal/add-plan')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Saldo Banner */}
      <View style={styles.balanceBanner}>
        <View style={styles.balanceIconWrap}>
          <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.balanceSub}>{t('plans_banner_cash_sub')}</Text>
          <Text style={styles.balanceVal}>{formatCurrency(cashflowSummary.balance, language)}</Text>
        </View>
        <View style={styles.targetCountBadge}>
          <Text style={styles.targetCountText}>{t('plans_active_count_badge', { count: activePlans.length })}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('plans_search_placeholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>
            {t('plans_tab_active', { count: activePlans.length })}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
          onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
            {t('plans_tab_completed', { count: completedPlans.length })}
          </Text>
        </Pressable>
      </View>

      {/* Plans List */}
      <FlatList
        data={filteredPlans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PlanItem
            plan={item}
            currentBalance={currentBalance}
            onTogglePin={togglePinPlan}
            onFulfill={handleFulfill}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPress={() => handleEdit(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={activeTab === 'active' ? 'flag-outline' : 'trophy-outline'}
            title={activeTab === 'active' ? t('plans_empty_active_title') : t('plans_empty_completed_title')}
            description={
              activeTab === 'active'
                ? t('plans_empty_active_desc')
                : t('plans_empty_completed_desc')
            }
            actionText={activeTab === 'active' ? t('plans_empty_active_btn') : undefined}
            onActionPress={activeTab === 'active' ? () => router.push('/modal/add-plan') : undefined}
          />
        }
      />
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
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  balanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  balanceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  targetCountBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  targetCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
