import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { GlassPieChart } from "@/components/GlassPieChart";
import { ChartLegend } from "@/components/stats/ChartLegend";
import { ComparisonCards } from "@/components/stats/ComparisonCards";
import type { Period } from "@/components/stats/PeriodPills";
import { PeriodPills } from "@/components/stats/PeriodPills";
import { TopCategoryItem } from "@/components/stats/TopCategoryItem";
import * as db from "@/db/database";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useThemeColors } from "@/store/theme-store";
import type { Transaction } from "@/types";

// ── Date range helpers ──────────────────────────────────────────────────────

function toStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getWeekRange(offset: number) {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toStr(monday), end: toStr(sunday) };
}

function getMonthRange(offset: number) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = toStr(d);
    const end = toStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return { start, end };
}

function getYearRange(offset: number) {
    const now = new Date();
    const year = now.getFullYear() + offset;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function getDateRange(period: Period, offset: number) {
    switch (period) {
        case "weekly":
            return getWeekRange(offset);
        case "monthly":
            return getMonthRange(offset);
        case "yearly":
            return getYearRange(offset);
    }
}

function getPeriodLabels(period: Period) {
    switch (period) {
        case "weekly":
            return { current: "Esta semana", previous: "Semana pasada", title: "Gastos de la semana" };
        case "monthly":
            return { current: "Este mes", previous: "Mes pasado", title: "Gastos del mes" };
        case "yearly":
            return { current: "Este año", previous: "Año pasado", title: "Gastos del año" };
    }
}

// ── Compute totals & category summaries from raw transactions ────────────────

function computeTotalExpense(transactions: Transaction[]) {
    return transactions.reduce((sum, tx) => sum + tx.priceCalculated, 0);
}

function computeCategorySummaries(
    transactions: Transaction[],
    categories: { id: number; name: string; icon: string; color: string; type: string }[],
) {
    const expenseTxs = transactions.filter((tx) => tx.type === "expense");
    const totalExpense = expenseTxs.reduce((sum, tx) => sum + tx.priceCalculated, 0);

    const map = new Map<number, { total: number; name: string; icon: string; color: string }>();
    for (const tx of expenseTxs) {
        const existing = map.get(tx.categoryId);
        if (existing) {
            existing.total += tx.priceCalculated;
        } else {
            const cat = categories.find((c) => c.id === tx.categoryId);
            if (cat) {
                map.set(tx.categoryId, {
                    total: tx.priceCalculated,
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                });
            }
        }
    }

    return Array.from(map.entries())
        .map(([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            categoryIcon: data.icon,
            categoryColor: data.color,
            total: data.total,
            percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
}

// ── Screen ──────────────────────────────────────────────────────────────────

type CategorySummary = {
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    percentage: number;
};

export default function StatsScreen() {
    const colors = useThemeColors();
    const [period, setPeriod] = useState<Period>("monthly");
    const [loading, setLoading] = useState(true);
    const [currentTotal, setCurrentTotal] = useState(0);
    const [previousTotal, setPreviousTotal] = useState<number | null>(null);
    const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);

    const categories = useCategoryStore((s) => s.categories);
    const showCategories = usePreferencesStore((s) => s.showCategories);

    const fetchData = useCallback(
        async (p: Period) => {
            setLoading(true);
            const current = getDateRange(p, 0);
            const previous = getDateRange(p, -1);

            const [currentTxs, previousTxs] = await Promise.all([
                db.getTransactionsByDateRange(current.start, current.end),
                db.getTransactionsByDateRange(previous.start, previous.end),
            ]);

            setCurrentTotal(computeTotalExpense(currentTxs));
            setPreviousTotal(computeTotalExpense(previousTxs));
            setCategorySummaries(computeCategorySummaries(currentTxs, categories));
            setLoading(false);
        },
        [categories],
    );

    useEffect(() => {
        fetchData(period);
    }, [period, fetchData]);

    const handlePeriodChange = useCallback(
        (p: Period) => {
            if (p !== period) setPeriod(p);
        },
        [period],
    );

    const percentChange = useMemo(() => {
        if (previousTotal === null || previousTotal === 0) return null;
        return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    }, [currentTotal, previousTotal]);

    const labels = getPeriodLabels(period);
    const topCategories = categorySummaries.slice(0, 5);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.background,
                paddingTop: 10,
            }}
        >
            <ScrollView
                style={{ flex: 1, paddingTop: 20, paddingBottom: 42 }}
                contentContainerStyle={{ paddingBottom: 112 }}
            >
                {/* Period Selector */}
                <PeriodPills selected={period} onSelect={handlePeriodChange} />

                {loading ? null : (
                    <Animated.View key={period} entering={FadeIn.duration(350)} style={{ gap: 4 }}>
                        {/* Donut Chart Section */}
                        <View
                            className="mx-5 rounded-xl p-lg mb-4"
                            style={{
                                backgroundColor: colors.glassSurface,
                                borderWidth: 1,
                                borderColor: "rgba(186, 202, 197, 0.1)",
                            }}
                        >
                            <Text
                                className="text-xs font-semibold tracking-widest mb-4"
                                style={{
                                    fontFamily: "Inter",
                                    color: colors.onSurfaceVariant,
                                    textTransform: "uppercase",
                                }}
                            >
                                {labels.title}
                            </Text>

                            <GlassPieChart data={categorySummaries} />

                            <ChartLegend items={categorySummaries} />
                        </View>

                        {/* Comparative Summary */}
                        <ComparisonCards
                            thisPeriod={currentTotal}
                            lastPeriod={previousTotal}
                            percentChange={percentChange}
                            currentLabel={labels.current}
                            previousLabel={labels.previous}
                        />

                        {/* Top Categories */}
                        <View className="mx-5">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text
                                    className="text-base font-semibold"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurface,
                                    }}
                                >
                                    Categorías Top
                                </Text>
                                {showCategories && (
                                    <Pressable
                                        onPress={() => router.push("/categories")}
                                    >
                                        <Text
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: "Inter",
                                                color: colors.primary,
                                            }}
                                        >
                                            Ver todas
                                        </Text>
                                    </Pressable>
                                )}
                            </View>

                            {topCategories.map((cat) => (
                                <TopCategoryItem
                                    key={cat.categoryId}
                                    categoryName={cat.categoryName}
                                    categoryIcon={cat.categoryIcon}
                                    categoryColor={cat.categoryColor}
                                    total={cat.total}
                                    percentage={cat.percentage}
                                />
                            ))}
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}
