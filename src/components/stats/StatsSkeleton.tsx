import { View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import { Skeleton } from "@/components/Skeleton";

/**
 * Full skeleton for the Stats screen — replaces chart, comparison cards, and top categories.
 */
export function StatsSkeleton() {
    const colors = useThemeColors();

    return (
        <View style={{ flex: 1 }}>
            {/* Chart card skeleton */}
            <View
                style={{
                    marginHorizontal: 20,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    backgroundColor: colors.glassSurface,
                    borderWidth: 1,
                    borderColor: "rgba(186, 202, 197, 0.1)",
                }}
            >
                {/* Title */}
                <Skeleton width={130} height={12} borderRadius={4} style={{ marginBottom: 16 }} />

                {/* Donut ring */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                    <Skeleton width={160} height={160} borderRadius={80} />
                </View>

                {/* Legend items */}
                <View style={{ gap: 8 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Skeleton width={10} height={10} borderRadius={5} />
                            <Skeleton width={80 + i * 15} height={12} borderRadius={4} />
                            <View style={{ flex: 1 }} />
                            <Skeleton width={50} height={12} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Comparison cards skeleton */}
            <View style={{ flexDirection: "row", marginHorizontal: 20, gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: colors.surfaceContainer, borderRadius: 12, padding: 16 }}>
                    <Skeleton width={70} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={22} borderRadius={6} />
                </View>
                <View style={{ flex: 1, backgroundColor: colors.surfaceContainer, borderRadius: 12, padding: 16 }}>
                    <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width="70%" height={22} borderRadius={6} />
                </View>
            </View>

            {/* Top categories skeleton */}
            <View style={{ marginHorizontal: 20 }}>
                <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                {Array.from({ length: 5 }).map((_, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            paddingVertical: 10,
                        }}
                    >
                        <Skeleton width={36} height={36} borderRadius={10} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <Skeleton width={`${60 + i * 5}%`} height={13} borderRadius={4} />
                            <Skeleton width="100%" height={6} borderRadius={3} />
                        </View>
                        <Skeleton width={45} height={13} borderRadius={4} />
                    </View>
                ))}
            </View>
        </View>
    );
}
