import { create } from 'zustand';

interface PreferencesState {
  /** Whether the categories screen is accessible */
  showCategories: boolean;
  /** Whether the presupuesto screen is accessible */
  showPresupuesto: boolean;

  setShowCategories: (val: boolean) => void;
  setShowPresupuesto: (val: boolean) => void;
}

/**
 * User-facing feature toggles for optional screens.
 *
 * In-memory only for now; values reset on app restart.
 * TODO: persist to AsyncStorage if needed.
 */
export const usePreferencesStore = create<PreferencesState>((set) => ({
  showCategories: true,
  showPresupuesto: true,

  setShowCategories: (val) => set({ showCategories: val }),
  setShowPresupuesto: (val) => set({ showPresupuesto: val }),
}));
