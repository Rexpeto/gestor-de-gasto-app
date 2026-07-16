import { router } from "expo-router";
import { Database, Landmark, Palette, Tags } from "lucide-react-native/icons";
import { ScrollView, Text, View } from "react-native";

import { GlassCard } from "@/components/settings/GlassCard";
import { NavRow } from "@/components/settings/NavRow";
import { useThemeColors } from "@/store/theme-store";

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const colors = useThemeColors();

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ paddingBottom: 112 }}
        >
            <View style={{ paddingHorizontal: 20, gap: 20 }}>
                {/* ── Title ── */}
                <View style={{ marginTop: 48 }}>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 24,
                            fontWeight: "700",
                            color: colors.onSurface,
                        }}
                    >
                        Configuración
                    </Text>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            color: colors.onSurfaceVariant,
                            marginTop: 4,
                        }}
                    >
                        Personaliza la app a tu gusto.
                    </Text>
                </View>

                {/* ── Navigation Cards ── */}
                <GlassCard style={{ padding: 0 }}>
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
                                onPress={() =>
                                    router.push(item.route as any)
                                }
                            />
                        </View>
                    ))}
                </GlassCard>
            </View>
        </ScrollView>
    );
}
