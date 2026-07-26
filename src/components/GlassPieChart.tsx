import { useThemeColors } from "@/store/theme-store";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { CategorySummary } from "@/types";

interface GlassPieChartProps {
    data: CategorySummary[];
    totalLabel?: string;
}

const SIZE = 192;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2; // 86
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GlassPieChart({ data, totalLabel }: GlassPieChartProps) {
    const colors = useThemeColors();
    const isEmpty = !data || data.length === 0;

    const total = (data ?? []).reduce((sum, d) => sum + d.total, 0);

    // Build ring segments with cumulative offset
    let cumulativePercent = 0;
    const segments = (data ?? []).map((item) => {
        const percent = total > 0 ? item.total / total : 0;
        const offset = cumulativePercent;
        cumulativePercent += percent;
        return {
            color: item.categoryColor,
            percent,
            offset,
            label: item.categoryName,
            percentage: item.percentage,
        };
    });

    if (isEmpty) {
        return (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text
                    style={{
                        fontFamily: "Inter",
                        color: colors.onSurfaceVariant,
                        fontSize: 14,
                    }}
                >
                    Sin datos este mes
                </Text>
            </View>
        );
    }

    return (
        <View style={{ alignItems: "center" }}>
            {/* Donut Ring Chart */}
            <View
                style={{
                    width: SIZE,
                    height: SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Svg width={SIZE} height={SIZE}>
                    {/* Background ring */}
                    <Circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth={STROKE_WIDTH}
                    />
                    {/* Colored segments */}
                    {segments.map((seg, i) => {
                        const dashLength = CIRCUMFERENCE * seg.percent;
                        const gapLength = CIRCUMFERENCE - dashLength;
                        const dashOffset = CIRCUMFERENCE * (0.25 - seg.offset); // -90° rotation
                        return (
                            <Circle
                                key={i}
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={STROKE_WIDTH}
                                strokeDasharray={`${dashLength} ${gapLength}`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </Svg>

                {/* Centered total */}
                <View
                    style={{
                        position: "absolute",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Geist",
                            color: colors.onSurface,
                            fontSize: 22,
                            fontWeight: "700",
                            lineHeight: 28,
                        }}
                    >
                        {`Bs ${total.toLocaleString("es-ES", {
                            minimumFractionDigits: 0,
                        })}`}
                    </Text>
                    <Text
                        style={{
                            fontFamily: "Geist",
                            color: colors.onSurfaceVariant,
                            fontSize: 11,
                            fontWeight: "600",
                            letterSpacing: 0.05,
                            textTransform: "uppercase",
                            marginTop: 2,
                        }}
                    >
                        {totalLabel ?? "Total"}
                    </Text>
                </View>
            </View>

            {/* 3-Column Legend Grid */}
            <View
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 16,
                    marginTop: 24,
                    width: "100%",
                }}
            >
                {segments.slice(0, 6).map((item, index) => (
                    <View
                        key={index}
                        style={{
                            alignItems: "center",
                            width: "30%",
                        }}
                    >
                        <View
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: item.color,
                                marginBottom: 4,
                                shadowColor: item.color,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        />
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: "Inter",
                                color: colors.onSurfaceVariant,
                                fontSize: 12,
                                marginBottom: 2,
                            }}
                        >
                            {item.label}
                        </Text>
                        <Text
                            style={{
                                fontFamily: "Geist",
                                color: colors.onSurface,
                                fontSize: 13,
                                fontWeight: "500",
                            }}
                        >
                            {item.percentage.toFixed(0)}%
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
