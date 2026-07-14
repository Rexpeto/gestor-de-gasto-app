import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/database';

const SETTINGS_KEYS = {
  monthlyBudget: 'monthly_budget',
  showCategories: 'show_categories',
  showPresupuesto: 'show_presupuesto',
} as const;

interface PreferencesState {
  /** Whether the categories screen is accessible */
  showCategories: boolean;
  /** Whether the presupuesto screen is accessible */
  showPresupuesto: boolean;
  /** Monthly budget in USDT */
  monthlyBudget: number;
  /** Whether DB values have been loaded */
  loaded: boolean;

  /** Load all preferences from DB */
  loadPreferences: () => Promise<void>;
  setShowCategories: (val: boolean) => void;
  setShowPresupuesto: (val: boolean) => void;
  setMonthlyBudget: (val: number) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  showCategories: true,
  showPresupuesto: true,
  monthlyBudget: 0,
  loaded: false,

  loadPreferences: async () => {
    try {
      const [budgetRaw, categoriesRaw, presupuestoRaw] = await Promise.all([
        getSetting(SETTINGS_KEYS.monthlyBudget),
        getSetting(SETTINGS_KEYS.showCategories),
        getSetting(SETTINGS_KEYS.showPresupuesto),
      ]);

      console.log('[preferences-store] loadPreferences:', {
        budgetRaw,
        categoriesRaw,
        presupuestoRaw,
      });

      set({
        monthlyBudget: budgetRaw ? parseFloat(budgetRaw) : 0,
        showCategories: categoriesRaw !== 'false',
        showPresupuesto: presupuestoRaw !== 'false',
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
}));


