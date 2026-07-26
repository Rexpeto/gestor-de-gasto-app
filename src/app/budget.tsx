import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useBudgetStore } from '@/store/budget-store';
import type { BudgetCurrency, Budget } from '@/store/budget-store';
import { useCategoryStore } from '@/store/category-store';
import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';
import { budgetToBs, bsToBudgetCurrency } from '@/utils/currency';

import { BudgetOverviewCard } from '@/components/budget/BudgetOverviewCard';
import { CategoryBudgetRow } from '@/components/budget/CategoryBudgetRow';
import { EmptyBudgetState } from '@/components/budget/EmptyBudgetState';

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

  // Convert budgets to Bs equivalent for comparison
  const enabledBudgets = useMemo(() => budgets.filter((b) => b.enabled), [budgets]);

  const totalBudgetedBs = useMemo(
    () => enabledBudgets.reduce(
      (sum, b) => sum + budgetToBs(b.amount, b.currency, rates),
      0,
    ),
    [enabledBudgets, rates],
  );

  // categorySummaries.total is already in Bs equivalent
  const totalSpentBs = useMemo(
    () => categorySummaries
      .filter((c) => budgets.some((b) => b.categoryId === c.categoryId && b.enabled))
      .reduce((sum, c) => sum + c.total, 0),
    [categorySummaries, budgets],
  );

  const isOverBudget = totalSpentBs > totalBudgetedBs && totalBudgetedBs > 0;
  const overspentPct = totalBudgetedBs > 0
    ? Math.round((totalSpentBs / totalBudgetedBs) * 100)
    : 0;

  const [editingBudget, setEditingBudget] = useState<Record<number, string>>({});
  const [editingCurrency, setEditingCurrency] = useState<Record<number, BudgetCurrency>>({});

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        <View className="mx-5 mt-4">
          {/* ── Overall Budget Progress ── */}
          <BudgetOverviewCard
            totalBudgeted={totalBudgetedBs}
            totalSpent={totalSpentBs}
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

              // Convert budget to Bs for progress calculation
              const budgetBs = budget
                ? budgetToBs(budget.amount, budget.currency, rates)
                : 0;

              // Spent is already in Bs from categorySummaries
              const spentBs = categorySummaries.find(
                (s) => s.categoryId === cat.id,
              )?.total ?? 0;

              // Convert spent back to budget's currency for display
              const spentInBudgetCurrency = budget
                ? bsToBudgetCurrency(spentBs, budget.currency, rates)
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
                  spentBs={spentBs}
                  budgetBs={budgetBs}
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
