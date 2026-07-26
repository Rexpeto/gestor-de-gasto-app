import { ScrollView, Text, View } from "react-native";

import { usePreferencesStore } from "@/store/preferences-store";
import {
    ACCENT_COLOR_NAMES,
    ACCENT_COLORS,
    type AccentColorName,
    useThemeColors,
    useThemeStore,
} from "@/store/theme-store";

import { ColorCircle } from "@/components/settings/ColorCircle";
import { GlassCard } from "@/components/settings/GlassCard";
import { SectionTitle } from "@/components/settings/SectionTitle";
import { ThemeModePicker } from "@/components/settings/ThemeModePicker";
import { ToggleRow } from "@/components/settings/ToggleRow";

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT_OPTIONS: AccentColorName[] = [
    "blue", "pink", "purple", "green", "cyan", "orange",
];

// ── Screen ───────────────────────────────────────────────────────────────────

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

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 60,
            }}
        >
            {/* ── Theme Mode ── */}
            <GlassCard style={{ marginTop: 48, marginBottom: 16 }}>
                <SectionTitle label="Modo" />
                <ThemeModePicker
                    value={themeMode}
                    onChange={setThemeMode}
                />
            </GlassCard>

            {/* ── Accent Color ── */}
            <GlassCard style={{ marginBottom: 16 }}>
                <SectionTitle label="Color primario" />
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

            {/* ── Visible Sections ── */}
            <GlassCard>
                <SectionTitle label="Secciones visibles" />
                <View style={{ gap: 16 }}>
                    <ToggleRow
                        label="Categorías"
                        description={
                            showCategories
                                ? "Visible en el dashboard"
                                : "Oculto en el dashboard"
                        }
                        value={showCategories}
                        onValueChange={setShowCategories}
                        showDivider
                    />
                    <ToggleRow
                        label="Presupuesto"
                        description={
                            showPresupuesto
                                ? "Visible en el dashboard"
                                : "Oculto en el dashboard"
                        }
                        value={showPresupuesto}
                        onValueChange={setShowPresupuesto}
                        showDivider={false}
                    />
                </View>
            </GlassCard>
        </ScrollView>
    );
}
