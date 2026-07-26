import { Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface ConversionLine {
    label: string;
    value: string;
    highlighted?: boolean;
}

interface ConversionSummaryProps {
    title: string;
    lines: ConversionLine[];
}

/**
 * Conversion summary card with labeled value rows. Used in fiscal settings.
 */
export function ConversionSummary({ title, lines }: ConversionSummaryProps) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                borderRadius: 12,
                padding: 16,
                backgroundColor: colors.glassOverlay,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
            }}
        >
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    fontWeight: "600",
                    letterSpacing: 0.05,
                    textTransform: "uppercase",
                    color: colors.onSurfaceVariant,
                    marginBottom: 12,
                }}
            >
                {title}
            </Text>
            <View>
                {lines.map((line, i) => (
                    <View
                        key={line.label}
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 8,
                            borderBottomWidth:
                                i < lines.length - 1 ? 1 : 0,
                            borderBottomColor: colors.glassBorder,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 14,
                                color: colors.onSurfaceVariant,
                            }}
                        >
                            {line.label}
                        </Text>
                        <Text
                            style={{
                                fontFamily: "Geist",
                                fontSize: 14,
                                fontWeight: "600",
                                color: line.highlighted
                                    ? colors.primary
                                    : colors.onSurface,
                            }}
                        >
                            {line.value}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
