import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, TrendingUp } from 'lucide-react-native/icons';

import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { BudgetCurrency } from '@/store/budget-store';
import { budgetToBs, bsToUsdt, bsToEur, bsToUsd } from '@/utils/currency';

type CurrencyMode = 'original' | 'alternate';

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

const formatUsdt = (amount: number): string =>
  `${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;

interface CreditCardProps {
  /** Budget amount in its native currency (e.g., 150 for 150$) */
  budgetAmount: number;
  /** Budget currency: '$', '€', 'Bs', 'USDT' */
  budgetCurrency: BudgetCurrency;
  /** Exchange rate saved with the budget (for budget → Bs conversion) */
  budgetRate: number;
  /** Total income in Bs (for the income/expense row) */
  totalIncome: number;
  /** Total expense in Bs (for the income/expense row) */
  totalExpense: number;
}

/**
 * Hero card showing monthly budget with currency toggle (original ↔ Bs).
 *
 * Example: 150 $ with budget rate 500, current BCV 674.93
 *   - Original: 150,00 $
 *   - Bs: 75,000 Bs (150 × 500)
 *   - Conversions: 97.31 € (75,000 / 770.682) · 88.03 USDT (75,000 / 852)
 */
export function CreditCard({
  budgetAmount,
  budgetCurrency,
  budgetRate,
  totalIncome,
  totalExpense,
}: CreditCardProps) {
  const colors = useThemeColors();
  const monthlySummary = useTransactionStore((s) => s.monthlySummary);
  const getRates = useRateStore((s) => s.getRates);

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('original');

  // Parse current month/year from monthlySummary (format: "YYYY-MM")
  const now = new Date();
  const summaryMonth = monthlySummary?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = summaryMonth.split('-');
  const month = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);
  const rates = getRates(month, year);

  // Build rates for budget → Bs conversion using budgetRate
  const budgetRates = {
    p2pRate: budgetCurrency === 'USDT' ? budgetRate : rates.p2pRate,
    bcvUsdRate: budgetCurrency === '$' ? budgetRate : rates.bcvUsdRate,
    bcvEurRate: budgetCurrency === '€' ? budgetRate : rates.bcvEurRate,
  };

  // Convert budget to Bs using budgetRate (e.g., 150 × 500 = 75,000 Bs)
  const budgetInBs = budgetToBs(budgetAmount, budgetCurrency, budgetRates);

  // Conversions from Bs using CURRENT rates (e.g., 75,000 / 770.682 = 97.31 €)
  const balanceUsd = bsToUsd(budgetInBs, rates);
  const balanceEur = bsToEur(budgetInBs, rates);
  const balanceUsdt = bsToUsdt(budgetInBs, rates);

  // Alternate currency: Bs budget → toggle to $, others → toggle to Bs
  const alternateCurrency = budgetCurrency === 'Bs' ? '$' : 'Bs';

  // Display value based on mode
  const isAlternate = currencyMode === 'alternate';
  const displayCurrency = isAlternate ? alternateCurrency : budgetCurrency;

  // Primary mode: show amount reconverted from Bs using current rate
  // (budget was saved at budgetRate, now showing at current rate)
  const reconvertFromBs = (bs: number, currency: string) => {
    if (currency === 'Bs') return bs;
    if (currency === '$') return rates.bcvUsdRate > 0 ? bs / rates.bcvUsdRate : bs;
    if (currency === '€') return rates.bcvEurRate > 0 ? bs / rates.bcvEurRate : bs;
    if (currency === 'USDT') return rates.p2pRate > 0 ? bs / rates.p2pRate : bs;
    return bs;
  };

  const displayBalance = isAlternate
    ? (alternateCurrency === 'Bs' ? budgetInBs : balanceUsd)
    : reconvertFromBs(budgetInBs, budgetCurrency);

  // Income/Expense display (already in Bs from store)
  const bsToDisplay = (bs: number) => {
    if (displayCurrency === 'Bs') return bs;
    if (displayCurrency === 'USDT') return rates.p2pRate > 0 ? bs / rates.p2pRate : bs;
    if (displayCurrency === '$') return rates.bcvUsdRate > 0 ? bs / rates.bcvUsdRate : bs;
    if (displayCurrency === '€') return rates.bcvEurRate > 0 ? bs / rates.bcvEurRate : bs;
    return bs;
  };
  const displayIncome = bsToDisplay(totalIncome);
  const displayExpense = bsToDisplay(totalExpense);

  // Format income/expense with current currency
  const formatWithCurrency = (amount: number) => {
    if (displayCurrency === 'Bs') return `${formatAmount(amount)} Bs`;
    if (displayCurrency === '$') return formatDollar(amount);
    if (displayCurrency === '€') return formatEuro(amount);
    if (displayCurrency === 'USDT') return formatUsdt(amount);
    return `${formatAmount(amount)} ${displayCurrency}`;
  };

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

    const nextMode = currencyMode === 'original' ? 'alternate' : 'original';
    const nextDisplayCurrency = nextMode === 'alternate' ? alternateCurrency : budgetCurrency;
    const nextBalance = nextDisplayCurrency === 'Bs'
      ? budgetInBs
      : nextDisplayCurrency === '$'
        ? balanceUsd
        : budgetAmount;

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
      setAnimatedBalance(nextBalance);
      fromRef.current = nextBalance;
      toRef.current = nextBalance;
    });

    setCurrencyMode(nextMode);
  };

  // Currency chip label
  const chipLabel = isAlternate ? alternateCurrency : budgetCurrency;
  // Format main amount with currency
  const mainAmountText = displayCurrency === 'Bs'
    ? `${formatAmount(animatedBalance)} Bs`
    : displayCurrency === '$'
      ? `${formatDollar(animatedBalance)}`
      : displayCurrency === '€'
        ? `${formatEuro(animatedBalance)}`
        : displayCurrency === 'USDT'
          ? `${formatUsdt(animatedBalance)}`
          : `${formatAmount(animatedBalance)} ${displayCurrency}`;

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
        Presupuesto Mensual
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
            {chipLabel}
          </Text>
        </Pressable>
      </View>

      {/* Conversion row: show the two currencies that aren't Bs or the budget currency */}
      {budgetAmount > 0 && (() => {
        const items: { key: string; label: string }[] = [];
        if (budgetCurrency === '€' || budgetCurrency === 'USDT') {
          if (displayCurrency !== '$' && balanceUsd > 0) items.push({ key: '$', label: formatDollar(balanceUsd) });
        }
        if (budgetCurrency !== '€' && displayCurrency !== '€' && balanceEur > 0) items.push({ key: '€', label: formatEuro(balanceEur) });
        if (budgetCurrency !== 'USDT' && displayCurrency !== 'USDT' && balanceUsdt > 0) items.push({ key: 'USDT', label: formatUsdt(balanceUsdt) });
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
      })()}

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
              {formatWithCurrency(displayIncome)}
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
              {formatWithCurrency(displayExpense)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
