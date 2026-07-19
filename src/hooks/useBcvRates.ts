import axios from "axios";
import { useQuery } from "@tanstack/react-query";

interface BcvDayRate {
    /** "YYYY-MM-DD" */
    date: string;
    /** Promedio BS/USD */
    usd: number;
    /** Promedio BS/EUR */
    eur: number;
}

interface BcvRawItem {
    fecha: string;
    promedio: number | string;
}

async function fetchAllRates(): Promise<Record<string, BcvDayRate>> {
    const [usdRes, eurRes] = await Promise.all([
        axios.get<BcvRawItem[]>("https://ve.dolarapi.com/v1/historicos/dolares/oficial"),
        axios.get<BcvRawItem[]>("https://ve.dolarapi.com/v1/historicos/euros/oficial"),
    ]);

    const byDate: Record<string, BcvDayRate> = {};

    for (const item of usdRes.data) {
        const date = item.fecha.split("T")[0];
        byDate[date] = { date, usd: parseFloat(String(item.promedio)), eur: 0 };
    }

    for (const item of eurRes.data) {
        const date = item.fecha.split("T")[0];
        const eurVal = parseFloat(String(item.promedio));
        if (byDate[date]) {
            byDate[date].eur = eurVal;
        } else {
            byDate[date] = { date, usd: 0, eur: eurVal };
        }
    }

    return byDate;
}

interface UseBcvRatesResult {
    ratesByDate: Record<string, BcvDayRate>;
    isLoading: boolean;
    error: string | null;
}

/**
 * Fetches and caches daily BCV rates (USD & EUR) from dolarapi.com.
 * Uses React Query for automatic caching, background refetch, and error handling.
 */
export function useBcvRates(): UseBcvRatesResult {
    const { data, isLoading, error } = useQuery({
        queryKey: ["bcv-rates"],
        queryFn: fetchAllRates,
        staleTime: 1000 * 60 * 60, // 1 hour — rates don't change often
        gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        ratesByDate: data ?? {},
        isLoading,
        error: error instanceof Error ? error.message : null,
    };
}
