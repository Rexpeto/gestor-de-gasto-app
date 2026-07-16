import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import { TrendBadge, trendColor } from "./TrendBadge";
import type { Trend } from "./TrendBadge";

interface ComparisonCardsProps {
    thisMonth: number;
    lastMonth: number | null;
    percentChange: number | null;
}

/**
 * Two side-by-side summary cards: "Este mes" vs "Mes pasado" with trend indicator.
 * Matches Stitch design: surface-container bg, subtle border, mono-data amounts.
 */
export function ComparisonCards({
    thisMonth,
    lastMonth,
    percentChange,
}: ComparisonCardsProps) {
    const colors = useThemeColors();

    const trend: Trend =
        percentChange !== null
            ? percentChange > 0
                ? "up"
                : percentChange < 0
                  ? "down"
                  : "same"
            : "same";

    return (
        <View style={{ flexDirection: "row", marginHorizontal: 20, gap: 12, marginBottom: 16 }}>
            {/* Este mes */}
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surfaceContainer,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: `${colors.outlineVariant}10`,
                }}
            >
                <Text
                    style={{
                        fontFamily: "Geist",
                        fontSize: 11,
                        fontWeight: "600",
                        letterSpacing: 0.05,
                        textTransform: "uppercase",
                        color: colors.onSurfaceVariant,
                    }}
                >
                    Este mes
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                    <Text
                        style={{
                            fontFamily: "Geist",
                            fontSize: 20,
                            fontWeight: "600",
                            color: colors.onSurface,
                        }}
                    >
                        ${thisMonth.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                    </Text>
                    {percentChange !== null && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TrendBadge trend={trend} />
                            <Text
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 14,
                                    fontWeight: "500",
                                    color: trendColor(trend, colors),
                                    marginLeft: 2,
                                }}
                            >
                                {percentChange > 0 ? "+" : ""}
                                {percentChange}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Mes pasado */}
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surfaceContainer,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: `${colors.outlineVariant}10`,
                }}
            >
                <Text
                    style={{
                        fontFamily: "Geist",
                        fontSize: 11,
                        fontWeight: "600",
                        letterSpacing: 0.05,
                        textTransform: "uppercase",
                        color: colors.onSurfaceVariant,
                    }}
                >
                    Mes pasado
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6 }}>
                    <Text
                        style={{
                            fontFamily: "Geist",
                            fontSize: 20,
                            fontWeight: "600",
                            color: colors.onSurface,
                        }}
                    >
                        {lastMonth !== null
                            ? `$${lastMonth.toLocaleString("es-ES", { minimumFractionDigits: 0 })}`
                            : "—"}
                    </Text>
                </View>
            </View>
        </View>
    );
}
