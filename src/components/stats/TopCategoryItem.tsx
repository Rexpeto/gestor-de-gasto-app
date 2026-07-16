import { CategoryIcon } from "@/components/CategoryIcon";
import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import { TrendBadge, trendLabel, trendColor } from "./TrendBadge";
import type { Trend } from "./TrendBadge";

interface TopCategoryItemProps {
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    percentage: number;
}

/**
 * Single category row with icon, name, amount, progress bar, and trend.
 * Matches Stitch design: surface-container-low bg, subtle border, mono-data amounts.
 */
export function TopCategoryItem({
    categoryName,
    categoryIcon,
    categoryColor,
    total,
    percentage,
}: TopCategoryItemProps) {
    const colors = useThemeColors();

    const trend: Trend =
        percentage > 30 ? "up" : percentage < 15 ? "down" : "same";

    return (
        <View
            style={{
                backgroundColor: colors.surfaceContainer,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: `${colors.outlineVariant}05`,
            }}
        >
            {/* Icon circle */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${categoryColor}10`,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CategoryIcon
                    name={categoryIcon}
                    size={22}
                    color={categoryColor}
                />
            </View>

            {/* Content */}
            <View style={{ flex: 1, gap: 6 }}>
                {/* Name + Amount row */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                        {categoryName}
                    </Text>
                    <Text
                        style={{
                            fontFamily: "Geist",
                            fontSize: 14,
                            fontWeight: "500",
                            color: colors.onSurface,
                        }}
                    >
                        ${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                {/* Progress bar */}
                <View
                    style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.surfaceContainerHighest,
                        overflow: "hidden",
                    }}
                >
                    <View
                        style={{
                            height: "100%",
                            borderRadius: 3,
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: categoryColor,
                        }}
                    />
                </View>

                {/* Percentage + Trend row */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Geist",
                            fontSize: 12,
                            fontWeight: "600",
                            letterSpacing: 0.05,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        {percentage.toFixed(1)}% del presupuesto
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TrendBadge trend={trend} />
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 12,
                                color: trendColor(trend, colors),
                                marginLeft: 2,
                            }}
                        >
                            {trendLabel(trend, percentage)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
