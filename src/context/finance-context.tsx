import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import {
  Category,
  Transaction,
  Debt,
  Investment,
  CashflowSummary,
  DebtSummary,
  InvestmentSummary,
} from '@/types';
import {
  getCategories,
  addCategory,
  getTransactions,
  addTransaction,
  deleteTransaction,
  getCashflowSummary,
  getDebts,
  addDebt,
  toggleDebtPaid,
  deleteDebt,
  getDebtSummary,
  getInvestments,
  addInvestment,
  deleteInvestment,
  getInvestmentSummary,
} from '@/db';

interface FinanceContextType {
  isLoading: boolean;
  transactions: Transaction[];
  categories: Category[];
  debts: Debt[];
  investments: Investment[];
  cashflowSummary: CashflowSummary;
  debtSummary: DebtSummary;
  investmentSummary: InvestmentSummary;
  refreshAll: () => Promise<void>;
  createTransaction: (item: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color'>) => Promise<void>;
  deleteTransactionById: (id: string) => Promise<void>;
  createCategory: (cat: { name: string; type: 'income' | 'expense'; icon: string; color: string }) => Promise<void>;
  createDebt: (debt: Omit<Debt, 'id' | 'created_at'>) => Promise<void>;
  toggleDebtStatus: (id: string, isPaid: boolean) => Promise<void>;
  deleteDebtById: (id: string) => Promise<void>;
  createInvestment: (item: Omit<Investment, 'id' | 'created_at' | 'pnl' | 'pnl_percentage'>) => Promise<void>;
  deleteInvestmentById: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

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
      ] = await Promise.all([
        getCategories(db),
        getTransactions(db),
        getCashflowSummary(db),
        getDebts(db),
        getDebtSummary(db),
        getInvestments(db),
        getInvestmentSummary(db),
      ]);

      setCategories(fetchedCategories);
      setTransactions(fetchedTransactions);
      setCashflowSummary(fetchedCashflow);
      setDebts(fetchedDebts);
      setDebtSummary(fetchedDebtSum);
      setInvestments(fetchedInvestments);
      setInvestmentSummary(fetchedInvSum);
    } catch (err) {
      console.error('Error refreshing finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics might not be supported in some environments
    }
  };

  const createTransaction = async (
    item: Omit<Transaction, 'id' | 'created_at' | 'category_name' | 'category_icon' | 'category_color'>
  ) => {
    const newTx: Transaction = {
      ...item,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: Date.now(),
    };
    await addTransaction(db, newTx);
    triggerHaptic();
    await refreshAll();
  };

  const deleteTransactionById = async (id: string) => {
    await deleteTransaction(db, id);
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
    triggerHaptic();
    await refreshAll();
  };

  const toggleDebtStatus = async (id: string, isPaid: boolean) => {
    await toggleDebtPaid(db, id, isPaid);
    triggerHaptic();
    await refreshAll();
  };

  const deleteDebtById = async (id: string) => {
    await deleteDebt(db, id);
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

  return (
    <FinanceContext.Provider
      value={{
        isLoading,
        transactions,
        categories,
        debts,
        investments,
        cashflowSummary,
        debtSummary,
        investmentSummary,
        refreshAll,
        createTransaction,
        deleteTransactionById,
        createCategory,
        createDebt,
        toggleDebtStatus,
        deleteDebtById,
        createInvestment,
        deleteInvestmentById,
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
