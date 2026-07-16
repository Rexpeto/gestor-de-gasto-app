import { router } from "expo-router";
import {
    ChevronRight,
    Database,
    Landmark,
    Palette,
    Tags,
} from "lucide-react-native/icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useThemeColors } from "@/store/theme-store";

// ─── Navigation Row ───────────────────────────────────────────────────────────

function NavRow({
    icon: Icon,
    label,
    subtitle,
    onPress,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
    subtitle: string;
    onPress: () => void;
}) {
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
                    <Icon size={22} color="#fff" />
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

function GlassCard({ children }: { children: React.ReactNode }) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                backgroundColor: colors.glassSurface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
                overflow: "hidden",
            }}
        >
            {children}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const colors = useThemeColors();

    const NAV_ITEMS: {
        icon: React.ComponentType<{ size?: number; color?: string }>;
        label: string;
        subtitle: string;
        route: string;
    }[] = [
        {
            icon: Palette,
            label: "Apariencia",
            subtitle: "Tema, colores y secciones visibles",
            route: "/apariencia",
        },
        {
            icon: Landmark,
            label: "Fiscal",
            subtitle: "Presupuesto mensual y tasas de cambio",
            route: "/fiscal",
        },
        {
            icon: Tags,
            label: "Categorías de Gastos",
            subtitle: "Administrar categorías de ingresos y gastos",
            route: "/categories",
        },
        {
            icon: Database,
            label: "Base de Datos",
            subtitle: "Restablecer, eliminar, exportar o importar datos",
            route: "/database",
        },
    ];

    return (
        <ScrollView
            className="flex-1"
            style={{ backgroundColor: colors.background }}
            contentContainerClassName="pb-28"
        >
            <View className="px-5 gap-5">
                {/* ── Title ── */}
                <View className="mt-12">
                    <Text
                        className="text-2xl font-bold"
                        style={{ fontFamily: "Inter", color: colors.onSurface }}
                    >
                        Configuración
                    </Text>
                    <Text
                        className="text-sm mt-1"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        Personaliza la app a tu gusto.
                    </Text>
                </View>

                {/* ── Navigation Cards ── */}
                <GlassCard>
                    {NAV_ITEMS.map((item, index) => (
                        <View key={item.route}>
                            {index > 0 && (
                                <View
                                    style={{
                                        height: 1,
                                        backgroundColor: colors.glassBorder,
                                        marginHorizontal: 16,
                                    }}
                                />
                            )}
                            <NavRow
                                icon={item.icon}
                                label={item.label}
                                subtitle={item.subtitle}
                                onPress={() => router.push(item.route as any)}
                            />
                        </View>
                    ))}
                </GlassCard>
            </View>
        </ScrollView>
    );
}
