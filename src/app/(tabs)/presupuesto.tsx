import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Trash2, ArrowLeft, PiggyBank, Settings2 } from 'lucide-react-native/icons';

import { useBudgetStore } from '@/store/budget-store';
import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useThemeColors } from '@/store/theme-store';

function EditableNumberInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View
      className="rounded-lg px-3 py-2 min-w-[90px]"
      style={{
        backgroundColor: `${colors.primary}14`,
        borderWidth: 1,
        borderColor: `${colors.primary}33`,
      }}
    >
      <Text
        className="text-xs font-semibold mb-0.5"
        style={{ fontFamily: 'Inter', color: colors.primary }}
      >
        $
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        keyboardType="decimal-pad"
        className="text-sm font-bold"
        style={{ fontFamily: 'Inter', color: colors.onSurface, padding: 0 }}
        placeholderTextColor={colors.outline}
      />
    </View>
  );
}

export default function PresupuestoScreen() {
  const colors = useThemeColors();
  const categories = useCategoryStore((s) => s.categories);
  const categorySummaries = useTransactionStore((s) => s.categorySummaries);
  const {
    budgets,
    exchangeRates,
    baseCurrency,
    setBudget,
    toggleBudget,
    removeBudget,
    toggleCurrency,
  } = useBudgetStore();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const enabledBudgets = useMemo(() => budgets.filter((b) => b.enabled), [budgets]);
  const totalBudgeted = enabledBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = useMemo(
    () => categorySummaries
      .filter((c) => budgets.some((b) => b.categoryId === c.categoryId && b.enabled))
      .reduce((sum, c) => sum + c.total, 0),
    [categorySummaries, budgets],
  );

  const isOverBudget = totalSpent > totalBudgeted && totalBudgeted > 0;
  const overspentPct = totalBudgeted > 0
    ? Math.round((totalSpent / totalBudgeted) * 100)
    : 0;

  const [editingBudget, setEditingBudget] = useState<Record<number, string>>({});

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View className="px-5 pt-16 pb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text
          className="text-xl font-bold flex-1"
          style={{ fontFamily: 'Inter', color: colors.onSurface }}
        >
          Presupuesto
        </Text>
        <Settings2 size={20} color={colors.onSurfaceVariant} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        {/* ── Overall Budget Progress ── */}
        <View
          className="mx-5 rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: colors.glassSurface,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <PiggyBank size={20} color={colors.primary} />
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.onSurface }}
            >
              Presupuesto mensual
            </Text>
          </View>

          <View className="flex-row items-baseline gap-1 mb-2">
            <Text
              className="text-3xl font-bold"
              style={{ fontFamily: 'Inter', color: colors.primary }}
            >
              ${totalBudgeted.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
            <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
              / mes
            </Text>
          </View>

          {/* Spending progress */}
          {totalBudgeted > 0 && (
            <>
              <View className="h-2 rounded-full overflow-hidden mt-3" style={{ backgroundColor: colors.glassBorder }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(overspentPct, 100)}%`,
                    backgroundColor: isOverBudget ? colors.danger : colors.primary,
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text
                  className="text-xs font-medium"
                  style={{ fontFamily: 'Inter', color: isOverBudget ? colors.danger : colors.onSurfaceVariant }}
                >
                  Gastado: ${totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </Text>
                <Text
                  className="text-xs font-medium"
                  style={{ fontFamily: 'Inter', color: isOverBudget ? colors.danger : colors.onSurfaceVariant }}
                >
                  {overspentPct}%
                </Text>
              </View>
              {isOverBudget && (
                <View
                  className="mt-3 rounded-xl p-3"
                  style={{ backgroundColor: `${colors.danger}1F`, borderWidth: 1, borderColor: `${colors.danger}33` }}
                >
                  <Text className="text-xs font-medium" style={{ fontFamily: 'Inter', color: colors.danger }}>
                    ⚠ Has superado tu presupuesto mensual
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Section: Budget per Category ── */}
        <View className="mx-5 mb-4">
          <Text
            className="text-base font-semibold mb-3"
            style={{ fontFamily: 'Inter', color: colors.onSurface }}
          >
            Límites por categoría
          </Text>

          {expenseCategories.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Text style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant, textAlign: 'center' }}>
                No hay categorías de gasto. Creá algunas desde Categorías.
              </Text>
            </View>
          ) : (
            expenseCategories.map((cat) => {
              const budget = budgets.find((b) => b.categoryId === cat.id);
              const spent = categorySummaries.find((s) => s.categoryId === cat.id)?.total ?? 0;
              const pct = budget && budget.enabled && budget.amount > 0
                ? Math.min(Math.round((spent / budget.amount) * 100), 100)
                : 0;
              const over = budget && budget.enabled && spent > budget.amount;

              const editValue = editingBudget[cat.id] !== undefined
                ? editingBudget[cat.id]
                : budget?.amount ? String(budget.amount) : '';

              return (
                <View
                  key={cat.id}
                  className="rounded-2xl p-4 mb-2"
                  style={{
                    backgroundColor: !budget?.enabled && budget
                      ? `${colors.glassSurface}4D`
                      : colors.glassSurface,
                    borderWidth: 1,
                    borderColor: budget?.enabled
                      ? over ? `${colors.danger}33` : colors.glassBorder
                      : colors.glassBorder,
                    opacity: budget && !budget.enabled ? 0.5 : 1,
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text
                          className="text-sm font-medium"
                          style={{ fontFamily: 'Inter', color: colors.onSurface }}
                        >
                          {cat.name}
                        </Text>
                        <Text
                          className="text-xs font-semibold"
                          style={{ fontFamily: 'Inter', color: over ? colors.danger : colors.onSurfaceVariant }}
                        >
                          {pct}% usado
                        </Text>
                      </View>

                      {budget?.enabled && (
                        <View className="h-1.5 rounded-full overflow-hidden mb-1" style={{ backgroundColor: colors.glassBorder }}>
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: over ? colors.danger : cat.color,
                            }}
                          />
                        </View>
                      )}

                      <View className="flex-row items-center gap-2">
                        <EditableNumberInput
                          value={editValue}
                          onChange={(v) => setEditingBudget((prev) => ({ ...prev, [cat.id]: v }))}
                          onBlur={() => {
                            const val = parseFloat(editValue);
                            if (!isNaN(val) && val > 0) {
                              setBudget(cat.id, val);
                            }
                            setEditingBudget((prev) => {
                              const copy = { ...prev };
                              delete copy[cat.id];
                              return copy;
                            });
                          }}
                        />
                        {budget && (
                          <Pressable
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${colors.danger}1A` }}
                            onPress={() => removeBudget(cat.id)}
                          >
                            <Trash2 size={16} color={colors.danger} />
                          </Pressable>
                        )}
                        {budget && (
                          <Pressable
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: budget.enabled
                                ? `${colors.danger}1A`
                                : `${colors.primary}1A`,
                            }}
                            onPress={() => toggleBudget(cat.id)}
                          >
                            <Text style={{ fontSize: 14, color: budget.enabled ? colors.danger : colors.primary }}>
                              {budget.enabled ? '⏸' : '▶'}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                      {budget && (
                        <Text className="text-xs mt-1" style={{ fontFamily: 'Inter', color: colors.outline }}>
                          Gastado: ${spent.toLocaleString('es-ES', { minimumFractionDigits: 2 })} / ${budget.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Exchange Rates Section ── */}
        <View className="mx-5 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.onSurface }}
            >
              Tasas de cambio
            </Text>
            <Text
              className="text-xs font-medium"
              style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
            >
              Base: {baseCurrency}
            </Text>
          </View>

          <View
            className="rounded-2xl p-4 overflow-hidden"
            style={{
              backgroundColor: colors.glassSurface,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            {exchangeRates
              .filter((r) => r.enabled)
              .map((rate, i) => (
                <View
                  key={rate.code}
                  className="flex-row items-center py-3"
                  style={{
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.glassBorder,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${colors.primary}1A` }}
                  >
                    <Text className="text-base font-bold" style={{ fontFamily: 'Inter', color: colors.primary }}>
                      {rate.symbol}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium" style={{ fontFamily: 'Inter', color: colors.onSurface }}>
                      {rate.code}
                    </Text>
                    <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
                      1 {rate.code} = {rate.rateToBase} {baseCurrency}
                    </Text>
                  </View>
                  <View
                    className="rounded-lg px-3 py-1.5 min-w-[80px]"
                    style={{ backgroundColor: `${colors.primary}14`, borderWidth: 1, borderColor: `${colors.primary}33` }}
                  >
                    {/* Simple rate display */}
                    <Text className="text-xs font-semibold text-right" style={{ fontFamily: 'Inter', color: colors.primary }}>
                      {rate.rateToBase}
                    </Text>
                  </View>
                </View>
              ))}

            {exchangeRates.filter((r) => r.enabled).length === 0 && (
              <View className="py-4 items-center">
                <Text style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant, fontSize: 13 }}>
                  No hay monedas habilitadas
                </Text>
              </View>
            )}
          </View>

          {/* Available but disabled currencies */}
          {exchangeRates.some((r) => !r.enabled) && (
            <View className="mt-3">
              <Text className="text-xs font-semibold mb-2" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
                Monedas disponibles
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {exchangeRates.filter((r) => !r.enabled).map((rate) => (
                  <Pressable
                    key={rate.code}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: colors.glassSurface,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                    }}
                    onPress={() => toggleCurrency(rate.code)}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text className="text-xs font-medium" style={{ fontFamily: 'Inter', color: colors.primary }}>
                      {rate.code}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Link to Stats ── */}
        <View className="mx-5 mt-2">
          <Pressable
            className="w-full py-3.5 rounded-full items-center flex-row justify-center gap-2"
            style={{ backgroundColor: `${colors.primary}1F`, borderWidth: 1, borderColor: `${colors.primary}33` }}
            onPress={() => router.push('/(tabs)/stats')}
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
