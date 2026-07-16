import { Switch, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface ToggleRowProps {
    label: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    showDivider?: boolean;
}

/**
 * Switch toggle with label and description. Used in appearance settings.
 */
export function ToggleRow({
    label,
    description,
    value,
    onValueChange,
    showDivider = true,
}: ToggleRowProps) {
    const colors = useThemeColors();
    return (
        <>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 15,
                            fontWeight: "600",
                            color: colors.onSurface,
                            marginBottom: 2,
                        }}
                    >
                        {label}
                    </Text>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        {description}
                    </Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{
                        false: colors.outlineVariant,
                        true: colors.primary,
                    }}
                    thumbColor={colors.onPrimary}
                />
            </View>
            {showDivider && (
                <View
                    style={{
                        height: 1,
                        backgroundColor: colors.glassBorder,
                        marginTop: 16,
                    }}
                />
            )}
        </>
    );
}
