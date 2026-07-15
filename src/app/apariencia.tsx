import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import { usePreferencesStore } from "@/store/preferences-store";
import {
    ACCENT_COLOR_NAMES,
    ACCENT_COLORS,
    type AccentColorName,
    useThemeColors,
    useThemeStore,
} from "@/store/theme-store";

const ACCENT_OPTIONS: AccentColorName[] = [
    "blue",
    "pink",
    "purple",
    "green",
    "cyan",
    "orange",
];

function ColorCircle({
    color,
    selected,
    onPress,
    label,
}: {
    color: string;
    selected: boolean;
    onPress: () => void;
    label: string;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={{ alignItems: "center", width: 52 }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: color,
                    borderWidth: selected ? 3 : 0,
                    borderColor: "#ffffff",
                    shadowColor: selected ? color : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: selected ? 0.8 : 0,
                    shadowRadius: 10,
                    elevation: selected ? 6 : 0,
                    marginBottom: 4,
                }}
            />
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 11,
                    color: selected ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: selected ? "600" : "400",
                }}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function SectionTitle({
    label,
    colors,
}: {
    label: string;
    colors: ReturnType<typeof useThemeColors>;
}) {
    return (
        <Text
            style={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 0.05,
                textTransform: "uppercase",
                color: `${colors.primary}D9`,
                marginBottom: 12,
            }}
        >
            {label}
        </Text>
    );
}

function GlassCard({
    children,
    colors,
    style,
}: {
    children: React.ReactNode;
    colors: ReturnType<typeof useThemeColors>;
    style?: any;
}) {
    return (
        <View
            style={{
                backgroundColor: colors.glassSurface ?? colors.surfaceContainer,
                borderRadius: 12,
                borderWidth: 1,
                borderColor:
                    colors.glassBorderStrong ?? `${colors.outlineVariant}99`,
                padding: 20,
                ...style,
            }}
        >
            {children}
        </View>
    );
}

export default function AparienciaScreen() {
    const colors = useThemeColors();
    const themeMode = useThemeStore((s) => s.mode);
    const setThemeMode = useThemeStore((s) => s.setMode);
    const primaryAccent = useThemeStore((s) => s.primaryAccent);
    const setPrimaryAccent = useThemeStore((s) => s.setPrimaryAccent);

    const showCategories = usePreferencesStore((s) => s.showCategories);
    const setShowCategories = usePreferencesStore((s) => s.setShowCategories);
    const showPresupuesto = usePreferencesStore((s) => s.showPresupuesto);
    const setShowPresupuesto = usePreferencesStore((s) => s.setShowPresupuesto);

    const THEME_OPTIONS: { key: typeof themeMode; label: string }[] = [
        { key: "system", label: "Sistema" },
        { key: "light", label: "Claro" },
        { key: "dark", label: "Oscuro" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 60,
                }}
            >
                {/* ── Modo ── */}
                <GlassCard colors={colors} style={{ marginBottom: 16 }}>
                    <SectionTitle label="Modo" colors={colors} />
                    <View
                        style={{
                            flexDirection: "row",
                            backgroundColor: colors.surfaceContainerHighest,
                            borderRadius: 12,
                            padding: 3,
                        }}
                    >
                        {THEME_OPTIONS.map((opt) => (
                            <Pressable
                                key={opt.key}
                                onPress={() => setThemeMode(opt.key)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    backgroundColor:
                                        themeMode === opt.key
                                            ? colors.primary
                                            : "transparent",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color:
                                            themeMode === opt.key
                                                ? colors.onPrimary
                                                : colors.onSurfaceVariant,
                                    }}
                                >
                                    {opt.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </GlassCard>

                {/* ── Color primario ── */}
                <GlassCard colors={colors} style={{ marginBottom: 16 }}>
                    <SectionTitle label="Color primario" colors={colors} />
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                        }}
                    >
                        {ACCENT_OPTIONS.map((name) => (
                            <ColorCircle
                                key={name}
                                color={ACCENT_COLORS[name]}
                                selected={primaryAccent === name}
                                onPress={() => setPrimaryAccent(name)}
                                label={ACCENT_COLOR_NAMES[name]}
                            />
                        ))}
                    </View>
                </GlassCard>

                {/* ── Secciones Visibles ── */}
                <GlassCard colors={colors}>
                    <SectionTitle label="Secciones visibles" colors={colors} />

                    <View style={{ gap: 16 }}>
                        {/* Categorías */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 15,
                                        fontWeight: "600",
                                        color: colors.onSurface,
                                        marginBottom: 2,
                                    }}
                                >
                                    Categorías
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: colors.onSurfaceVariant,
                                    }}
                                >
                                    {showCategories
                                        ? "Visible en el dashboard"
                                        : "Oculto en el dashboard"}
                                </Text>
                            </View>
                            <Switch
                                value={showCategories}
                                onValueChange={setShowCategories}
                                trackColor={{
                                    false: colors.outlineVariant,
                                    true: colors.primary,
                                }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View
                            style={{
                                height: 1,
                                backgroundColor: colors.glassBorder,
                            }}
                        />

                        {/* Presupuesto */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 15,
                                        fontWeight: "600",
                                        color: colors.onSurface,
                                        marginBottom: 2,
                                    }}
                                >
                                    Presupuesto
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: colors.onSurfaceVariant,
                                    }}
                                >
                                    {showPresupuesto
                                        ? "Visible en el dashboard"
                                        : "Oculto en el dashboard"}
                                </Text>
                            </View>
                            <Switch
                                value={showPresupuesto}
                                onValueChange={setShowPresupuesto}
                                trackColor={{
                                    false: colors.outlineVariant,
                                    true: colors.primary,
                                }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
}
