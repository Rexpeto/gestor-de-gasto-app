import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/database';
import type { BudgetCurrency } from '@/store/budget-store';

const SETTINGS_KEYS = {
  monthlyBudget: 'monthly_budget',
  showCategories: 'show_categories',
  showPresupuesto: 'show_presupuesto',
  budgetCurrency: 'budget_currency',
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
  /** Whether DB values have been loaded */
  loaded: boolean;

  /** Load all preferences from DB */
  loadPreferences: () => Promise<void>;
  setShowCategories: (val: boolean) => void;
  setShowPresupuesto: (val: boolean) => void;
  setMonthlyBudget: (val: number) => Promise<void>;
  setBudgetCurrency: (val: BudgetCurrency) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  showCategories: true,
  showPresupuesto: true,
  monthlyBudget: 0,
  budgetCurrency: 'USDT',
  loaded: false,

  loadPreferences: async () => {
    try {
      const [budgetRaw, categoriesRaw, presupuestoRaw, currencyRaw] = await Promise.all([
        getSetting(SETTINGS_KEYS.monthlyBudget),
        getSetting(SETTINGS_KEYS.showCategories),
        getSetting(SETTINGS_KEYS.showPresupuesto),
        getSetting(SETTINGS_KEYS.budgetCurrency),
      ]);

      console.log('[preferences-store] loadPreferences:', {
        budgetRaw,
        categoriesRaw,
        presupuestoRaw,
        currencyRaw,
      });

      set({
        monthlyBudget: budgetRaw ? parseFloat(budgetRaw) : 0,
        showCategories: categoriesRaw !== 'false',
        showPresupuesto: presupuestoRaw !== 'false',
        budgetCurrency: (['Bs', '$', '€', 'USDT'].includes(currencyRaw) ? currencyRaw : 'USDT') as BudgetCurrency,
        loaded: true,
      });
    } catch (e) {
      console.warn('[preferences-store] loadPreferences error:', e);
      // If DB read fails, keep defaults
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
    console.log('[preferences-store] setMonthlyBudget:', val);
    set({ monthlyBudget: val });
    await setSetting(SETTINGS_KEYS.monthlyBudget, String(val));
  },

  setBudgetCurrency: async (val) => {
    console.log('[preferences-store] setBudgetCurrency:', val);
    set({ budgetCurrency: val });
    await setSetting(SETTINGS_KEYS.budgetCurrency, val);
  },
}));


