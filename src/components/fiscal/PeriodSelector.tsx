import { ChevronDown } from "lucide-react-native/icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { useThemeColors } from "@/store/theme-store";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const YEARS = ["2023", "2024", "2025", "2026", "2027"];

interface PeriodSelectorProps {
    selectedMonth: number;
    selectedYear: string;
    onMonthChange: (month: number) => void;
    onYearChange: (year: string) => void;
}

/**
 * Month + year period picker with dropdowns. Used in fiscal settings.
 */
export function PeriodSelector({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
}: PeriodSelectorProps) {
    const colors = useThemeColors();
    const [showMonth, setShowMonth] = useState(false);
    const [showYear, setShowYear] = useState(false);

    return (
        <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Month */}
            <View style={{ flex: 1, position: "relative" }}>
                <Pressable
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: colors.glassSurface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                    }}
                    onPress={() => {
                        setShowMonth(!showMonth);
                        setShowYear(false);
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            color: colors.onSurface,
                        }}
                    >
                        {MONTHS[selectedMonth]}
                    </Text>
                    <ChevronDown size={16} color={colors.outline} />
                </Pressable>
                {showMonth && (
                    <View
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            zIndex: 50,
                            borderRadius: 12,
                            overflow: "hidden",
                            backgroundColor: colors.surfaceContainer,
                            borderWidth: 1,
                            borderColor: colors.glassBorderStrong,
                        }}
                    >
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {MONTHS.map((m, i) => (
                                <Pressable
                                    key={i}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        backgroundColor:
                                            i === selectedMonth
                                                ? `${colors.primary}4D`
                                                : "transparent",
                                    }}
                                    onPress={() => {
                                        onMonthChange(i);
                                        setShowMonth(false);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 14,
                                            color:
                                                i === selectedMonth
                                                    ? colors.primary
                                                    : colors.onSurface,
                                        }}
                                    >
                                        {m}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Year */}
            <View style={{ position: "relative", width: 100 }}>
                <Pressable
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: colors.glassSurface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                    }}
                    onPress={() => {
                        setShowYear(!showYear);
                        setShowMonth(false);
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            color: colors.onSurface,
                        }}
                    >
                        {selectedYear}
                    </Text>
                    <ChevronDown size={16} color={colors.outline} />
                </Pressable>
                {showYear && (
                    <View
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            zIndex: 50,
                            borderRadius: 12,
                            overflow: "hidden",
                            backgroundColor: colors.surfaceContainer,
                            borderWidth: 1,
                            borderColor: colors.glassBorderStrong,
                        }}
                    >
                        {YEARS.map((y) => (
                            <Pressable
                                key={y}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    backgroundColor:
                                        y === selectedYear
                                            ? `${colors.primary}4D`
                                            : "transparent",
                                }}
                                onPress={() => {
                                    onYearChange(y);
                                    setShowYear(false);
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 14,
                                        color:
                                            y === selectedYear
                                                ? colors.primary
                                                : colors.onSurface,
                                    }}
                                >
                                    {y}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
