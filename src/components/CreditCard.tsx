import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, TrendingUp } from 'lucide-react-native/icons';

import { useThemeColors } from '@/store/theme-store';

const formatCurrency = (amount: number): string =>
  `$${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface CreditCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  formatCurrencyFn?: (amount: number) => string;
}

/**
 * Hero balance card with glassmorphism style, gradient blur decorations,
 * total balance display, and income/expense summary row.
 */
export function CreditCard({
  balance,
  totalIncome,
  totalExpense,
  formatCurrencyFn,
}: CreditCardProps) {
  const colors = useThemeColors();
  const fmt = formatCurrencyFn ?? formatCurrency;

  return (
    <LinearGradient
      colors={[
        `${colors.primary}1A`,
        `${colors.primary}0A`,
        colors.glassSurface,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1.2, y: 1.2 }}
      style={{
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 12,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient blur decorations */}
      <View
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 9999,
          backgroundColor: `${colors.primary}26`,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          left: -20,
          width: 100,
          height: 100,
          borderRadius: 9999,
          backgroundColor: `${colors.primary}14`,
        }}
      />

      {/* Label caps */}
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.1,
          color: colors.onSurfaceVariant,
          marginBottom: 4,
        }}
      >
        Saldo Total
      </Text>

      {/* Main amount */}
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 40,
          fontWeight: '700',
          color: colors.onSurface,
          letterSpacing: -0.02,
        }}
      >
        {fmt(balance)}
      </Text>

      {/* Bottom row: Ingresos + Gastos */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 20,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 20 }}>
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
              {fmt(totalIncome)}
            </Text>
          </View>
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
              {fmt(totalExpense)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
