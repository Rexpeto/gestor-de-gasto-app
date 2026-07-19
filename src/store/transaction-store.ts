import { create } from 'zustand';

import * as db from '@/db/database';
import { useRateStore } from '@/store/rate-store';
import type { Transaction, TransactionFormData, MonthlySummary, CategorySummary } from '@/types';
import { toBsEquivalent } from '@/utils/currency';

/**
 * Converts a transaction amount to Bs (Bolívares) based on its currency
 * and the month's exchange rates.
 *
 * Math:
 *   USDT → Bs: amount × p2pRate
 *   bsc (USD BCV) → Bs: amount × bcvUsdRate
 *   eur (EUR BCV) → Bs: amount × bcvEurRate
 *   bs → no conversion needed
 *
 * Falls back to raw amount if rates are not available.
 */
export { toBsEquivalent };

interface TransactionState {
  // Data
  transactions: Transaction[];
  monthlySummary: MonthlySummary | null;
  categorySummaries: CategorySummary[];
  incomeCategorySummaries: CategorySummary[];
  expenseCategorySummaries: CategorySummary[];
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
  incomeCategorySummaries: [],
  expenseCategorySummaries: [],
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

    // Fetch transactions + rates in parallel
    const [transactions] = await Promise.all([
      db.getTransactionsByMonth(selectedYear, selectedMonth),
    ]);

    // Get rates from the rate store (uses in-memory cache + DB).
    // Rate store uses 0-indexed months, but selectedMonth is 1-indexed.
    const rates = useRateStore.getState().getRates(selectedMonth - 1, selectedYear);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      const bsAmount = toBsEquivalent(tx.amount, tx.currency, rates);
      if (tx.type === 'income') {
        totalIncome += bsAmount;
      } else {
        totalExpense += bsAmount;
      }
    }

    set({
      monthlySummary: {
        month: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  },

  loadCategorySummaries: async () => {
    const { selectedYear, selectedMonth } = get();

    // Fetch transactions; get rates from rate store (in-memory cache)
    const [transactions] = await Promise.all([
      db.getTransactionsByMonth(selectedYear, selectedMonth),
    ]);
    const rates = useRateStore.getState().getRates(selectedMonth - 1, selectedYear);

    // Compute per-category totals with USDT conversion
    const incomeMap = new Map<
      number,
      { name: string; icon: string; color: string; total: number; currencies: Set<string> }
    >();
    const expenseMap = new Map<
      number,
      { name: string; icon: string; color: string; total: number; currencies: Set<string> }
    >();
    let grandIncome = 0;
    let grandExpense = 0;

    // We need category info — fetch it
    const allCategories = await db.getAllCategories();
    const catInfo = new Map(allCategories.map((c) => [c.id, c]));

    for (const tx of transactions) {
      const bsAmount = toBsEquivalent(tx.amount, tx.currency, rates);
      const info = catInfo.get(tx.categoryId);
      const name = info?.name ?? 'Sin categoría';
      const icon = info?.icon ?? 'circle-question-mark';
      const color = info?.color ?? '#6366f1';

      if (tx.type === 'income') {
        grandIncome += bsAmount;
        const entry = incomeMap.get(tx.categoryId) ?? {
          name,
          icon,
          color,
          total: 0,
          currencies: new Set<string>(),
        };
        entry.total += bsAmount;
        entry.currencies.add(tx.currency);
        incomeMap.set(tx.categoryId, entry);
      } else {
        grandExpense += bsAmount;
        const entry = expenseMap.get(tx.categoryId) ?? {
          name,
          icon,
          color,
          total: 0,
          currencies: new Set<string>(),
        };
        entry.total += bsAmount;
        entry.currencies.add(tx.currency);
        expenseMap.set(tx.categoryId, entry);
      }
    }

    // Determine dominant currency: if all txs same currency, use it; else 'mixed'
    const dominantCurrency = (currencies: Set<string>): string => {
      if (currencies.size === 1) return [...currencies][0];
      return 'mixed';
    };

    const incomeCategories: CategorySummary[] = Array.from(
      incomeMap.entries(),
    ).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categoryIcon: data.icon,
      categoryColor: data.color,
      total: data.total,
      percentage: grandIncome > 0 ? (data.total / grandIncome) * 100 : 0,
      currency: dominantCurrency(data.currencies),
    }));

    const expenseCategories: CategorySummary[] = Array.from(
      expenseMap.entries(),
    ).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categoryIcon: data.icon,
      categoryColor: data.color,
      total: data.total,
      percentage: grandExpense > 0 ? (data.total / grandExpense) * 100 : 0,
      currency: dominantCurrency(data.currencies),
    }));

    set({
      categorySummaries: [...incomeCategories, ...expenseCategories],
      incomeCategorySummaries: incomeCategories,
      expenseCategorySummaries: expenseCategories,
    });
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
      currency: data.currency,
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
