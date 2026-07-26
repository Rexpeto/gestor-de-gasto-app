import React from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';
import type { BudgetCurrency } from '@/store/budget-store';
import { formatDollar, formatEuro, formatUsdt, formatAmount } from '@/utils/currency-format';

interface ConversionItem {
  key: string;
  label: string;
}

interface ConversionRowProps {
  /** Budget currency — excluded from the conversion list */
  budgetCurrency: BudgetCurrency;
  /** Currently displayed currency — excluded from the conversion list */
  displayCurrency: string;
  /** Budget amount in its native currency */
  budgetAmount: number;
  /** Remaining balance converted to each currency (0 if rate not configured) */
  balanceUsd: number;
  balanceEur: number;
  balanceUsdt: number;
  /** Remaining balance in Bs */
  remainingBs: number;
}

/**
 * Shows the budget converted to currencies other than the current display currency.
 * Only shows currencies with valid rates (> 0 balance).
 */
export function ConversionRow({
  budgetCurrency,
  displayCurrency,
  budgetAmount,
  balanceUsd,
  balanceEur,
  balanceUsdt,
  remainingBs,
}: ConversionRowProps) {
  const colors = useThemeColors();

  if (budgetAmount <= 0) return null;

  const items: ConversionItem[] = [];

  // Show $ if it's not the display currency and has a valid conversion
  if (displayCurrency !== '$' && budgetCurrency !== '$' && balanceUsd > 0) {
    items.push({ key: '$', label: formatDollar(balanceUsd) });
  }
  // Show € if it's not the display currency and has a valid conversion
  if (displayCurrency !== '€' && budgetCurrency !== '€' && balanceEur > 0) {
    items.push({ key: '€', label: formatEuro(balanceEur) });
  }
  // Show USDT if it's not the display currency and has a valid conversion
  if (displayCurrency !== 'USDT' && budgetCurrency !== 'USDT' && balanceUsdt > 0) {
    items.push({ key: 'USDT', label: formatUsdt(balanceUsdt) });
  }
  // Show Bs if it's not the display currency, budget is not Bs, and budget is not USDT
  if (displayCurrency !== 'Bs' && budgetCurrency !== 'Bs' && budgetCurrency !== 'USDT' && remainingBs > 0) {
    items.push({ key: 'Bs', label: `${formatAmount(remainingBs)} Bs` });
  }

  if (items.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={item.key}>
          {i > 0 && <Text style={{ fontSize: 13, color: colors.outline }}>·</Text>}
          <Text
            style={{
              fontFamily: 'Geist',
              fontSize: 14,
              fontWeight: '500',
              color: colors.onSurfaceVariant,
            }}
          >
            {item.label}
          </Text>
        </React.Fragment>
      ))}
    </View>
  );
}
