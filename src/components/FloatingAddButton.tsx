import { Pressable } from "react-native";
import { Plus } from "lucide-react-native/icons";
import { useThemeColors } from "@/store/theme-store";
import type { LucideIcon } from "lucide-react-native";

interface FloatingAddButtonProps {
    onPress: () => void;
    icon?: LucideIcon;
}

/**
 * Floating action button (bottom-right). Reusable across screens.
 */
export function FloatingAddButton({
    onPress,
    icon: Icon = Plus,
}: FloatingAddButtonProps) {
    const colors = useThemeColors();
    return (
        <Pressable
            style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
                zIndex: 30,
            }}
            onPress={onPress}
        >
            <Icon size={24} color={colors.onPrimary} strokeWidth={2.5} />
        </Pressable>
    );
}
