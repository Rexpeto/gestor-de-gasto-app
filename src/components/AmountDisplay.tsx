import { Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';

interface AmountDisplayProps {
  amount: string;
  currency?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  bsc: '$',
  eur: '€',
  usdt: 'USDT',
};

/**
 * Large centered amount display with "MONTO TOTAL" label and currency prefix.
 *
 * The currency symbol changes based on the selected payment method:
 * - $ BCV → $
 * - € BCV → €
 * - USDT → USDT
 */
export function AmountDisplay({ amount, currency = 'bsc' }: AmountDisplayProps) {
  const colors = useThemeColors();
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 }}>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '600',
          color: colors.onSurfaceVariant,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 8,
        }}
      >
        MONTO TOTAL
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: symbol.length > 1 ? 6 : 0 }}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: symbol.length > 1 ? 32 : 28,
            fontWeight: '600',
            color: colors.primary,
            marginBottom: 4,
          }}
        >
          {symbol}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 64,
            fontWeight: 'bold',
            color: colors.onSurface,
            lineHeight: 72,
          }}
        >
          {amount}
        </Text>
      </View>
    </View>
  );
}
