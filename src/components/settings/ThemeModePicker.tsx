import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import type { ThemeMode } from "@/store/theme-store";

interface ThemeModePickerProps {
    value: ThemeMode;
    onChange: (mode: ThemeMode) => void;
}

const OPTIONS: { key: ThemeMode; label: string }[] = [
    { key: "system", label: "Sistema" },
    { key: "light", label: "Claro" },
    { key: "dark", label: "Oscuro" },
];

/**
 * Segmented control for theme mode selection. Used in appearance settings.
 */
export function ThemeModePicker({ value, onChange }: ThemeModePickerProps) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                flexDirection: "row",
                backgroundColor: colors.surfaceContainerHighest,
                borderRadius: 12,
                padding: 3,
            }}
        >
            {OPTIONS.map((opt) => (
                <Pressable
                    key={opt.key}
                    onPress={() => onChange(opt.key)}
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor:
                            value === opt.key ? colors.primary : "transparent",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                                value === opt.key
                                    ? colors.onPrimary
                                    : colors.onSurfaceVariant,
                        }}
                    >
                        {opt.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}
