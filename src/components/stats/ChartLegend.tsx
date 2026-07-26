import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface LegendItem {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    percentage: number;
}

interface ChartLegendProps {
    items: LegendItem[];
    maxItems?: number;
}

/**
 * 3-column legend grid below the donut chart. Shows up to maxItems categories.
 */
export function ChartLegend({ items, maxItems = 6 }: ChartLegendProps) {
    const colors = useThemeColors();
    const visible = items.slice(0, maxItems);

    if (visible.length === 0) return null;

    return (
        <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
            {visible.map((cat) => (
                <View
                    key={cat.categoryId}
                    className="flex-row items-center"
                    style={{ width: "30%" }}
                >
                    <View
                        className="w-2.5 h-2.5 rounded-full mr-1.5"
                        style={{ backgroundColor: cat.categoryColor }}
                    />
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: "Inter",
                            fontSize: 11,
                            color: colors.onSurfaceVariant,
                            flex: 1,
                        }}
                    >
                        {cat.categoryName}
                    </Text>
                    <Text
                        style={{
                            fontFamily: "Geist",
                            fontSize: 11,
                            color: colors.onSurface,
                            fontWeight: "600",
                        }}
                    >
                        {cat.percentage.toFixed(0)}%
                    </Text>
                </View>
            ))}
        </View>
    );
}
