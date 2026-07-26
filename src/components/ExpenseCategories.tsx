import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { ThemeColors } from "@/store/theme-store";
import type { CategorySummary } from "@/types";
import { formatCurrency } from "@/utils/format";

interface ExpenseCategoriesProps {
    categories: CategorySummary[];
    colors: ThemeColors;
}

export function ExpenseCategories({ categories, colors }: ExpenseCategoriesProps) {
    if (categories.length === 0) return null;

    return (
        <AnimatedSection delay={700} duration={600} style={{ marginTop: 28, paddingHorizontal: 20 }}>
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
                    Gastos por Categoría
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            fontWeight: "500",
                            color: colors.primary,
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
                {categories.map((cat, index) => (
                    <AnimatedSection key={cat.categoryId} delay={800 + index * 120} duration={500} distance={16}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            {/* Icon circle */}
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 9999,
                                    backgroundColor: (cat.categoryColor || "#6366f1") + "20",
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

                            {/* Name + amounts */}
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
                                        ${formatCurrency(cat.total)}
                                    </Text>
                                </View>

                                <AnimatedProgressBar
                                    percentage={cat.percentage}
                                    color={cat.categoryColor || colors.primary}
                                    trackColor={colors.glassBorderStrong}
                                    delay={900 + index * 120}
                                    duration={700}
                                    height={6}
                                    radius={9999}
                                />
                            </View>
                        </View>
                    </AnimatedSection>
                ))}
            </View>
        </AnimatedSection>
    );
}
