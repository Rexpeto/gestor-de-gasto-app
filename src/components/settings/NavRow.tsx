import { ChevronRight } from "lucide-react-native/icons";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface NavRowProps {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
    subtitle: string;
    onPress: () => void;
}

/**
 * Navigation row with icon, label, subtitle, and chevron. Used in settings main screen.
 */
export function NavRow({ icon: Icon, label, subtitle, onPress }: NavRowProps) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                }}
            >
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${colors.primary}4D`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                    }}
                >
                    <Icon size={22} color={colors.onPrimary} />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 16,
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
                            lineHeight: 18,
                        }}
                    >
                        {subtitle}
                    </Text>
                </View>

                <ChevronRight size={20} color={colors.outline} />
            </View>
        </Pressable>
    );
}
