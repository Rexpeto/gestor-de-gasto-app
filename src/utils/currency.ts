import type { BudgetCurrency } from "@/store/budget-store";

export interface Rates {
  p2pRate: number;
  bcvUsdRate: number;
  bcvEurRate: number;
}

// ── Any currency → Bs (base) ──

/**
 * Convert a transaction amount to Bs (Bolívares).
 *
 * Math:
 *   USDT → Bs: amount × p2pRate
 *   bsc (USD BCV) → Bs: amount × bcvUsdRate
 *   eur (EUR BCV) → Bs: amount × bcvEurRate
 *   bs → no conversion
 */
export function toBsEquivalent(
  amount: number,
  currency: string,
  rates: Rates | null,
): number {
  if (!rates) return amount;
  switch (currency) {
    case "usdt":
      return rates.p2pRate > 0 ? amount * rates.p2pRate : amount;
    case "bsc":
      return rates.bcvUsdRate > 0 ? amount * rates.bcvUsdRate : amount;
    case "eur":
      return rates.bcvEurRate > 0 ? amount * rates.bcvEurRate : amount;
    case "bs":
      return amount;
    default:
      return amount;
  }
}

/**
 * Convert a budget amount (in its native currency) to Bs.
 *
 * Math:
 *   USDT → Bs: amount × p2pRate
 *   Bs → no conversion
 *   $ (USD BCV) → Bs: amount × bcvUsdRate
 *   € (EUR BCV) → Bs: amount × bcvEurRate
 */
export function budgetToBs(
  amount: number,
  currency: BudgetCurrency,
  rates: Rates,
): number {
  switch (currency) {
    case "USDT":
      return rates.p2pRate > 0 ? amount * rates.p2pRate : amount;
    case "Bs":
      return amount;
    case "$":
      return rates.bcvUsdRate > 0 ? amount * rates.bcvUsdRate : amount;
    case "€":
      return rates.bcvEurRate > 0 ? amount * rates.bcvEurRate : amount;
    default:
      return amount;
  }
}

// ── Bs → Any currency ──

/** Bs → USDT (Binance P2P) */
export function bsToUsdt(bs: number, rates: Rates): number {
  return rates.p2pRate > 0 ? bs / rates.p2pRate : 0;
}

/** Bs → $ BCV (USD oficial) */
export function bsToUsd(bs: number, rates: Rates): number {
  return rates.bcvUsdRate > 0 ? bs / rates.bcvUsdRate : 0;
}

/** Bs → € BCV (EUR oficial) */
export function bsToEur(bs: number, rates: Rates): number {
  return rates.bcvEurRate > 0 ? bs / rates.bcvEurRate : 0;
}

// ── Bs → Budget currency (inverse of budgetToBs) ──

/**
 * Convert Bs back to a budget's native currency.
 *
 * Math (inverse of budgetToBs):
 *   Bs → USDT: bs / p2pRate
 *   Bs → Bs: no conversion
 *   Bs → $ (USD BCV): bs / bcvUsdRate
 *   Bs → € (EUR BCV): bs / bcvEurRate
 */
export function bsToBudgetCurrency(
  bs: number,
  currency: BudgetCurrency,
  rates: Rates,
): number {
  switch (currency) {
    case "USDT":
      return rates.p2pRate > 0 ? bs / rates.p2pRate : bs;
    case "Bs":
      return bs;
    case "$":
      return rates.bcvUsdRate > 0 ? bs / rates.bcvUsdRate : bs;
    case "€":
      return rates.bcvEurRate > 0 ? bs / rates.bcvEurRate : bs;
    default:
      return bs;
  }
}
