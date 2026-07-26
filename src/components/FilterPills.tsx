import { Pressable, ScrollView, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface FilterOption {
    key: string;
    label: string;
}

interface FilterPillsProps {
    filters: FilterOption[];
    activeFilter: string;
    onFilterChange: (key: string) => void;
}

/**
 * Horizontally scrollable filter pills. Reusable across screens.
 */
export function FilterPills({
    filters,
    activeFilter,
    onFilterChange,
}: FilterPillsProps) {
    const colors = useThemeColors();
    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
            >
                <View style={{ flexDirection: "row", gap: 12 }}>
                    {filters.map((f) => {
                        const active = activeFilter === f.key;
                        return (
                            <Pressable
                                key={f.key}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: active
                                        ? colors.primary
                                        : colors.surfaceContainer,
                                    borderWidth: active ? 0 : 1,
                                    borderColor: colors.outlineVariant,
                                    ...(active
                                        ? {
                                              shadowColor: colors.primary,
                                              shadowOffset: {
                                                  width: 0,
                                                  height: 4,
                                              },
                                              shadowOpacity: 0.25,
                                              shadowRadius: 8,
                                          }
                                        : {}),
                                }}
                                onPress={() => onFilterChange(f.key)}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: active
                                            ? colors.onPrimary
                                            : colors.onSurfaceVariant,
                                    }}
                                >
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
