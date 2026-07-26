import React from 'react';
import { Text, View } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native/icons';

import { useThemeColors } from '@/store/theme-store';
import { formatWithCurrency } from '@/utils/currency-format';

interface IncomeExpenseRowProps {
  /** Formatted income amount (already converted to display currency) */
  displayIncome: number;
  /** Formatted expense amount (already converted to display currency) */
  displayExpense: number;
  /** Current display currency code */
  displayCurrency: string;
}

/**
 * Bottom row showing income and expense totals with colored icons.
 */
export function IncomeExpenseRow({
  displayIncome,
  displayExpense,
  displayCurrency,
}: IncomeExpenseRowProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 20 }}>
        {/* Income */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} color={colors.primary} />
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.onSurfaceVariant,
            }}
          >
            Ingresos
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '600',
              color: colors.primary,
            }}
          >
            {formatWithCurrency(displayIncome, displayCurrency)}
          </Text>
        </View>

        {/* Expense */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TrendingDown size={14} color={colors.error} />
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.onSurfaceVariant,
            }}
          >
            Gastos
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '600',
              color: colors.error,
            }}
          >
            {formatWithCurrency(displayExpense, displayCurrency)}
          </Text>
        </View>
      </View>
    </View>
  );
}
