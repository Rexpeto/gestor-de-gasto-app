import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/database';
import type { BudgetCurrency } from '@/store/budget-store';

const SETTINGS_KEYS = {
  monthlyBudget: 'monthly_budget',
  showCategories: 'show_categories',
  showPresupuesto: 'show_presupuesto',
  budgetCurrency: 'budget_currency',
  budgetRate: 'budget_rate',
} as const;

interface PreferencesState {
  /** Whether the categories screen is accessible */
  showCategories: boolean;
  /** Whether the presupuesto screen is accessible */
  showPresupuesto: boolean;
  /** Monthly budget amount (in the selected budgetCurrency) */
  monthlyBudget: number;
  /** Budget currency: USDT, Bs, $, or € */
  budgetCurrency: BudgetCurrency;
  /** Exchange rate saved with the budget (BCV rate when budget was saved) */
  budgetRate: number;
  /** Whether DB values have been loaded */
  loaded: boolean;

  /** Load all preferences from DB */
  loadPreferences: () => Promise<void>;
  setShowCategories: (val: boolean) => void;
  setShowPresupuesto: (val: boolean) => void;
  setMonthlyBudget: (val: number) => Promise<void>;
  setBudgetCurrency: (val: BudgetCurrency) => Promise<void>;
  setBudgetRate: (val: number) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  showCategories: true,
  showPresupuesto: true,
  monthlyBudget: 0,
  budgetCurrency: 'USDT',
  budgetRate: 0,
  loaded: false,

  loadPreferences: async () => {
    try {
      const [budgetRaw, categoriesRaw, presupuestoRaw, currencyRaw, rateRaw] = await Promise.all([
        getSetting(SETTINGS_KEYS.monthlyBudget),
        getSetting(SETTINGS_KEYS.showCategories),
        getSetting(SETTINGS_KEYS.showPresupuesto),
        getSetting(SETTINGS_KEYS.budgetCurrency),
        getSetting(SETTINGS_KEYS.budgetRate),
      ]);

      set({
        monthlyBudget: budgetRaw ? parseFloat(budgetRaw) : 0,
        showCategories: categoriesRaw !== 'false',
        showPresupuesto: presupuestoRaw !== 'false',
        budgetCurrency: (['Bs', '$', '€', 'USDT'].includes(currencyRaw) ? currencyRaw : 'USDT') as BudgetCurrency,
        budgetRate: rateRaw ? parseFloat(rateRaw) : 0,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  setShowCategories: (val) => {
    set({ showCategories: val });
    setSetting(SETTINGS_KEYS.showCategories, String(val));
  },

  setShowPresupuesto: (val) => {
    set({ showPresupuesto: val });
    setSetting(SETTINGS_KEYS.showPresupuesto, String(val));
  },

  setMonthlyBudget: async (val) => {
    set({ monthlyBudget: val });
    await setSetting(SETTINGS_KEYS.monthlyBudget, String(val));
  },

  setBudgetCurrency: async (val) => {
    set({ budgetCurrency: val });
    await setSetting(SETTINGS_KEYS.budgetCurrency, val);
  },

  setBudgetRate: async (val) => {
    set({ budgetRate: val });
    await setSetting(SETTINGS_KEYS.budgetRate, String(val));
  },
}));


