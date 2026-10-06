import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Category,
  Transaction,
  Debt,
  DebtPayment,
  Investment,
  Budget,
  FinancialPlan,
  CashflowSummary,
  DebtSummary,
  InvestmentSummary,
  Wallet,
} from '@/types';
import {
  getCategories,
  addCategory,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getCashflowSummary,
  getDebts,
  addDebt,
  toggleDebtPaid,
  deleteDebt,
  getDebtSummary,
  getDebtPayments,
  addDebtPayment,
  deleteDebtPayment,
  getInvestments,
  addInvestment,
  deleteInvestment,
  getInvestmentSummary,
  getBudgets,
  saveBudget,
  deleteBudget,
  getPlans,
  addPlan,
  updatePlan,
  togglePlanPinned,
  purchaseAllocatedPlan,
  adjustPlanAllocation,
  deletePlan,
  getWallets,
  addWallet,
  updateWallet,
  deleteWallet,
  transferWalletFunds,
  getSetting,
  setSetting,
} from '@/db';
import { backupToGoogleDriveOrShare, restoreFromBackupFile } from '@/utils/backup';
import { reconcileReminders, cancelDebtReminder } from '@/utils/notifications';
import { REMINDER_KEYS, ReminderStatus } from '@/utils/reminder-policy';
import { useI18n } from '@/i18n';

interface FinanceContextType {
  isLoading: boolean;
  loadError: boolean;
  dailyReminderEnabled: boolean;
  debtReminderEnabled: boolean;
  reminderStatus: { daily: ReminderStatus; debt: ReminderStatus };
  setReminderEnabled: (kind: 'daily' | 'debt', enabled: boolean) => Promise<void>;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  debts: Debt[];
  investments: Investment[];
  budgets: Budget[];
  plans: FinancialPlan[];
  cashflowSummary: CashflowSummary;
  debtSummary: DebtSummary;
  investmentSummary: InvestmentSummary;
  refreshAll: () => Promise<void>;
  createTransaction: (item: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>) => Promise<void>;
  editTransaction: (item: Omit<Transaction, 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>) => Promise<void>;
  deleteTransactionById: (id: string) => Promise<void>;
  createCategory: (cat: { name: string; type: 'income' | 'expense'; icon: string; color: string }) => Promise<void>;
  createWallet: (wallet: Omit<Wallet, 'id' | 'created_at' | 'balance'>) => Promise<void>;
  editWallet: (wallet: Omit<Wallet, 'balance'>) => Promise<void>;
  deleteWalletById: (id: string) => Promise<void>;
  transferBetweenWallets: (params: { sourceWalletId: string; destinationWalletId: string; amount: number; date: string; notes?: string | null }) => Promise<void>;
  createDebt: (debt: Omit<Debt, 'id' | 'created_at'>) => Promise<void>;
  toggleDebtStatus: (id: string, isPaid: boolean) => Promise<void>;
  deleteDebtById: (id: string) => Promise<void>;
  getDebtPayments: (debtId: string) => Promise<DebtPayment[]>;
  createDebtPayment: (params: {
    debtId: string;
    amount: number;
    paymentDate: string;
    walletId: string;
    notes?: string | null;
  }) => Promise<void>;
  deleteDebtPaymentById: (paymentId: string) => Promise<void>;
  createInvestment: (item: Omit<Investment, 'id' | 'created_at' | 'pnl' | 'pnl_percentage'>) => Promise<void>;
  deleteInvestmentById: (id: string) => Promise<void>;
  saveNewBudget: (budget: { id: string; category_id: string | null; monthly_limit: number }) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  createPlan: (item: Omit<FinancialPlan, 'id' | 'created_at' | 'is_completed' | 'completed_at' | 'category_name' | 'category_icon' | 'category_color'>) => Promise<void>;
  editPlan: (item: Omit<FinancialPlan, 'created_at' | 'category_name' | 'category_icon' | 'category_color'>) => Promise<void>;
  togglePinPlan: (id: string, isPinned: boolean) => Promise<void>;
  fulfillPlan: (id: string, recordExpense: boolean) => Promise<void>;
  adjustAllocation: (planId: string, walletId: string, amount: number, withdraw: boolean) => Promise<void>;
  deletePlanById: (id: string) => Promise<void>;
  isMultiWalletEnabled: boolean;
  setMultiWalletEnabled: (enabled: boolean) => Promise<void>;
  backupData: (dialogTitle: string) => Promise<boolean>;
  restoreData: () => Promise<number>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { language } = useI18n();
  const reminderQueue = useRef<Promise<void>>(Promise.resolve());
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [debtReminderEnabled, setDebtReminderEnabled] = useState(false);
  const [remindersReady, setRemindersReady] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<{ daily: ReminderStatus; debt: ReminderStatus }>({ daily: 'off', debt: 'off' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [isMultiWalletEnabled, setIsMultiWalletEnabled] = useState<boolean>(true);

  const [cashflowSummary, setCashflowSummary] = useState<CashflowSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });

