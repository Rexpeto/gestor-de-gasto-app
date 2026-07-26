/**
 * Shared currency formatting utilities.
 * Used by CreditCard and its sub-components.
 */

const LOCALE = 'es-ES';

const absOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

export const formatAmount = (amount: number): string =>
  `${Math.abs(amount).toLocaleString(LOCALE, absOptions)}`;

export const formatDollar = (amount: number): string =>
  `${Math.abs(amount).toLocaleString(LOCALE, absOptions)}$`;

export const formatEuro = (amount: number): string =>
  `${Math.abs(amount).toLocaleString(LOCALE, absOptions)}€`;

export const formatUsdt = (amount: number): string =>
  `${Math.abs(amount).toLocaleString(LOCALE, absOptions)} USDT`;

/**
 * Format amount with the correct currency symbol for display.
 */
export const formatWithCurrency = (amount: number, currency: string): string => {
  if (currency === 'Bs') return `${formatAmount(amount)} Bs`;
  if (currency === '$') return formatDollar(amount);
  if (currency === '€') return formatEuro(amount);
  if (currency === 'USDT') return formatUsdt(amount);
  return `${formatAmount(amount)} ${currency}`;
};
