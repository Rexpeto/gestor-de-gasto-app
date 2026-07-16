import { Save } from "lucide-react-native/icons";
import { Pressable, Text } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface SaveButtonProps {
    onPress: () => void;
}

/**
 * Themed save button. Used in fiscal settings.
 */
export function SaveButton({ onPress }: SaveButtonProps) {
    const colors = useThemeColors();
    return (
        <Pressable
            style={{
                paddingVertical: 16,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                backgroundColor: `${colors.primary}4D`,
                borderWidth: 1,
                borderColor: `${colors.primary}66`,
            }}
            onPress={onPress}
        >
            <Save size={20} color={colors.primary} />
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.primary,
                }}
            >
                Guardar configuración
            </Text>
        </Pressable>
    );
}
