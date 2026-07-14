import { create } from 'zustand';

import {
    getAllMonthlyRates,
    getMonthlyRates,
    upsertMonthlyRates,
} from '@/db/database';
import type { ConversionResult, MonthlyRates } from '@/types';

interface RateState {
    /** All monthly rates loaded from DB, keyed by "M-YYYY" */
    ratesByMonth: Record<string, MonthlyRates>;
    isLoading: boolean;
    loaded: boolean;

    /** Load all rates from DB into store */
    loadRates: () => Promise<void>;

    /** Get rates for a specific month (returns defaults if not set) */
    getRates: (month: number, year: number) => MonthlyRates;

    /** Set rates for a specific month and persist to DB */
    setRates: (
        month: number,
        year: number,
        rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
    ) => Promise<void>;

    /**
     * Pure conversion function.
     *
     * Paso 1: Bs = USDT * Tasa_P2P
     * Paso 2: USD = Bs / Tasa_BCV_USD
     * Paso 3: EUR = Bs / Tasa_BCV_EUR
     */
    convert: (
        usdtAmount: number,
        month: number,
        year: number,
    ) => ConversionResult;
}

const EMPTY_RATES: MonthlyRates = {
    month: 0,
    year: 0,
    p2pRate: 0,
    bcvUsdRate: 0,
    bcvEurRate: 0,
};

function toKey(month: number, year: number): string {
    return `${month}-${year}`;
}

export const useRateStore = create<RateState>((set, get) => ({
    ratesByMonth: {},
    isLoading: false,
    loaded: false,

    loadRates: async () => {
        set({ isLoading: true });
        try {
            const all = await getAllMonthlyRates();
            const byKey: Record<string, MonthlyRates> = {};
            for (const r of all) {
                byKey[toKey(r.month, r.year)] = r;
            }
            set({ ratesByMonth: byKey, loaded: true });
        } finally {
            set({ isLoading: false });
        }
    },

    getRates: (month, year) => {
        const key = toKey(month, year);
        return get().ratesByMonth[key] ?? {
            ...EMPTY_RATES,
            month,
            year,
        };
    },

    setRates: async (month, year, rates) => {
        const key = toKey(month, year);
        const entry: MonthlyRates = {
            month,
            year,
            p2pRate: rates.p2pRate,
            bcvUsdRate: rates.bcvUsdRate,
            bcvEurRate: rates.bcvEurRate,
        };

        // Optimistic update
        set((s) => ({
            ratesByMonth: { ...s.ratesByMonth, [key]: entry },
        }));

        // Persist to DB
        await upsertMonthlyRates(month, year, rates);
    },

    convert: (usdtAmount, month, year) => {
        const rates = get().getRates(month, year);

        // Paso 1: Bolívares desde USDT vía P2P
        const bs = usdtAmount * rates.p2pRate;

        // Paso 2-3: Divisas desde Bolívares vía BCV
        return {
            bs,
            usd: rates.bcvUsdRate > 0 ? bs / rates.bcvUsdRate : 0,
            eur: rates.bcvEurRate > 0 ? bs / rates.bcvEurRate : 0,
        };
    },
}));
