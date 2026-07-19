import type { BudgetCurrency } from "@/store/budget-store";

/**
 * Convert a budget amount (in its native currency) to USDT equivalent.
 *
 * Math:
 *   USDT → no conversion
 *   Bs → Bs / p2pRate = USDT
 *   $ (USD BCV) → $ * (bcvUsdRate / p2pRate) = USDT
 *   € (EUR BCV) → € * (bcvEurRate / p2pRate) = USDT
 */
export function budgetToUsdt(
  amount: number,
  currency: BudgetCurrency,
  rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
): number {
  if (rates.p2pRate <= 0) return amount;

  switch (currency) {
    case "USDT":
      return amount;
    case "Bs":
      return amount / rates.p2pRate;
    case "$":
      return rates.bcvUsdRate > 0
        ? amount * (rates.bcvUsdRate / rates.p2pRate)
        : amount;
    case "€":
      return rates.bcvEurRate > 0
        ? amount * (rates.bcvEurRate / rates.p2pRate)
        : amount;
    default:
      return amount;
  }
}
