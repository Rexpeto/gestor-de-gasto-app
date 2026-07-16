import { Pressable, ScrollView, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

export type Period = "weekly" | "monthly" | "yearly";

const PERIODS: { key: Period; label: string }[] = [
    { key: "weekly", label: "Semanal" },
    { key: "monthly", label: "Mensual" },
    { key: "yearly", label: "Anual" },
];

interface PeriodPillsProps {
    selected: Period;
    onSelect: (period: Period) => void;
}

/**
 * Horizontal pill selector for time periods. Used in stats screen.
 */
export function PeriodPills({ selected, onSelect }: PeriodPillsProps) {
    const colors = useThemeColors();
    return (
        <View className="px-5 py-4">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
            >
                {PERIODS.map((p) => {
                    const active = selected === p.key;
                    return (
                        <Pressable
                            key={p.key}
                            className="py-2 px-5 rounded-full"
                            style={
                                active
                                    ? {
                                          backgroundColor: colors.primary,
                                          shadowColor: colors.primary,
                                          shadowOffset: { width: 0, height: 4 },
                                          shadowOpacity: 0.1,
                                          shadowRadius: 12,
                                          elevation: 8,
                                      }
                                    : {
                                          backgroundColor:
                                              colors.surfaceContainer,
                                          borderWidth: 1,
                                          borderColor:
                                              "rgba(186, 202, 197, 0.1)",
                                      }
                            }
                            onPress={() => onSelect(p.key)}
                        >
                            <Text
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    fontWeight: "600",
                                    color: active
                                        ? colors.background
                                        : colors.onSurfaceVariant,
                                }}
                            >
                                {p.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
