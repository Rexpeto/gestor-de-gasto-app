import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Budget } from "@/store/budget-store";
import type { ThemeColors } from "@/store/theme-store";
import type { CategorySummary } from "@/types";
import { formatCurrency } from "@/utils/format";

const CURRENCY_SYMBOLS: Record<string, string> = {
    bsc: "$",
    eur: "€",
    usdt: "USDT",
    mixed: "USDT",
};

interface CategorySummaryListProps {
    title: string;
    categories: CategorySummary[];
    budgets: Budget[];
    colors: ThemeColors;
    delay?: number;
    type?: "income" | "expense";
}

export function CategorySummaryList({
    title,
    categories,
    budgets,
    colors,
    delay = 700,
    type = "expense",
}: CategorySummaryListProps) {
    if (categories.length === 0) return null;

    const accentColor = type === "income" ? colors.success : colors.primary;

    return (
        <AnimatedSection delay={delay} duration={600} style={{ marginTop: 28, marginBottom: type === "income" ? 0 : 32, paddingHorizontal: 20 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.onSurface,
                    }}
                >
                    {title}
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            fontWeight: "500",
                            color: accentColor,
                        }}
                    >
                        Ver todo
                    </Text>
                </Pressable>
            </View>

            <View
                style={{
                    backgroundColor: colors.glassSurface,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    borderRadius: 12,
                    padding: 16,
                    gap: 16,
                }}
            >
                {categories.map((cat, index) => {
                    const budget = budgets.find((b) => b.categoryId === cat.categoryId);
                    const hasBudget = budget != null && budget.enabled && budget.amount > 0;
                    const budgetPct = hasBudget
                        ? Math.min(Math.round((cat.total / budget.amount) * 100), 100)
                        : 0;
                    const isOver = hasBudget && cat.total > budget.amount;

                    return (
                        <AnimatedSection key={cat.categoryId} delay={delay + 100 + index * 120} duration={500} distance={16}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 9999,
                                        backgroundColor: (cat.categoryColor || accentColor) + "20",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CategoryIcon
                                        name={cat.categoryIcon}
                                        size={18}
                                        color={cat.categoryColor}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 14,
                                                fontWeight: "500",
                                                color: colors.onSurface,
                                            }}
                                        >
                                            {cat.categoryName}
                                        </Text>
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 14,
                                                fontWeight: "600",
                                                color: colors.onSurface,
                                            }}
                                        >
                                            {CURRENCY_SYMBOLS[cat.currency] ?? "$"} {formatCurrency(cat.total)}
                                        </Text>
                                    </View>

                                    <AnimatedProgressBar
                                        percentage={hasBudget ? budgetPct : cat.percentage}
                                        color={
                                            hasBudget
                                                ? isOver
                                                    ? colors.danger
                                                    : cat.categoryColor || accentColor
                                                : cat.categoryColor || accentColor
                                        }
                                        trackColor={colors.glassBorderStrong}
                                        delay={delay + 200 + index * 120}
                                        duration={700}
                                        height={6}
                                        radius={9999}
                                    />

                                    {hasBudget && (
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 11,
                                                fontWeight: "500",
                                                color: isOver ? colors.danger : colors.onSurfaceVariant,
                                                marginTop: 4,
                                            }}
                                        >
                                            {budgetPct}% del presupuesto
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </AnimatedSection>
                    );
                })}
            </View>
        </AnimatedSection>
    );
}
