export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  date: string; // ISO 8601 (YYYY-MM-DD)
  currency: string;
  /** Exchange rate used to convert to Bs (Bs per 1 unit of currency). 0 for Bs or when no rate was available */
  exchangeRate: number;
  /** Price the user entered (in original currency) */
  priceOriginal: number;
  /** Price converted to Bs using the day's exchange rate */
  priceCalculated: number;
  createdAt: string;
}

export interface TransactionFormData {
  amount: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  date: string;
  currency?: string;
  /** Manual exchange rate (e.g. user-entered P2P rate for USDT income). Overrides auto-resolved rate when > 0 */
  exchangeRate?: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
  currency: string; // dominant currency ('usdt' | 'bsc' | 'eur') — 'mixed' if varied
}

// ─── Exchange Rates ─────────────────────────────────────────────

export interface MonthlyRates {
  month: number; // 0-11
  year: number;
  p2pRate: number;   // Bs per USDT
  bcvUsdRate: number; // Bs per USD
  bcvEurRate: number; // Bs per EUR
}

export interface DailyRates {
  date: string; // "YYYY-MM-DD"
  p2pRate: number;
  bcvUsdRate: number;
  bcvEurRate: number;
}

export interface ConversionResult {
  bs: number;  // Bolívares (P2P)
  usd: number; // Dólares (BCV)
  eur: number; // Euros (BCV)
}
