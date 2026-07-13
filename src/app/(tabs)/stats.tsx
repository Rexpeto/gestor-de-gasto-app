import { router } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react-native/icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GlassPieChart } from '@/components/GlassPieChart';
import { getMonthlySummary } from '@/db/database';
import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import { SafeAreaView } from 'react-native-safe-area-context';

type Period = 'weekly' | 'monthly' | 'yearly';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'yearly', label: 'Anual' },
];

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'same' }) {
  const config = {
    up: { Icon: ArrowUpRight, color: '#ffb4ab' },
    down: { Icon: ArrowDownRight, color: '#57f1db' },
    same: { Icon: Minus, color: '#bacac5' },
  };
  const { Icon, color } = config[trend];
  return <Icon size={12} color={color} />;
}

function trendLabel(trend: 'up' | 'down' | 'same', pct: number): string {
  if (trend === 'up') return `+${pct}% vs mes ant.`;
  if (trend === 'down') return `-${pct}% vs mes ant.`;
  return 'Igual vs mes ant.';
}

function trendColor(trend: 'up' | 'down' | 'same'): string {
  if (trend === 'up') return '#ffb4ab';
  if (trend === 'down') return '#57f1db';
  return '#bacac5';
}

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [lastMonthExpense, setLastMonthExpense] = useState<number | null>(null);

  const monthlySummary = useTransactionStore((s) => s.monthlySummary);
  const categorySummaries = useTransactionStore((s) => s.categorySummaries);
  const categories = useCategoryStore((s) => s.categories);

  const totalExpense = monthlySummary?.totalExpense ?? 0;

  useEffect(() => {
    (async () => {
      const now = new Date();
      let lm = now.getMonth(); // 0-indexed: current month (e.g. 6 = July)
      let ly = now.getFullYear();
      if (lm === 0) {
        lm = 12;
        ly -= 1;
      }
      const result = await getMonthlySummary(ly, lm);
      setLastMonthExpense(result.totalExpense);
    })();
  }, []);

  const expenseCategories = useMemo(
    () =>
      categorySummaries
        .filter(
          (c) =>
            c.total > 0 &&
            categories.find((cat) => cat.id === c.categoryId)?.type === 'expense',
        )
        .sort((a, b) => b.total - a.total),
    [categorySummaries, categories],
  );

  const percentChange = useMemo(() => {
    if (lastMonthExpense === null || lastMonthExpense === 0) return null;
    return Math.round(((totalExpense - lastMonthExpense) / lastMonthExpense) * 100);
  }, [totalExpense, lastMonthExpense]);

  const topCategories = expenseCategories.slice(0, 5);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0e1513' }} edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-28">
        {/* ── Period Selector Pills ── */}
        <View className="px-5 py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <Pressable
                  key={p.key}
                  className="py-2 px-5 rounded-full"
                  style={
                    active
                      ? {
                          backgroundColor: '#57f1db',
                          shadowColor: '#57f1db',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 12,
                          elevation: 8,
                        }
                      : {
                          backgroundColor: '#1a211f',
                          borderWidth: 1,
                          borderColor: 'rgba(186, 202, 197, 0.1)',
                        }
                  }
                  onPress={() => setPeriod(p.key)}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? '#0e1513' : '#bacac5',
                    }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Donut Chart Section ── */}
        <View
          className="mx-5 rounded-xl p-lg mb-4"
          style={{
            backgroundColor: 'rgba(26, 33, 31, 0.6)',
            borderWidth: 1,
            borderColor: 'rgba(186, 202, 197, 0.1)',
          }}
        >
          <Text
            className="text-xs font-semibold tracking-widest mb-4"
            style={{ fontFamily: 'Inter', color: '#bacac5', textTransform: 'uppercase' }}
          >
            Gastos del mes
          </Text>

          <GlassPieChart data={expenseCategories} />

          {/* ── 3-col Legend Grid ── */}
          {expenseCategories.length > 0 && (
            <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
              {expenseCategories.slice(0, 6).map((cat) => (
                <View
                  key={cat.categoryId}
                  className="flex-row items-center"
                  style={{ width: '30%' }}
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full mr-1.5"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: 'Inter', fontSize: 11, color: '#bacac5', flex: 1 }}
                  >
                    {cat.categoryName}
                  </Text>
                  <Text
                    style={{ fontFamily: 'Geist', fontSize: 11, color: '#dde4e1', fontWeight: '600' }}
                  >
                    {cat.percentage.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Comparative Summary ── */}
        <View className="flex-row mx-5 mb-4" style={{ gap: 12 }}>
          {/* Este mes */}
          <View
            className="flex-1 rounded-xl p-md"
            style={{
              backgroundColor: '#1a211f',
              borderWidth: 1,
              borderColor: 'rgba(186, 202, 197, 0.06)',
            }}
          >
            <Text
              className="text-xs font-medium mb-1"
              style={{ fontFamily: 'Inter', color: '#bacac5', textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Este mes
            </Text>
            <Text
              className="text-lg font-bold"
              style={{ fontFamily: 'Geist', color: '#dde4e1' }}
            >
              ${totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
            </Text>
            {percentChange !== null && (
              <View className="flex-row items-center mt-1">
                <TrendBadge trend={percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same'} />
                <Text
                  className="text-xs font-medium ml-1"
                  style={{ fontFamily: 'Inter', color: trendColor(percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same') }}
                >
                  {percentChange > 0 ? '+' : ''}{percentChange}%
                </Text>
              </View>
            )}
          </View>

          {/* Mes pasado */}
          <View
            className="flex-1 rounded-xl p-md"
            style={{
              backgroundColor: '#1a211f',
              borderWidth: 1,
              borderColor: 'rgba(186, 202, 197, 0.06)',
            }}
          >
            <Text
              className="text-xs font-medium mb-1"
              style={{ fontFamily: 'Inter', color: '#bacac5', textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Mes pasado
            </Text>
            <Text
              className="text-lg font-bold"
              style={{ fontFamily: 'Geist', color: '#859490' }}
            >
              {lastMonthExpense !== null
                ? `$${lastMonthExpense.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`
                : '—'}
            </Text>
          </View>
        </View>

        {/* ── Categorías Top ── */}
        <View className="mx-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: '#dde4e1' }}
            >
              Categorías Top
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/categories')}>
              <Text
                className="text-sm font-medium"
                style={{ fontFamily: 'Inter', color: '#57f1db' }}
              >
                Ver todas
              </Text>
            </Pressable>
          </View>

          {topCategories.map((cat) => {
            const pct = cat.percentage;
            const trend: 'up' | 'down' | 'same' = pct > 30 ? 'up' : pct < 15 ? 'down' : 'same';
            return (
              <View
                key={cat.categoryId}
                className="rounded-xl p-md mb-2"
                style={{
                  backgroundColor: '#161d1b',
                }}
              >
                <View className="flex-row items-center gap-3">
                  {/* Icon circle */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: cat.categoryColor + '20' }}
                  >
                    <Text style={{ fontSize: 22 }}>{cat.categoryIcon}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1" style={{ gap: 6 }}>
                    {/* Name + Amount row */}
                    <View className="flex-row justify-between items-center">
                      <Text
                        className="text-sm font-medium"
                        style={{ fontFamily: 'Inter', color: '#dde4e1' }}
                      >
                        {cat.categoryName}
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'Geist', color: '#dde4e1' }}
                      >
                        ${cat.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>

                    {/* Progress bar */}
                    <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2f3634' }}>
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: cat.categoryColor,
                        }}
                      />
                    </View>

                    {/* Percentage + Trend row */}
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-xs"
                        style={{ fontFamily: 'Inter', color: '#bacac5' }}
                      >
                        {pct.toFixed(1)}% del presupuesto
                      </Text>
                      <View className="flex-row items-center">
                        <TrendBadge trend={trend} />
                        <Text
                          className="text-xs ml-1"
                          style={{ fontFamily: 'Inter', color: trendColor(trend) }}
                        >
                          {trendLabel(trend, pct)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
