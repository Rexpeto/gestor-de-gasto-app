import { View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface GlassCardProps {
    children: React.ReactNode;
    style?: object;
}

/**
 * Themed glass card with border. Reusable across settings screens.
 */
export function GlassCard({ children, style }: GlassCardProps) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                backgroundColor: colors.glassSurface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
                padding: 20,
                ...style,
            }}
        >
            {children}
        </View>
    );
}