  const [debtSummary, setDebtSummary] = useState<DebtSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    unpaidCount: 0,
  });

  const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary>({
    totalCapital: 0,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    totalTrades: 0,
    netReturnPercentage: 0,
  });

  const refreshAll = useCallback(async () => {
    try {
      const [
        fetchedCategories,
        fetchedTransactions,
        fetchedCashflow,
        fetchedDebts,
        fetchedDebtSum,
        fetchedInvestments,
        fetchedInvSum,
        fetchedBudgets,
        fetchedPlans,
        fetchedWallets,
        walletSettingVal,
        dailySetting,
        debtSetting,
      ] = await Promise.all([
        getCategories(db),
        getTransactions(db),
        getCashflowSummary(db),
        getDebts(db),
        getDebtSummary(db),
        getInvestments(db),
        getInvestmentSummary(db),
        getBudgets(db),
        getPlans(db),
        getWallets(db),
        getSetting(db, 'is_multi_wallet_enabled', 'true'),
        getSetting(db, REMINDER_KEYS.daily, 'true'),
        getSetting(db, REMINDER_KEYS.debt, 'true'),
      ]);

      setDailyReminderEnabled(dailySetting === 'true');
      setDebtReminderEnabled(debtSetting === 'true');
      setRemindersReady(true);
      setLoadError(false);
      setCategories(fetchedCategories);
      setTransactions(fetchedTransactions);
      setCashflowSummary(fetchedCashflow);
      setDebts(fetchedDebts);
      setDebtSummary(fetchedDebtSum);
      setInvestments(fetchedInvestments);
      setInvestmentSummary(fetchedInvSum);
      setBudgets(fetchedBudgets);
      setPlans(fetchedPlans);
      setWallets(fetchedWallets);
      setIsMultiWalletEnabled(walletSettingVal === 'true');
    } catch (err) {
      setLoadError(true);
      console.error('Error refreshing finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const syncReminders = useCallback((daily: boolean, debt: boolean, requestPermission = false) => {
    const task = reminderQueue.current.then(async () => {
      setReminderStatus({ daily: 'checking', debt: 'checking' });
      setReminderStatus(await reconcileReminders(daily, debt, debts, language, requestPermission));
    });
    reminderQueue.current = task.catch(error => console.warn('Reminder sync failed:', error));
    return task;
  }, [debts, language]);

  useEffect(() => {
    if (remindersReady) void syncReminders(dailyReminderEnabled, debtReminderEnabled);
  }, [remindersReady, dailyReminderEnabled, debtReminderEnabled, syncReminders]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active' && remindersReady) void syncReminders(dailyReminderEnabled, debtReminderEnabled);
    });
    return () => listener.remove();
  }, [remindersReady, dailyReminderEnabled, debtReminderEnabled, syncReminders]);

  const setReminderEnabled = async (kind: 'daily' | 'debt', enabled: boolean) => {
    await setSetting(db, REMINDER_KEYS[kind], String(enabled));
    if (kind === 'daily') setDailyReminderEnabled(enabled);
    else setDebtReminderEnabled(enabled);
    await syncReminders(kind === 'daily' ? enabled : dailyReminderEnabled, kind === 'debt' ? enabled : debtReminderEnabled, enabled);
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics safe fallback
    }
  };

  const createTransaction = async (
    item: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>
  ) => {
    const newTx: Transaction = {
      ...item,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      wallet_id: item.wallet_id || (wallets.length > 0 ? wallets[0].id : 'wallet_cash'),
      created_at: Date.now(),
    };
    await addTransaction(db, newTx);
    triggerHaptic();
    await refreshAll();
  };

  const editTransaction = async (
    item: Omit<Transaction, 'category_name' | 'category_icon' | 'category_color' | 'wallet_name' | 'wallet_icon' | 'wallet_color' | 'destination_wallet_name'>
  ) => {
    // Regular transaction editing must never remove a transfer destination.
    if (item.type === 'transfer' || transactions.find(tx => tx.id === item.id)?.type === 'transfer') {
      throw new Error('Transfers require a dedicated editor');
    }
    await updateTransaction(db, item);
    triggerHaptic();
    await refreshAll();
  };

  const deleteTransactionById = async (id: string) => {
    await deleteTransaction(db, id);
    triggerHaptic();
    await refreshAll();
  };

  const createWallet = async (wallet: Omit<Wallet, 'id' | 'created_at' | 'balance'>) => {
    const newWallet: Omit<Wallet, 'balance'> = {
      ...wallet,
      id: 'wallet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: Date.now(),
    };
    await addWallet(db, newWallet);
    triggerHaptic();
    await refreshAll();
  };

  const editWallet = async (wallet: Omit<Wallet, 'balance'>) => {
    await updateWallet(db, wallet);
    triggerHaptic();
    await refreshAll();
  };

  const deleteWalletById = async (id: string) => {
    await deleteWallet(db, id);
    triggerHaptic();
    await refreshAll();
  };

  const transferBetweenWallets = async (params: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    date: string;
    notes?: string | null;
  }) => {
    await transferWalletFunds(db, params);
    triggerHaptic();
    await refreshAll();
  };

  const createCategory = async (cat: { name: string; type: 'income' | 'expense'; icon: string; color: string }) => {
    const newCat: Category = {
      id: 'cat_' + Date.now(),
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      is_default: 0,
    };
    await addCategory(db, newCat);
    triggerHaptic();
    await refreshAll();
  };

  const createDebt = async (debt: Omit<Debt, 'id' | 'created_at'>) => {
    const newDebt: Debt = {
      ...debt,
      id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: Date.now(),
    };
    await addDebt(db, newDebt);
    // Reminder reconciliation follows the refreshed debts and saved preferences.
    triggerHaptic();
    await refreshAll();
  };

  const toggleDebtStatus = async (id: string, isPaid: boolean) => {
    await toggleDebtPaid(db, id, isPaid);
    if (isPaid) await cancelDebtReminder(id);
    triggerHaptic();
    await refreshAll();
  };

  const deleteDebtById = async (id: string) => {
    await deleteDebt(db, id);
    await cancelDebtReminder(id);
    triggerHaptic();
    await refreshAll();
  };

  const getDebtPaymentsList = async (debtId: string): Promise<DebtPayment[]> => {
    return await getDebtPayments(db, debtId);
  };

  const createDebtPayment = async (params: {
    debtId: string;
    amount: number;
    paymentDate: string;
    walletId: string;
    notes?: string | null;
  }) => {
    await addDebtPayment(db, {
      debt_id: params.debtId,
      amount: params.amount,
      payment_date: params.paymentDate,
      wallet_id: params.walletId,
      notes: params.notes,
    });
    triggerHaptic();
    await refreshAll();
  };

  const deleteDebtPaymentById = async (paymentId: string) => {
    await deleteDebtPayment(db, paymentId);
    triggerHaptic();
    await refreshAll();
  };

  const createInvestment = async (item: Omit<Investment, 'id' | 'created_at' | 'pnl' | 'pnl_percentage'>) => {
    const pnl = item.sell_price - item.buy_price;
    const pnl_percentage = item.buy_price > 0 ? (pnl / item.buy_price) * 100 : 0;
    const newInv: Investment = {
      ...item,
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      pnl,
      pnl_percentage,
      created_at: Date.now(),
    };
    await addInvestment(db, newInv);
    triggerHaptic();
    await refreshAll();
  };

  const deleteInvestmentById = async (id: string) => {
    await deleteInvestment(db, id);
    triggerHaptic();
    await refreshAll();
  };

  const saveNewBudget = async (budget: { id: string; category_id: string | null; monthly_limit: number }) => {
    await saveBudget(db, budget);
    triggerHaptic();
    await refreshAll();
  };

  const removeBudget = async (id: string) => {
    await deleteBudget(db, id);
    triggerHaptic();
    await refreshAll();
  };

  const createPlan = async (
    item: Omit<FinancialPlan, 'id' | 'created_at' | 'is_completed' | 'completed_at' | 'category_name' | 'category_icon' | 'category_color'>
  ) => {
    try {
      const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await addPlan(db, {
        ...item,
        id,
        is_completed: 0,
        completed_at: null,
        created_at: Date.now(),
      });
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  const editPlan = async (
    item: Omit<FinancialPlan, 'created_at' | 'category_name' | 'category_icon' | 'category_color'>
  ) => {
    try {
      await updatePlan(db, item as FinancialPlan);
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error updating plan:', err);
      throw err;
    }
  };

  const togglePinPlan = async (id: string, isPinned: boolean) => {
    try {
      await togglePlanPinned(db, id, isPinned);
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error toggling plan pin:', err);
      throw err;
    }
  };

  const adjustAllocation = async (planId: string, walletId: string, amount: number, withdraw: boolean) => {
    await adjustPlanAllocation(db, planId, walletId, amount, withdraw);
    await refreshAll();
  };

  const fulfillPlan = async (id: string, recordExpense: boolean) => {
    try {
      if (!recordExpense) throw new Error('allocation_purchase_required');
      await purchaseAllocatedPlan(db, id);
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error fulfilling plan:', err);
      throw err;
    }
  };

  const deletePlanById = async (id: string) => {
    try {
      await deletePlan(db, id);
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error deleting plan:', err);
      throw err;
    }
  };

  const backupData = async (dialogTitle: string) => {
    return await backupToGoogleDriveOrShare(db, dialogTitle);
  };

  const restoreData = async () => {
    const count = await restoreFromBackupFile(db);
    if (count > 0) {
      await refreshAll();
    }
    return count;
  };

  const setMultiWalletEnabled = async (enabled: boolean) => {
    try {
      setIsMultiWalletEnabled(enabled);
      await setSetting(db, 'is_multi_wallet_enabled', enabled ? 'true' : 'false');
      triggerHaptic();
      await refreshAll();
    } catch (err) {
      console.error('Error setting multi wallet preference:', err);
      throw err;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        isLoading,
        loadError,
        dailyReminderEnabled,
        debtReminderEnabled,
        reminderStatus,
        setReminderEnabled,
        transactions,
        categories,
        wallets,
        debts,
        investments,
        budgets,
        plans,
        cashflowSummary,
        debtSummary,
        investmentSummary,
        refreshAll,
        createTransaction,
        editTransaction,
        deleteTransactionById,
        createCategory,
        createWallet,
        editWallet,
        deleteWalletById,
        transferBetweenWallets,
        createDebt,
        toggleDebtStatus,
        deleteDebtById,
        getDebtPayments: getDebtPaymentsList,
        createDebtPayment,
        deleteDebtPaymentById,
        createInvestment,
        deleteInvestmentById,
        saveNewBudget,
        removeBudget,
        createPlan,
        editPlan,
        togglePinPlan,
        fulfillPlan,
        adjustAllocation,
        deletePlanById,
        isMultiWalletEnabled,
        setMultiWalletEnabled,
        backupData,
        restoreData,
      }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
}
