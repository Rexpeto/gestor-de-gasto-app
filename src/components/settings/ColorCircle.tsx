import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface ColorCircleProps {
    color: string;
    selected: boolean;
    onPress: () => void;
    label: string;
}

/**
 * Accent color picker circle with label. Used in appearance settings.
 */
export function ColorCircle({ color, selected, onPress, label }: ColorCircleProps) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={{ alignItems: "center", width: 52 }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: color,
                    borderWidth: selected ? 3 : 0,
                    borderColor: colors.onPrimary,
                    shadowColor: selected ? color : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: selected ? 0.8 : 0,
                    shadowRadius: 10,
                    elevation: selected ? 6 : 0,
                    marginBottom: 4,
                }}
            />
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 11,
                    color: selected ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: selected ? "600" : "400",
                }}
            >
                {label}
            </Text>
        </Pressable>
    );
}
