import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import type { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
    icon: LucideIcon;
    message: string;
    iconSize?: number;
}

/**
 * Generic empty state with centered icon and message. Reusable across screens.
 */
export function EmptyState({
    icon: Icon,
    message,
    iconSize = 48,
}: EmptyStateProps) {
    const colors = useThemeColors();
    return (
        <View style={{ alignItems: "center", marginTop: 64 }}>
            <Icon size={iconSize} color={colors.onSurfaceVariant} />
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 15,
                    color: colors.onSurfaceVariant,
                    marginTop: 12,
                }}
            >
                {message}
            </Text>
        </View>
    );
}
