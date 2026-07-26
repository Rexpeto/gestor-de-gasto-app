import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react-native/icons";
import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

export type Trend = "up" | "down" | "same";

/**
 * Small arrow icon indicating trend direction.
 */
export function TrendBadge({ trend }: { trend: Trend }) {
    const colors = useThemeColors();
    const config = {
        up: { Icon: ArrowUpRight, color: colors.error },
        down: { Icon: ArrowDownRight, color: colors.primary },
        same: { Icon: Minus, color: colors.onSurfaceVariant },
    };
    const { Icon, color } = config[trend];
    return <Icon size={12} color={color} />;
}

/**
 * Returns a human-readable trend label.
 */
export function trendLabel(trend: Trend, pct: number): string {
    if (trend === "up") return `+${pct}% vs mes ant.`;
    if (trend === "down") return `-${pct}% vs mes ant.`;
    return "Igual vs mes ant.";
}

/**
 * Returns the color for a given trend.
 */
export function trendColor(
    trend: Trend,
    colors: ReturnType<typeof useThemeColors>,
): string {
    if (trend === "up") return colors.error;
    if (trend === "down") return colors.primary;
    return colors.onSurfaceVariant;
}
