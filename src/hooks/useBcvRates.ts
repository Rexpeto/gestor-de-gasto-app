import { useQuery } from '@tanstack/react-query';
import { fetchAndPersistBcvRates } from '@/services/bcv-rates';

/**
 * Fetches and caches daily BCV rates (USD & EUR) from dolarapi.com.
 * Uses React Query for automatic caching, background refetch, and error handling.
 *
 * The actual fetch + DB persist is handled by fetchAndPersistBcvRates().
 */
export function useBcvRates() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['bcv-rates'],
        queryFn: fetchAndPersistBcvRates,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        ratesByDate: data ?? {},
        isLoading,
        error: error instanceof Error ? error.message : null,
    };
}
