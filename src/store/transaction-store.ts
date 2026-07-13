import { create } from 'zustand';

import * as db from '@/db/database';
import type { Transaction, TransactionFormData, MonthlySummary, CategorySummary } from '@/types';
import { getCategorySummary, getMonthlySummary } from '@/db/database';

interface TransactionState {
  // Data
  transactions: Transaction[];
  monthlySummary: MonthlySummary | null;
  categorySummaries: CategorySummary[];
  // Filters
  selectedMonth: number; // 1-12
  selectedYear: number;
  filterType: 'all' | 'income' | 'expense';
  // Loading
  isLoading: boolean;

  // Actions
  loadTransactions: () => Promise<void>;
  loadMonthlySummary: () => Promise<void>;
  loadCategorySummaries: () => Promise<void>;
  addTransaction: (data: TransactionFormData) => Promise<void>;
  editTransaction: (id: number, data: Partial<TransactionFormData>) => Promise<void>;
  removeTransaction: (id: number) => Promise<void>;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setFilterType: (type: 'all' | 'income' | 'expense') => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  monthlySummary: null,
  categorySummaries: [],
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  filterType: 'all',
  isLoading: false,

  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const { selectedYear, selectedMonth } = get();
      const transactions = await db.getTransactionsByMonth(selectedYear, selectedMonth);
      set({ transactions });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMonthlySummary: async () => {
    const { selectedYear, selectedMonth } = get();
    const summary = await getMonthlySummary(selectedYear, selectedMonth);
    set({
      monthlySummary: {
        month: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        balance: summary.totalIncome - summary.totalExpense,
      },
    });
  },

  loadCategorySummaries: async () => {
    const { selectedYear, selectedMonth } = get();
    const [incomeCategories, expenseCategories] = await Promise.all([
      getCategorySummary(selectedYear, selectedMonth, 'income'),
      getCategorySummary(selectedYear, selectedMonth, 'expense'),
    ]);
    set({ categorySummaries: [...incomeCategories, ...expenseCategories] });
  },

  addTransaction: async (data: TransactionFormData) => {
    await db.createTransaction(data);
    await Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  editTransaction: async (id: number, data: Partial<TransactionFormData>) => {
    await db.updateTransaction(id, {
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      date: data.date,
    });
    await Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  removeTransaction: async (id: number) => {
    await db.deleteTransaction(id);
    await Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  setMonth: (month: number) => {
    set({ selectedMonth: month });
    // Reload data when filter changes
    Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  setYear: (year: number) => {
    set({ selectedYear: year });
    Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  setFilterType: (type: 'all' | 'income' | 'expense') => {
    set({ filterType: type });
  },
}));
