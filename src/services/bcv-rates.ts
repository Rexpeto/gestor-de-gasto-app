import axios from 'axios';
import { upsertDailyRates } from '@/db/database';

interface BcvRawItem {
    fecha: string;
    promedio: number | string;
}

export interface BcvDayRate {
    /** "YYYY-MM-DD" */
    date: string;
    /** Promedio BS/USD */
    usd: number;
    /** Promedio BS/EUR */
    eur: number;
}

/**
 * Fetches daily BCV rates (USD & EUR) from dolarapi.com
 * and persists them to the daily_rates table.
 *
 * Safe to call on app startup — deduplicates via upsert.
 * Returns the rates map for immediate use.
 */
export async function fetchAndPersistBcvRates(): Promise<Record<string, BcvDayRate>> {
    const [usdRes, eurRes] = await Promise.all([
        axios.get<BcvRawItem[]>('https://ve.dolarapi.com/v1/historicos/dolares/oficial'),
        axios.get<BcvRawItem[]>('https://ve.dolarapi.com/v1/historicos/euros/oficial'),
    ]);

    const byDate: Record<string, BcvDayRate> = {};

    for (const item of usdRes.data) {
        const date = item.fecha.split('T')[0];
        byDate[date] = { date, usd: parseFloat(String(item.promedio)), eur: 0 };
    }

    for (const item of eurRes.data) {
        const date = item.fecha.split('T')[0];
        const eurVal = parseFloat(String(item.promedio));
        if (byDate[date]) {
            byDate[date].eur = eurVal;
        } else {
            byDate[date] = { date, usd: 0, eur: eurVal };
        }
    }

    // Persist to daily_rates table (non-critical)
    const entries = Object.values(byDate)
        .filter((r) => r.usd > 0 || r.eur > 0)
        .map((r) => ({
            date: r.date,
            p2pRate: 0, // BCV doesn't provide P2P rates
            bcvUsdRate: r.usd,
            bcvEurRate: r.eur,
        }));

    if (entries.length > 0) {
        await upsertDailyRates(entries).catch(() => {});
    }

    return byDate;
}
