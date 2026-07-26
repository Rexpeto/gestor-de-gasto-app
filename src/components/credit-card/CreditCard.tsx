import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import type { BudgetCurrency } from '@/store/budget-store';
import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';
import { budgetToBs } from '@/utils/currency';
import { formatAmount } from '@/utils/currency-format';

import { ConversionRow } from './ConversionRow';
import { CurrencyToggleChip } from './CurrencyToggleChip';
import { IncomeExpenseRow } from './IncomeExpenseRow';

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
 * Hero card showing monthly budget with currency toggle.
 *
 * All conversions from Bs to other currencies use CURRENT rates from rate-store.
 * The budget → Bs conversion uses the SAVED budgetRate (tasa al guardar).
 *
 * Example: 150 $ with budget rate 500, current BCV 674.93
 *   - budgetInBs = 150 × 500 = 75,000 Bs (saved rate)
 *   - Toggle $: 75,000 / 674.93 = 111.12 $ (current rate)
 *   - Toggle Bs: 75,000 Bs
 *   - Toggle €: 75,000 / 770.68 = 97.31 € (current rate)
 *   - Toggle USDT: 75,000 / 852 = 88.03 USDT (current rate)
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
  const dailyRatesByDate = useRateStore((s) => s.dailyRatesByDate);

  // Parse current month/year from monthlySummary (format: "YYYY-MM")
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const summaryMonth = monthlySummary?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = summaryMonth.split('-');
  const month = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);

  // Monthly rates → fallback to today's daily rates for BCV fields
  const monthlyRates = getRates(month, year);
  const dailyRates = dailyRatesByDate[todayStr];
  const rates = {
    p2pRate: monthlyRates.p2pRate || dailyRates?.p2pRate || 0,
    bcvUsdRate: monthlyRates.bcvUsdRate || dailyRates?.bcvUsdRate || 0,
    bcvEurRate: monthlyRates.bcvEurRate || dailyRates?.bcvEurRate || 0,
  };

  // ── Step 1: Budget → Bs using SAVED rate (budgetRate) ──
  // This is the ONLY place budgetRate is used. Everything else uses current rates.
  const budgetRates = {
    p2pRate: budgetCurrency === 'USDT' ? budgetRate : rates.p2pRate,
    bcvUsdRate: budgetCurrency === '$' ? budgetRate : rates.bcvUsdRate,
    bcvEurRate: budgetCurrency === '€' ? budgetRate : rates.bcvEurRate,
  };
  const budgetInBs = budgetToBs(budgetAmount, budgetCurrency, budgetRates);

  // ── Step 2: Bs → any currency using CURRENT rates ──
  // When budgetCurrency matches, use budgetRate (saved rate) for re-conversion
  const reconvertFromBs = (bs: number, currency: string) => {
    if (currency === 'Bs') return bs;
    if (currency === '$') {
      const rate = budgetCurrency === '$' ? budgetRate : rates.bcvUsdRate;
      return rate > 0 ? bs / rate : 0;
    }
    if (currency === '€') {
      const rate = budgetCurrency === '€' ? budgetRate : rates.bcvEurRate;
      return rate > 0 ? bs / rate : 0;
    }
    if (currency === 'USDT') {
      const rate = budgetCurrency === 'USDT' ? budgetRate : rates.p2pRate;
      return rate > 0 ? bs / rate : 0;
    }
    return 0;
  };

  // ── Toggle: budgetCurrency ↔ Bs ──
  const [showBs, setShowBs] = useState(false);
  const displayCurrency = showBs ? 'Bs' : budgetCurrency;

  // Remaining budget: budget + income - expenses (all in Bs from priceCalculated)
  const remainingBs = Math.max(budgetInBs + totalIncome - totalExpense, 0);
  const displayBalance = showBs ? remainingBs : reconvertFromBs(remainingBs, budgetCurrency);

  // Conversion row values — ALL from remainingBs using current rates
  const balanceUsd = reconvertFromBs(remainingBs, '$');
  const balanceEur = reconvertFromBs(remainingBs, '€');
  const balanceUsdt = reconvertFromBs(remainingBs, 'USDT');

  // Income/Expense display — from Bs using current rates
  const bsToDisplay = (bs: number) => reconvertFromBs(bs, displayCurrency);
  const displayIncome = bsToDisplay(totalIncome);
  const displayExpense = bsToDisplay(totalExpense);

  // ── Counting animation ──
  const countAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const fromRef = useRef(displayBalance);
  const toRef = useRef(displayBalance);
  const isAnimating = useRef(false);
  const highlightColorRef = useRef(colors.onSurface);
  const [animatedColor, setAnimatedColor] = useState(colors.onSurface);

  // Listen to countAnim and interpolate the displayed value
  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => {
      const from = fromRef.current;
      const to = toRef.current;
      setAnimatedBalance(from + (to - from) * value);
    });
    return () => countAnim.removeListener(listener);
  }, [countAnim]);

  // Listen to colorAnim and interpolate color
  useEffect(() => {
    const listener = colorAnim.addListener(({ value }) => {
      // value: 1 = highlight, 0 = normal — lerp RGB
      const target = highlightColorRef.current;
      const normal = colors.onSurface;
      // Parse hex to rgb, lerp, reassemble
      const tr = parseInt(target.slice(1, 3), 16);
      const tg = parseInt(target.slice(3, 5), 16);
      const tb = parseInt(target.slice(5, 7), 16);
      const nr = parseInt(normal.slice(1, 3), 16);
      const ng = parseInt(normal.slice(3, 5), 16);
      const nb = parseInt(normal.slice(5, 7), 16);
      const r = Math.round(tr + (nr - tr) * (1 - value));
      const g = Math.round(tg + (ng - tg) * (1 - value));
      const b = Math.round(tb + (nb - tb) * (1 - value));
      setAnimatedColor(`rgb(${r},${g},${b})`);
    });
    return () => colorAnim.removeListener(listener);
  }, [colorAnim]);

  // Animate counting when displayBalance changes (income/expense added)
  useEffect(() => {
    if (isAnimating.current) return; // toggle already animating
    if (fromRef.current === displayBalance) return; // same value

    fromRef.current = fromRef.current; // keep current animated position
    toRef.current = displayBalance;

    // Determine highlight color based on direction
    const isIncome = displayBalance > fromRef.current;
    highlightColorRef.current = isIncome ? '#22c55e' : colors.error;

    countAnim.setValue(0);
    colorAnim.setValue(1); // start at highlight
    isAnimating.current = true;

    Animated.parallel([
      Animated.timing(countAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      isAnimating.current = false;
      setAnimatedBalance(displayBalance);
      fromRef.current = displayBalance;
      toRef.current = displayBalance;
      highlightColorRef.current = colors.onSurface;
    });
  }, [displayBalance]);

  const toggleCurrency = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const nextShowBs = !showBs;
    const nextCurrency = nextShowBs ? 'Bs' : budgetCurrency;
    const nextBalance = nextShowBs ? remainingBs : reconvertFromBs(remainingBs, budgetCurrency);

    fromRef.current = displayBalance;
    toRef.current = nextBalance;

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

    setShowBs(nextShowBs);
  };

  // Currency chip label: show current currency
  const chipLabel = showBs ? 'Bs' : budgetCurrency;

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

      {/* Label */}
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
        Saldo disponible
      </Text>

      {/* Main amount + tappable currency chip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.Text
          style={{
            fontFamily: 'Inter',
            fontSize: 40,
            fontWeight: '700',
            color: animatedColor,
            letterSpacing: -0.02,
          }}
        >
          {formatAmount(animatedBalance)}
        </Animated.Text>

        <CurrencyToggleChip label={chipLabel} onPress={toggleCurrency} />
      </View>

      {/* Conversion row: other currencies */}
      <ConversionRow
        budgetCurrency={budgetCurrency}
        displayCurrency={displayCurrency}
        budgetAmount={budgetAmount}
        balanceUsd={balanceUsd}
        balanceEur={balanceEur}
        balanceUsdt={balanceUsdt}
        remainingBs={remainingBs}
      />

      {/* Bottom row: Ingresos + Gastos */}
      <IncomeExpenseRow
        displayIncome={displayIncome}
        displayExpense={displayExpense}
        displayCurrency={displayCurrency}
      />
    </LinearGradient>
  );
}
