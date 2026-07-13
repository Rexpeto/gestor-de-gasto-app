import { create } from 'zustand';

export interface Budget {
  categoryId: number;
  amount: number; // monthly limit
  enabled: boolean;
}

export interface ExchangeRate {
  code: string; // e.g. "USD", "EUR"
  symbol: string; // e.g. "$", "€"
  rateToBase: number; // 1 unit of this currency = ? ARS (base)
  enabled: boolean;
}

export interface BudgetState {
  budgets: Budget[];
  exchangeRates: ExchangeRate[];
  baseCurrency: string;

  setBudget: (categoryId: number, amount: number) => void;
  toggleBudget: (categoryId: number) => void;
  removeBudget: (categoryId: number) => void;

  setExchangeRate: (code: string, rate: number) => void;
  toggleCurrency: (code: string) => void;
  removeCurrency: (code: string) => void;
  setBaseCurrency: (code: string) => void;

  totalBudget: () => number;
  getBudgetForCategory: (categoryId: number) => Budget | undefined;
  getSpentPercentage: (categoryId: number, spent: number) => number;
}

const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  { code: 'USD', symbol: '$', rateToBase: 1, enabled: true },
  { code: 'EUR', symbol: '€', rateToBase: 1.08, enabled: false },
  { code: 'ARS', symbol: '$', rateToBase: 0.0012, enabled: false },
  { code: 'COP', symbol: '$', rateToBase: 0.00024, enabled: false },
  { code: 'MXN', symbol: '$', rateToBase: 0.054, enabled: false },
];

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  exchangeRates: DEFAULT_EXCHANGE_RATES,
  baseCurrency: 'USD',

  setBudget: (categoryId, amount) =>
    set((s) => {
      const existing = s.budgets.find((b) => b.categoryId === categoryId);
      if (existing) {
        return {
          budgets: s.budgets.map((b) =>
            b.categoryId === categoryId ? { ...b, amount } : b,
          ),
        };
      }
      return {
        budgets: [...s.budgets, { categoryId, amount, enabled: true }],
      };
    }),

  toggleBudget: (categoryId) =>
    set((s) => ({
      budgets: s.budgets.map((b) =>
        b.categoryId === categoryId ? { ...b, enabled: !b.enabled } : b,
      ),
    })),

  removeBudget: (categoryId) =>
    set((s) => ({
      budgets: s.budgets.filter((b) => b.categoryId !== categoryId),
    })),

  setExchangeRate: (code, rate) =>
    set((s) => {
      const existing = s.exchangeRates.find((r) => r.code === code);
      if (existing) {
        return {
          exchangeRates: s.exchangeRates.map((r) =>
            r.code === code ? { ...r, rateToBase: rate } : r,
          ),
        };
      }
      return {
        exchangeRates: [
          ...s.exchangeRates,
          { code, symbol: code === 'EUR' ? '€' : '$', rateToBase: rate, enabled: true },
        ],
      };
    }),

  toggleCurrency: (code) =>
    set((s) => ({
      exchangeRates: s.exchangeRates.map((r) =>
        r.code === code ? { ...r, enabled: !r.enabled } : r,
      ),
    })),

  removeCurrency: (code) =>
    set((s) => ({
      exchangeRates: s.exchangeRates.filter((r) => r.code !== code),
    })),

  setBaseCurrency: (code) => set({ baseCurrency: code }),

  totalBudget: () => get().budgets.reduce((sum, b) => sum + (b.enabled ? b.amount : 0), 0),

  getBudgetForCategory: (categoryId) => get().budgets.find((b) => b.categoryId === categoryId),

  getSpentPercentage: (categoryId, spent) => {
    const budget = get().budgets.find((b) => b.categoryId === categoryId);
    if (!budget || !budget.enabled || budget.amount <= 0) return 0;
    return Math.min(Math.round((spent / budget.amount) * 100), 100);
  },
}));
