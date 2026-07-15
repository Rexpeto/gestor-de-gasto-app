import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, TrendingUp } from 'lucide-react-native/icons';

import { usePreferencesStore } from '@/store/preferences-store';
import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';

type CurrencyMode = 'USDT' | 'Bs';

const formatAmount = (amount: number): string =>
  `${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDollar = (amount: number): string =>
  `${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}$`;

const formatEuro = (amount: number): string =>
  `${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}€`;

interface CreditCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  /** USD equivalent of the balance (0 = rates not loaded) */
  balanceUsd?: number;
  /** EUR equivalent of the balance (0 = rates not loaded) */
  balanceEur?: number;
}

/**
 * Hero balance card with glassmorphism style, gradient blur decorations,
 * total balance display, income/expense summary row,
 * USD/EUR conversion, and a tappable currency chip (USDT ↔ Bs).
 */
export function CreditCard({
  balance,
  totalIncome,
  totalExpense,
  balanceUsd,
  balanceEur,
}: CreditCardProps) {
  const colors = useThemeColors();
  const monthlySummary = useTransactionStore((s) => s.monthlySummary);
  const getRates = useRateStore((s) => s.getRates);
  const showConversion = balance > 0;

  const budgetCurrency = usePreferencesStore((s) => s.budgetCurrency);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(budgetCurrency);

  // Parse current month/year from monthlySummary (format: "YYYY-MM")
  const now = new Date();
  const summaryMonth = monthlySummary?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = summaryMonth.split('-');
  const month = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);
  const rates = getRates(month, year);
  const p2pRate = rates.p2pRate || 1; // fallback to 1 if no rate set

  const isBs = currencyMode === 'Bs';
  const displayBalance = isBs ? balance * p2pRate : balance;
  const displayIncome = isBs ? totalIncome * p2pRate : totalIncome;
  const displayExpense = isBs ? totalExpense * p2pRate : totalExpense;

  const countAnim = useRef(new Animated.Value(0)).current;
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const fromRef = useRef(displayBalance);
  const toRef = useRef(displayBalance);
  const isAnimating = useRef(false);

  // Listen to countAnim and interpolate the displayed value
  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => {
      const from = fromRef.current;
      const to = toRef.current;
      setAnimatedBalance(from + (to - from) * value);
    });
    return () => countAnim.removeListener(listener);
  }, [countAnim]);

  // Sync animatedBalance with displayBalance when not animating
  useEffect(() => {
    if (!isAnimating.current) {
      setAnimatedBalance(displayBalance);
      fromRef.current = displayBalance;
      toRef.current = displayBalance;
    }
  }, [displayBalance]);

  const toggleCurrency = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const nextMode = currencyMode === 'USDT' ? 'Bs' : 'USDT';
    const nextBalance = nextMode === 'Bs' ? balance * p2pRate : balance;

    // Capture from/to values for interpolation
    fromRef.current = displayBalance;
    toRef.current = nextBalance;

    // Reset and start counting animation
    countAnim.setValue(0);

    Animated.timing(countAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      isAnimating.current = false;
      // Use nextBalance instead of displayBalance — displayBalance is
      // captured in the closure BEFORE setCurrencyMode, so it's the OLD
      // value (e.g., 600 USDT when we just toggled to Bs, or 30000 Bs
      // when we just toggled to USDT). nextBalance is always the correct
      // final value for the NEW mode.
      setAnimatedBalance(nextBalance);
      fromRef.current = nextBalance;
      toRef.current = nextBalance;
    });

    setCurrencyMode(nextMode);
  };

  return (
    <LinearGradient
      colors={[
        `${colors.primary}33`,
        `${colors.primary}14`,
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
          backgroundColor: `${colors.primary}4d`,
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
          backgroundColor: `${colors.primary}33`,
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

      {/* Main amount + tappable currency chip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 40,
            fontWeight: '700',
            color: colors.onSurface,
            letterSpacing: -0.02,
          }}
        >
          {formatAmount(animatedBalance)}
        </Text>

        {/* Currency toggle chip */}
        <Pressable
          onPress={toggleCurrency}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
            alignSelf: 'flex-end',
            marginBottom: 6,
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.9 : 1 }],
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: '700',
              color: colors.onPrimary,
            }}
          >
            {isBs ? 'Bs' : 'USDT'}
          </Text>
        </Pressable>
      </View>

      {/* Conversion row: USD · EUR (only when balance > 0 and in USDT mode) */}
      {showConversion && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginTop: 6,
          }}
        >
          <Text
            style={{
              fontFamily: 'Geist',
              fontSize: 15,
              fontWeight: '500',
              color: colors.onSurfaceVariant,
            }}
          >
            {formatDollar(balanceUsd ?? 0)}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.outline,
            }}
          >
            ·
          </Text>
          <Text
            style={{
              fontFamily: 'Geist',
              fontSize: 15,
              fontWeight: '500',
              color: colors.onSurfaceVariant,
            }}
          >
            {formatEuro(balanceEur ?? 0)}
          </Text>
        </View>
      )}

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
              {formatAmount(displayIncome)}
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
              {formatAmount(displayExpense)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
