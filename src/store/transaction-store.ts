import { create } from 'zustand';

import * as db from '@/db/database';
import { useRateStore } from '@/store/rate-store';
import { usePreferencesStore } from '@/store/preferences-store';
import type { Transaction, TransactionFormData, MonthlySummary, CategorySummary } from '@/types';

/**
 * Resolve the exchange rate (Bs per 1 unit of currency) for a given date and currency.
 *
 * Looks up the daily rate first, falls back to monthly rates.
 * Returns the raw rate value used for conversion (e.g. p2pRate for USDT).
 */
async function resolveExchangeRate(date: string, currency: string): Promise<number> {
  if (currency === 'bs') return 0; // Bs needs no conversion

  const [yearStr, monthStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed

  await useRateStore.getState().loadDailyRates(year, month);
  const rateStore = useRateStore.getState();

  // Try daily rate first
  const daily = rateStore.dailyRatesByDate[date];
  if (daily) {
    switch (currency) {
      case 'usdt': if (daily.p2pRate > 0) return daily.p2pRate; break;
      case 'bsc':  if (daily.bcvUsdRate > 0) return daily.bcvUsdRate; break;
      case 'eur':  if (daily.bcvEurRate > 0) return daily.bcvEurRate; break;
    }
  }

  // Fall back to monthly rates
  const monthly = rateStore.getRates(month - 1, year); // 0-indexed
  switch (currency) {
    case 'usdt': if (monthly.p2pRate > 0) return monthly.p2pRate; break;
    case 'bsc':  if (monthly.bcvUsdRate > 0) return monthly.bcvUsdRate; break;
    case 'eur':  if (monthly.bcvEurRate > 0) return monthly.bcvEurRate; break;
  }

  // Final fallback: if budget is USDT, use budgetRate for USDT transactions
  const prefs = usePreferencesStore.getState();
  if (prefs.budgetCurrency === 'USDT' && currency === 'usdt' && prefs.budgetRate > 0) {
    return prefs.budgetRate;
  }

  return 0;
}

/**
 * Compute priceCalculated (Bs equivalent) from amount + currency + rate.
 * For 'bs': priceCalculated = amount (no conversion).
 * For others: priceCalculated = amount × rate.
 */
function computePriceCalculated(amount: number, currency: string, rate: number): number {
  if (currency === 'bs') return amount;
  if (rate > 0) return amount * rate;
  return 0; // no rate available
}

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
    const transactions = await db.getTransactionsByMonth(selectedYear, selectedMonth);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      // Simply use the pre-computed Bs amount
      if (tx.type === 'income') {
        totalIncome += tx.priceCalculated;
      } else {
        totalExpense += tx.priceCalculated;
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

    const transactions = await db.getTransactionsByMonth(selectedYear, selectedMonth);

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

    const allCategories = await db.getAllCategories();
    const catInfo = new Map(allCategories.map((c) => [c.id, c]));

    for (const tx of transactions) {
      // Simply use the pre-computed Bs amount
      const bsAmount = tx.priceCalculated;
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
    const currency = data.currency ?? 'bsc';
    // Manual rate (income + USDT) takes precedence; otherwise auto-resolve
    const manualRate = data.exchangeRate && data.exchangeRate > 0 ? data.exchangeRate : 0;
    const rate = manualRate > 0 ? manualRate : await resolveExchangeRate(data.date, currency);
    const priceOriginal = data.amount;
    const priceCalculated = computePriceCalculated(data.amount, currency, rate);

    const txToSave = {
      ...data,
      currency,
      exchangeRate: rate,
      priceOriginal,
      priceCalculated,
    };

    await db.createTransaction(txToSave);
    await Promise.all([
      get().loadTransactions(),
      get().loadMonthlySummary(),
      get().loadCategorySummaries(),
    ]);
  },

  editTransaction: async (id: number, data: Partial<TransactionFormData>) => {
    const currency = data.currency ?? 'bsc';
    // Manual rate (income + USDT) takes precedence; otherwise auto-resolve
    const manualRate = data.exchangeRate && data.exchangeRate > 0 ? data.exchangeRate : 0;
    const rate = manualRate > 0 ? manualRate : await resolveExchangeRate(data.date ?? '', currency);
    const priceOriginal = data.amount ?? 0;
    const priceCalculated = computePriceCalculated(priceOriginal, currency, rate);

    const txToUpdate = {
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      date: data.date,
      currency,
      exchangeRate: rate,
      priceOriginal,
      priceCalculated,
    };

    await db.updateTransaction(id, txToUpdate);
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
