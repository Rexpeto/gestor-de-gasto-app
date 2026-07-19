import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { GlassPieChart } from "@/components/GlassPieChart";
import { ChartLegend } from "@/components/stats/ChartLegend";
import { ComparisonCards } from "@/components/stats/ComparisonCards";
import type { Period } from "@/components/stats/PeriodPills";
import { PeriodPills } from "@/components/stats/PeriodPills";
import { TopCategoryItem } from "@/components/stats/TopCategoryItem";
import * as db from "@/db/database";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import { toBsEquivalent } from "@/utils/currency";

export default function StatsScreen() {
    const colors = useThemeColors();
    const [period, setPeriod] = useState<Period>("monthly");
    const [lastMonthExpense, setLastMonthExpense] = useState<number | null>(
        null,
    );

    const monthlySummary = useTransactionStore((s) => s.monthlySummary);
    const categorySummaries = useTransactionStore((s) => s.categorySummaries);
    const categories = useCategoryStore((s) => s.categories);
    const showCategories = usePreferencesStore((s) => s.showCategories);

    const totalExpense = monthlySummary?.totalExpense ?? 0;

    useEffect(() => {
        (async () => {
            const now = new Date();
            let lm = now.getMonth() + 1; // 1-indexed
            let ly = now.getFullYear();
            if (lm === 1) {
                lm = 12;
                ly -= 1;
            } else {
                lm -= 1;
            }
            // Fetch last month's transactions and convert to Bs equivalent
            const txs = await db.getTransactionsByMonth(ly, lm);
            // Rate store uses 0-indexed months, but lm is 1-indexed
            const rates = useRateStore.getState().getRates(lm - 1, ly);
            let total = 0;
            for (const tx of txs) {
                const bsAmount = toBsEquivalent(
                    tx.amount,
                    tx.currency,
                    rates,
                );
                total += bsAmount;
            }
            setLastMonthExpense(total);
        })();
    }, []);

    const expenseCategories = useMemo(
        () =>
            categorySummaries
                .filter(
                    (c) =>
                        c.total > 0 &&
                        categories.find((cat) => cat.id === c.categoryId)
                            ?.type === "expense",
                )
                .sort((a, b) => b.total - a.total),
        [categorySummaries, categories],
    );

    const percentChange = useMemo(() => {
        if (lastMonthExpense === null || lastMonthExpense === 0) return null;
        return Math.round(
            ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100,
        );
    }, [totalExpense, lastMonthExpense]);

    const topCategories = expenseCategories.slice(0, 5);

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
                <PeriodPills selected={period} onSelect={setPeriod} />

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
                        Gastos del mes
                    </Text>

                    <GlassPieChart data={expenseCategories} />

                    <ChartLegend items={expenseCategories} />
                </View>

                {/* Comparative Summary */}
                <ComparisonCards
                    thisMonth={totalExpense}
                    lastMonth={lastMonthExpense}
                    percentChange={percentChange}
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
            </ScrollView>
        </View>
    );
}
