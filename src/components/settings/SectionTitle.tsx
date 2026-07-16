import { Text } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface SectionTitleProps {
    label: string;
    /** Override text color (defaults to primary with opacity) */
    color?: string;
}

/**
 * Uppercase section title. Reusable across settings screens.
 */
export function SectionTitle({ label, color }: SectionTitleProps) {
    const colors = useThemeColors();
    return (
        <Text
            style={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 0.05,
                textTransform: "uppercase",
                color: color ?? `${colors.primary}D9`,
                marginBottom: 12,
            }}
        >
            {label}
        </Text>
    );
}
