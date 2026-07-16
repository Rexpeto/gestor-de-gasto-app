import { Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface RateInputRowProps {
    label: string;
    subtitle: string;
    value: string;
    onChangeText: (text: string) => void;
    highlighted?: boolean;
}

/**
 * Labeled rate input row with title and subtitle. Used in fiscal settings.
 */
export function RateInputRow({
    label,
    subtitle,
    value,
    onChangeText,
    highlighted = false,
}: RateInputRowProps) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: highlighted ? `${colors.primary}4D` : colors.glassBorder,
                ...(highlighted
                    ? { borderLeftWidth: 3, borderLeftColor: `${colors.primary}99` }
                    : {}),
            }}
        >
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: "500",
                        color: colors.onSurface,
                    }}
                >
                    {label}
                </Text>
                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 12,
                        color: colors.outline,
                    }}
                >
                    {subtitle}
                </Text>
            </View>
            <TextInput
                style={{
                    fontFamily: "Geist",
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.onSurface,
                    width: 80,
                    textAlign: "right",
                }}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChangeText}
                placeholder="0.00"
                placeholderTextColor={colors.outline}
            />
        </View>
    );
}
