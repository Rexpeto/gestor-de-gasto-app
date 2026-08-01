import { router } from "expo-router";
import { CircleDollarSign, Database, Landmark, Palette, Tags } from "lucide-react-native/icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";

import { GlassCard } from "@/components/settings/GlassCard";
import { NavRow } from "@/components/settings/NavRow";
import { useThemeColors } from "@/store/theme-store";

const REXPETO_AVATAR = require("../../../assets/images/rexpeto.jpg");
const APP_VERSION = "1.2.0";

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
        icon: CircleDollarSign,
        label: "Presupuesto",
        subtitle: "Configurar límites mensuales por categoría",
        route: "/budget",
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
            style={{ flex: 1, backgroundColor: colors.background, paddingBottom: 42 }}
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

                {/* ── Avatar & Credits ── */}
                <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
                    <Image
                        source={REXPETO_AVATAR}
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 9999,
                            borderWidth: 2,
                            borderColor: colors.glassBorderStrong,
                        }}
                        contentFit="cover"
                        transition={200}
                    />
                    <Pressable
                        onPress={() =>
                            Linking.openURL("https://www.github.com/rexpeto")
                        }
                    >
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.primary,
                            }}
                        >
                            Rexpeto
                        </Text>
                    </Pressable>
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 12,
                            color: colors.onSurfaceVariant,
                            opacity: 0.6,
                        }}
                    >
                        v{APP_VERSION}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
