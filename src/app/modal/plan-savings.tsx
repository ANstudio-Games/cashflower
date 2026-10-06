import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '@/context/finance-context';
import { useI18n } from '@/i18n';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useSaveAction } from '@/utils/use-save-action';
import { PlanAllocation } from '@/types';

export default function PlanSavings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { plans, wallets, adjustAllocation } = useFinance();
  const { t, language } = useI18n();
  const { isSaving, runSave } = useSaveAction();
  const [rows, setRows] = useState<PlanAllocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const plan = plans.find(p => p.id === id);
  const load = async () => {
    setLoaded(false);
    try { setRows(await db.getAllAsync<PlanAllocation>('SELECT * FROM plan_allocations')); setFailed(false); }
    catch { setFailed(true); }
    finally { setLoaded(true); }
  };
  useEffect(() => { void load(); }, [db, plans]);
  const submit = (withdraw: boolean) => { void runSave(async () => {
    try {
      await adjustAllocation(id, walletId, Number(amount), withdraw);
      setAmount(''); await load();
    } catch { Alert.alert(t('common_error'), t('allocation_error')); }
  }); };
  const total = rows.filter(r => r.plan_id === id).reduce((s,r) => s+r.amount,0);
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 16 }} style={{ backgroundColor: colors.background }}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.primaryDark }}>{t('common_cancel')}</Text></Pressable>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>{plan?.title}</Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>{formatCurrency(total, language)}</Text>
      <Text style={{ color: colors.textSecondary }}>{t('allocation_explanation')}</Text>
      {!loaded ? <ActivityIndicator /> : failed ? <Pressable onPress={load}><Text>{t('safety_load_error')} — {t('safety_retry')}</Text></Pressable> : wallets.map(wallet => {
        const reserved = rows.filter(r => r.wallet_id === wallet.id).reduce((s,r)=>s+r.amount,0);
        const saved = rows.find(r => r.wallet_id === wallet.id && r.plan_id === id)?.amount || 0;
        return <Pressable key={wallet.id} disabled={isSaving} accessibilityRole="button" accessibilityState={{ selected: walletId === wallet.id }} onPress={() => setWalletId(wallet.id)} style={{ padding: 16, minHeight: 48, borderWidth: 1, borderRadius: 12, borderColor: walletId === wallet.id ? colors.primaryDark : colors.border, backgroundColor: colors.surface }}>
          <Text style={{ fontWeight: '600', color: colors.text }}>{wallet.name}</Text>
          <Text style={{ color: colors.textSecondary }}>{t('allocation_free', { amount: formatCurrency((wallet.balance || 0)-reserved, language) })}</Text>
          <Text style={{ color: colors.textSecondary }}>{t('allocation_saved', { amount: formatCurrency(saved, language) })}</Text>
        </Pressable>;
      })}
      {plan?.is_completed === 0 && <>
        <Text style={{ color: colors.text }}>{t('allocation_amount')}</Text>
        <TextInput accessibilityLabel={t('allocation_amount')} value={amount} onChangeText={setAmount} editable={!isSaving} keyboardType="number-pad" style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }} />
        {[false, true].map(withdraw => <Pressable key={String(withdraw)} disabled={isSaving || !loaded || failed || !walletId} accessibilityRole="button" onPress={() => submit(withdraw)} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: colors.primaryDark, opacity: isSaving || !walletId ? 0.6 : 1 }}>
          <Text style={{ color: colors.surface, fontWeight: '600' }}>{isSaving ? t('safety_saving') : t(withdraw ? 'allocation_withdraw' : 'allocation_deposit')}</Text>
        </Pressable>)}
      </>}
    </ScrollView>
  );
}
