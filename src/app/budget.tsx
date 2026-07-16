import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useBudgetStore } from '@/store/budget-store';
import type { BudgetCurrency, Budget } from '@/store/budget-store';
import { useCategoryStore } from '@/store/category-store';
import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';

import { BudgetOverviewCard } from '@/components/budget/BudgetOverviewCard';
import { CategoryBudgetRow } from '@/components/budget/CategoryBudgetRow';
import { EmptyBudgetState } from '@/components/budget/EmptyBudgetState';

/**
 * Convert budget amount to USDT equivalent based on exchange rates.
 *
 * Math:
 *   USDT → no conversion
 *   Bs → Bs / p2pRate = USDT
 *   $ (USD BCV) → $ * (bcvUsdRate / p2pRate) = USDT
 *   € (EUR BCV) → € * (bcvEurRate / p2pRate) = USDT
 */
function budgetToUsdt(
  amount: number,
  currency: BudgetCurrency,
  rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
): number {
  if (rates.p2pRate <= 0) return amount;

  switch (currency) {
    case 'USDT':
      return amount;
    case 'Bs':
      return amount / rates.p2pRate;
    case '$':
      return rates.bcvUsdRate > 0
        ? amount * (rates.bcvUsdRate / rates.p2pRate)
        : amount;
    case '€':
      return rates.bcvEurRate > 0
        ? amount * (rates.bcvEurRate / rates.p2pRate)
        : amount;
    default:
      return amount;
  }
}

/**
 * Convert USDT amount back to budget's currency.
 *
 * Math (inverse of budgetToUsdt):
 *   USDT → no conversion
 *   Bs → USDT * p2pRate = Bs
 *   $ (USD BCV) → USDT * (p2pRate / bcvUsdRate) = $
 *   € (EUR BCV) → USDT * (p2pRate / bcvEurRate) = €
 */
function usdtToBudgetCurrency(
  usdtAmount: number,
  currency: BudgetCurrency,
  rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
): number {
  if (rates.p2pRate <= 0) return usdtAmount;

  switch (currency) {
    case 'USDT':
      return usdtAmount;
    case 'Bs':
      return usdtAmount * rates.p2pRate;
    case '$':
      return rates.bcvUsdRate > 0
        ? usdtAmount * (rates.p2pRate / rates.bcvUsdRate)
        : usdtAmount;
    case '€':
      return rates.bcvEurRate > 0
        ? usdtAmount * (rates.p2pRate / rates.bcvEurRate)
        : usdtAmount;
    default:
      return usdtAmount;
  }
}

export default function BudgetScreen() {
  const colors = useThemeColors();
  const categories = useCategoryStore((s) => s.categories);
  const categorySummaries = useTransactionStore((s) => s.categorySummaries);
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const selectedYear = useTransactionStore((s) => s.selectedYear);
  const getRates = useRateStore((s) => s.getRates);
  const {
    budgets,
    setBudget,
    toggleBudget,
    removeBudget,
  } = useBudgetStore();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  // Get current month's rates (selectedMonth is 1-indexed, rates use 0-indexed)
  const rates = useMemo(
    () => getRates(selectedMonth - 1, selectedYear),
    [getRates, selectedMonth, selectedYear],
  );

  // Convert budgets to USDT equivalent for comparison
  const enabledBudgets = useMemo(() => budgets.filter((b) => b.enabled), [budgets]);

  const totalBudgetedUsdt = useMemo(
    () => enabledBudgets.reduce(
      (sum, b) => sum + budgetToUsdt(b.amount, b.currency, rates),
      0,
    ),
    [enabledBudgets, rates],
  );

  // categorySummaries.total is already in USDT equivalent
  const totalSpentUsdt = useMemo(
    () => categorySummaries
      .filter((c) => budgets.some((b) => b.categoryId === c.categoryId && b.enabled))
      .reduce((sum, c) => sum + c.total, 0),
    [categorySummaries, budgets],
  );

  const isOverBudget = totalSpentUsdt > totalBudgetedUsdt && totalBudgetedUsdt > 0;
  const overspentPct = totalBudgetedUsdt > 0
    ? Math.round((totalSpentUsdt / totalBudgetedUsdt) * 100)
    : 0;

  const [editingBudget, setEditingBudget] = useState<Record<number, string>>({});
  const [editingCurrency, setEditingCurrency] = useState<Record<number, BudgetCurrency>>({});

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        <View className="mx-5 mt-4">
          {/* ── Overall Budget Progress ── */}
          <BudgetOverviewCard
            totalBudgeted={totalBudgetedUsdt}
            totalSpent={totalSpentUsdt}
            overspentPct={overspentPct}
            isOverBudget={isOverBudget}
          />

          {/* ── Section: Budget per Category ── */}
          <Text
            className="text-base font-semibold mb-3"
            style={{ fontFamily: 'Inter', color: colors.onSurface }}
          >
            Límites por categoría
          </Text>

          {expenseCategories.length === 0 ? (
            <EmptyBudgetState />
          ) : (
            expenseCategories.map((cat) => {
              const budget = budgets.find((b) => b.categoryId === cat.id);

              // Convert budget to USDT for progress calculation
              const budgetUsdt = budget
                ? budgetToUsdt(budget.amount, budget.currency, rates)
                : 0;

              // Spent is already in USDT from categorySummaries
              const spentUsdt = categorySummaries.find(
                (s) => s.categoryId === cat.id,
              )?.total ?? 0;

              // Convert spent back to budget's currency for display
              const spentInBudgetCurrency = budget
                ? usdtToBudgetCurrency(spentUsdt, budget.currency, rates)
                : 0;

              const editValue = editingBudget[cat.id] !== undefined
                ? editingBudget[cat.id]
                : budget?.amount ? String(budget.amount) : '';

              const currentCurrency = editingCurrency[cat.id] ?? budget?.currency ?? '$';

              return (
                <CategoryBudgetRow
                  key={cat.id}
                  category={cat}
                  budget={budget}
                  spentUsdt={spentUsdt}
                  budgetUsdt={budgetUsdt}
                  spentInBudgetCurrency={spentInBudgetCurrency}
                  editValue={editValue}
                  onEditChange={(v) => setEditingBudget((prev) => ({ ...prev, [cat.id]: v }))}
                  onCurrencyChange={(c) => {
                    // Save currency immediately
                    const val = parseFloat(editValue);
                    if (!isNaN(val) && val > 0) {
                      setBudget(cat.id, val, c);
                    } else if (budget) {
                      setBudget(cat.id, budget.amount, c);
                    }
                  }}
                  onEditBlur={() => {
                    const val = parseFloat(editValue);
                    const currency = editingCurrency[cat.id] ?? budget?.currency ?? '$';
                    if (!isNaN(val) && val > 0) {
                      setBudget(cat.id, val, currency);
                    }
                    setEditingBudget((prev) => {
                      const copy = { ...prev };
                      delete copy[cat.id];
                      return copy;
                    });
                    setEditingCurrency((prev) => {
                      const copy = { ...prev };
                      delete copy[cat.id];
                      return copy;
                    });
                  }}
                  onRemove={() => removeBudget(cat.id)}
                  onToggle={() => toggleBudget(cat.id)}
                />
              );
            })
          )}

          {/* ── Back button ── */}
          <Pressable
            className="w-full py-3.5 rounded-full items-center flex-row justify-center gap-2 mt-6"
            style={{
              backgroundColor: `${colors.primary}4D`,
              borderWidth: 1,
              borderColor: `${colors.primary}4d`,
            }}
            onPress={() => router.back()}
          >
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.primary }}
            >
              Ver estadísticas de gastos
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
