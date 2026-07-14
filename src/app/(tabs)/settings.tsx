import {
    ArrowLeftRight,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Palette,
    Save,
    TriangleAlert,
    Wallet,
} from "lucide-react-native/icons";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { showErrorToast, showSuccessToast } from "@/components/ThemedToast";
import { resetDatabase } from "@/db/database";
import { useBudgetStore } from "@/store/budget-store";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import {
    ACCENT_COLOR_NAMES,
    ACCENT_COLORS,
    type AccentColorName,
    useThemeColors,
    useThemeStore,
} from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";

const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const YEARS = ["2023", "2024", "2025", "2026", "2027"];

const ACCENT_OPTIONS: AccentColorName[] = [
    "blue",
    "pink",
    "purple",
    "green",
    "cyan",
    "orange",
];

// ─── Components ───────────────────────────────────────────────────────────────

function GlassPanel({
    children,
    accent,
    heavy,
    className = "",
}: {
    children: React.ReactNode;
    accent?: boolean;
    heavy?: boolean;
    className?: string;
}) {
    const colors = useThemeColors();
    return (
        <View
            className={`p-4 ${className}`}
            style={{
                backgroundColor: heavy
                    ? colors.glassOverlay
                    : colors.glassSurface,
                borderWidth: 1,
                borderColor: accent
                    ? `${colors.primary}4D`
                    : colors.glassBorderStrong,
                borderRadius: 12,
                ...(heavy
                    ? {
                          shadowColor: "#57f1db",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 24,
                          elevation: 8,
                      }
                    : {}),
            }}
        >
            {children}
        </View>
    );
}

function CollapsiblePanel({
    icon: Icon,
    label,
    defaultOpen,
    children,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const colors = useThemeColors();
    const [open, setOpen] = useState(defaultOpen ?? true);

    return (
        <GlassPanel>
            <Pressable
                className="flex-row items-center justify-between"
                onPress={() => setOpen(!open)}
            >
                <View className="flex-row items-center gap-3">
                    <Icon size={20} color={colors.primary} />
                    <Text
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        {label}
                    </Text>
                </View>
                {open ? (
                    <ChevronDown size={18} color={colors.onSurfaceVariant} />
                ) : (
                    <ChevronRight size={18} color={colors.onSurfaceVariant} />
                )}
            </Pressable>
            {open && <View className="mt-4">{children}</View>}
        </GlassPanel>
    );
}

function SectionHeader({
    icon: Icon,
    label,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
}) {
    const colors = useThemeColors();
    return (
        <View className="flex-row items-center gap-3 mb-3">
            <Icon size={20} color={colors.primary} />
            <Text
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "Inter", color: colors.onSurfaceVariant }}
            >
                {label}
            </Text>
        </View>
    );
}

function ColorCircle({
    color,
    selected,
    onPress,
}: {
    color: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} className="items-center">
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: color,
                    borderWidth: selected ? 3 : 0,
                    borderColor: selected ? "#ffffff" : "transparent",
                    shadowColor: selected ? color : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: selected ? 0.8 : 0,
                    shadowRadius: 10,
                    elevation: selected ? 6 : 0,
                }}
            />
        </Pressable>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const colors = useThemeColors();
    const themeMode = useThemeStore((s) => s.mode);
    const setThemeMode = useThemeStore((s) => s.setMode);
    const primaryAccent = useThemeStore((s) => s.primaryAccent);
    const setPrimaryAccent = useThemeStore((s) => s.setPrimaryAccent);
    const secondaryAccent = useThemeStore((s) => s.secondaryAccent);
    const setSecondaryAccent = useThemeStore((s) => s.setSecondaryAccent);

    const showCategories = usePreferencesStore((s) => s.showCategories);
    const showPresupuesto = usePreferencesStore((s) => s.showPresupuesto);
    const monthlyBudget = usePreferencesStore((s) => s.monthlyBudget);
    const setMonthlyBudget = usePreferencesStore((s) => s.setMonthlyBudget);
    const setShowCategories = usePreferencesStore((s) => s.setShowCategories);
    const setShowPresupuesto = usePreferencesStore((s) => s.setShowPresupuesto);

    const storeRatesByMonth = useRateStore((s) => s.ratesByMonth);
    const loadRates = useRateStore((s) => s.loadRates);
    const setRates = useRateStore((s) => s.setRates);
    const loaded = useRateStore((s) => s.loaded);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(
        String(new Date().getFullYear()),
    );
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [budgetValue, setBudgetValue] = useState(
        String(monthlyBudget > 0 ? monthlyBudget : ""),
    );
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
        new Set([`${new Date().getMonth()}-${new Date().getFullYear()}`]),
    );

    // Local string state for rate inputs (allows free typing)
    const [inputRates, setInputRates] = useState<
        Record<string, { p2p: string; bcvUsd: string; bcvEur: string }>
    >({});

    // Sync budgetValue when monthlyBudget loads from DB (async)
    const budgetInitialized = useRef(false);
    useEffect(() => {
        if (monthlyBudget > 0 && !budgetInitialized.current) {
            budgetInitialized.current = true;
            setBudgetValue(String(monthlyBudget));
        }
    }, [monthlyBudget]);

    // Load persisted rates on mount and populate inputRates
    const initRef = useRef(false);
    useEffect(() => {
        if (!loaded) {
            loadRates();
        }
    }, [loaded, loadRates]);

    useEffect(() => {
        if (loaded && !initRef.current) {
            initRef.current = true;
            const initial: Record<
                string,
                { p2p: string; bcvUsd: string; bcvEur: string }
            > = {};
            for (const [key, rates] of Object.entries(storeRatesByMonth)) {
                initial[key] = {
                    p2p: String(rates.p2pRate),
                    bcvUsd: String(rates.bcvUsdRate),
                    bcvEur: String(rates.bcvEurRate),
                };
            }
            setInputRates(initial);
        }
    }, [loaded, storeRatesByMonth]);

    function getInputRates(key: string) {
        return (
            inputRates[key] ?? { p2p: "", bcvUsd: "", bcvEur: "" }
        );
    }

    function updateRate(
        key: string,
        field: "p2p" | "bcvUsd" | "bcvEur",
        value: string,
    ) {
        setInputRates((prev) => ({
            ...prev,
            [key]: { ...(prev[key] ?? { p2p: "", bcvUsd: "", bcvEur: "" }), [field]: value },
        }));
    }

    const yearMonths = MONTHS.map((_, i) => ({
        index: i,
        key: `${i}-${selectedYear}`,
    }));

    function toggleMonth(key: string) {
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    /** Persist rates + budget to store + DB */
    async function handleSave() {
        console.log('[settings] handleSave — all values:', {
            budgetValue,
            budget: parseFloat(budgetValue) || 0,
            selectedMonth,
            selectedYear,
            inputRates,
            storeMonthlyBudget: monthlyBudget,
        });
        try {
            // Save monthly budget
            const budget = parseFloat(budgetValue) || 0;
            await setMonthlyBudget(budget);

            // Save rates for all months
            const year = parseInt(selectedYear, 10);
            for (let m = 0; m < 12; m++) {
                const key = `${m}-${selectedYear}`;
                const rates = inputRates[key];
                if (!rates) continue;
                const p2pRate = parseFloat(rates.p2p) || 0;
                const bcvUsdRate = parseFloat(rates.bcvUsd) || 0;
                const bcvEurRate = parseFloat(rates.bcvEur) || 0;
                if (p2pRate === 0 && bcvUsdRate === 0 && bcvEurRate === 0) continue;
                await setRates(m, year, { p2pRate, bcvUsdRate, bcvEurRate });
            }
            console.log('[settings] handleSave — done, store monthlyBudget:', usePreferencesStore.getState().monthlyBudget);
            showSuccessToast("Configuración guardada correctamente");
        } catch (e) {
            console.error('[settings] handleSave error:', e);
            showErrorToast("Error al guardar la configuración");
        }
    }

    // ─── Render ─────────────────────────────────────────────────────────────

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

                {/* ════════════════════════════════════════════════════════════ */}
                {/* ── Apariencia ── */}
                {/* ════════════════════════════════════════════════════════════ */}
                <GlassPanel>
                    <SectionHeader icon={Palette} label="Apariencia" />

                    {/* Modo */}
                    <Text
                        className="text-sm font-medium mb-2"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurface,
                        }}
                    >
                        Modo
                    </Text>
                    <View
                        className="flex-row rounded-xl overflow-hidden mb-5"
                        style={{
                            backgroundColor: colors.glassBorder,
                            borderWidth: 1,
                            borderColor: colors.glassBorder,
                        }}
                    >
                        <Pressable
                            className="flex-1 py-3 items-center"
                            style={{
                                backgroundColor:
                                    themeMode === "light"
                                        ? `${colors.primary}1A`
                                        : "transparent",
                            }}
                            onPress={() => setThemeMode("light")}
                        >
                            <Text
                                className="text-sm font-medium"
                                style={{
                                    fontFamily: "Inter",
                                    color:
                                        themeMode === "light"
                                            ? colors.primary
                                            : colors.onSurfaceVariant,
                                }}
                            >
                                Claro
                            </Text>
                        </Pressable>
                        <Pressable
                            className="flex-1 py-3 items-center"
                            style={{
                                backgroundColor:
                                    themeMode === "dark"
                                        ? `${colors.primary}1A`
                                        : "transparent",
                            }}
                            onPress={() => setThemeMode("dark")}
                        >
                            <Text
                                className="text-sm font-medium"
                                style={{
                                    fontFamily: "Inter",
                                    color:
                                        themeMode === "dark"
                                            ? colors.primary
                                            : colors.onSurfaceVariant,
                                }}
                            >
                                Oscuro
                            </Text>
                        </Pressable>
                    </View>

                    {/* Color primario */}
                    <Text
                        className="text-sm font-medium mb-2"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurface,
                        }}
                    >
                        Color primario
                    </Text>
                    <View className="flex-row justify-between mb-5">
                        {ACCENT_OPTIONS.map((name) => (
                            <ColorCircle
                                key={name}
                                color={ACCENT_COLORS[name]}
                                selected={primaryAccent === name}
                                onPress={() => setPrimaryAccent(name)}
                            />
                        ))}
                    </View>

                    {/* Color secundario */}
                    <Text
                        className="text-sm font-medium mb-2"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurface,
                        }}
                    >
                        Color secundario
                    </Text>
                    <View className="flex-row justify-between">
                        {ACCENT_OPTIONS.map((name) => (
                            <ColorCircle
                                key={name}
                                color={ACCENT_COLORS[name]}
                                selected={secondaryAccent === name}
                                onPress={() => setSecondaryAccent(name)}
                            />
                        ))}
                    </View>
                </GlassPanel>

                {/* ════════════════════════════════════════════════════════════ */}
                {/* ── Fiscal ── */}
                {/* ════════════════════════════════════════════════════════════ */}
                <GlassPanel>
                    <SectionHeader icon={Wallet} label="Fiscal" />

                    {/* Presupuesto Mensual */}
                    <Text
                        className="text-sm font-medium mb-2"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurface,
                        }}
                    >
                        Presupuesto Mensual
                    </Text>
                    <View className="flex-row items-baseline gap-2 mb-5">
                        <TextInput
                            className="text-4xl font-bold"
                            style={{
                                fontFamily: "Geist",
                                color: colors.onSurface,
                                minWidth: 140,
                            }}
                            keyboardType="decimal-pad"
                            value={budgetValue}
                            onChangeText={setBudgetValue}
                            placeholder="0.00"
                            placeholderTextColor="rgba(221,228,225,0.3)"
                        />
                        <Text
                            className="text-base font-semibold"
                            style={{
                                fontFamily: "Inter",
                                color: colors.onSurfaceVariant,
                            }}
                        >
                            USDT
                        </Text>
                    </View>

                    {/* Periodo */}
                    <Text
                        className="text-sm font-medium mb-2"
                        style={{
                            fontFamily: "Inter",
                            color: colors.onSurface,
                        }}
                    >
                        Periodo
                    </Text>
                    <View className="flex-row gap-3">
                        {/* Month selector */}
                        <View className="flex-1 relative">
                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3 rounded-xl"
                                style={{
                                    backgroundColor: colors.glassBorder,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                                onPress={() => {
                                    setShowMonthPicker(!showMonthPicker);
                                    setShowYearPicker(false);
                                }}
                            >
                                <Text
                                    className="text-sm"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurface,
                                    }}
                                >
                                    {MONTHS[selectedMonth]}
                                </Text>
                                <ChevronDown
                                    size={16}
                                    color={colors.outline}
                                />
                            </Pressable>
                            {showMonthPicker && (
                                <View
                                    className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden"
                                    style={{
                                        backgroundColor:
                                            colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor:
                                            colors.glassBorderStrong,
                                    }}
                                >
                                    <ScrollView
                                        style={{ maxHeight: 200 }}
                                        nestedScrollEnabled
                                    >
                                        {MONTHS.map((m, i) => (
                                            <Pressable
                                                key={i}
                                                className="px-4 py-3"
                                                style={{
                                                    backgroundColor:
                                                        i === selectedMonth
                                                            ? `${colors.primary}1F`
                                                            : "transparent",
                                                }}
                                                onPress={() => {
                                                    setSelectedMonth(i);
                                                    setShowMonthPicker(false);
                                                }}
                                            >
                                                <Text
                                                    className="text-sm"
                                                    style={{
                                                        fontFamily: "Inter",
                                                        color:
                                                            i === selectedMonth
                                                                ? colors.primary
                                                                : colors.onSurface,
                                                    }}
                                                >
                                                    {m}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Year selector */}
                        <View className="relative" style={{ width: 100 }}>
                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3 rounded-xl"
                                style={{
                                    backgroundColor: colors.glassBorder,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                                onPress={() => {
                                    setShowYearPicker(!showYearPicker);
                                    setShowMonthPicker(false);
                                }}
                            >
                                <Text
                                    className="text-sm"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurface,
                                    }}
                                >
                                    {selectedYear}
                                </Text>
                                <ChevronDown
                                    size={16}
                                    color={colors.outline}
                                />
                            </Pressable>
                            {showYearPicker && (
                                <View
                                    className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden"
                                    style={{
                                        backgroundColor:
                                            colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor:
                                            colors.glassBorderStrong,
                                    }}
                                >
                                    {YEARS.map((y) => (
                                        <Pressable
                                            key={y}
                                            className="px-4 py-3"
                                            style={{
                                                backgroundColor:
                                                    y === selectedYear
                                                        ? `${colors.primary}1F`
                                                        : "transparent",
                                            }}
                                            onPress={() => {
                                                setSelectedYear(y);
                                                setShowYearPicker(false);
                                            }}
                                        >
                                            <Text
                                                className="text-sm"
                                                style={{
                                                    fontFamily: "Inter",
                                                    color:
                                                        y === selectedYear
                                                            ? colors.primary
                                                            : colors.onSurface,
                                                }}
                                            >
                                                {y}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </GlassPanel>

                {/* ════════════════════════════════════════════════════════════ */}
                {/* ── Tasas (por mes) ── */}
                {/* ════════════════════════════════════════════════════════════ */}
                <CollapsiblePanel
                    icon={ArrowLeftRight}
                    label="Tasas (por mes)"
                >
                    <Text
                        className="text-xs mb-4"
                        style={{
                            fontFamily: "Inter",
                            color: colors.outline,
                        }}
                    >
                        Configura las tasas de cambio para cada mes del año{" "}
                        {selectedYear}.
                    </Text>

                    {yearMonths.map(({ index, key }) => {
                        const isExpanded = expandedMonths.has(key);
                        const rates = getInputRates(key);
                        const p2p = parseFloat(rates.p2p) || 0;
                        const bcvUsd = parseFloat(rates.bcvUsd) || 0;
                        const bcvEur = parseFloat(rates.bcvEur) || 0;
                        const budget = parseFloat(budgetValue) || 0;

                        return (
                            <View
                                key={key}
                                className="mb-3 rounded-xl overflow-hidden"
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                            >
                                {/* Month header */}
                                <Pressable
                                    className="flex-row items-center justify-between px-4 py-3"
                                    style={{
                                        backgroundColor:
                                            colors.glassSurface,
                                    }}
                                    onPress={() => toggleMonth(key)}
                                >
                                    <Text
                                        className="text-sm font-semibold"
                                        style={{
                                            fontFamily: "Inter",
                                            color: colors.onSurface,
                                        }}
                                    >
                                        {MONTHS[index]} {selectedYear}
                                    </Text>
                                    {isExpanded ? (
                                        <ChevronDown
                                            size={16}
                                            color={colors.outline}
                                        />
                                    ) : (
                                        <ChevronRight
                                            size={16}
                                            color={colors.outline}
                                        />
                                    )}
                                </Pressable>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <View className="p-4 gap-4">
                                        {/* Tasas de Cambio */}
                                        <View>
                                            <Text
                                                className="text-xs font-semibold uppercase tracking-widest mb-2"
                                                style={{
                                                    fontFamily: "Inter",
                                                    color: colors
                                                        .onSurfaceVariant,
                                                }}
                                            >
                                                Tasas de Cambio
                                            </Text>
                                            <View className="gap-2">
                                                {/* Dólar P2P */}
                                                <View
                                                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                                                    style={{
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor: `${colors.primary}33`,
                                                        borderLeftWidth: 3,
                                                        borderLeftColor: `${colors.primary}66`,
                                                    }}
                                                >
                                                    <View className="flex-1">
                                                        <Text
                                                            className="text-sm font-medium"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .onSurface,
                                                            }}
                                                        >
                                                            Dólar P2P (Bs.)
                                                        </Text>
                                                        <Text
                                                            className="text-xs"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .outline,
                                                            }}
                                                        >
                                                            Referencia Binance
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        className="text-right text-sm font-medium"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .onSurface,
                                                            width: 80,
                                                        }}
                                                        keyboardType="decimal-pad"
                                                        value={rates.p2p}
                                                        onChangeText={(v) =>
                                                            updateRate(
                                                                key,
                                                                "p2p",
                                                                v,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        placeholderTextColor={
                                                            colors.outline
                                                        }
                                                    />
                                                </View>

                                                {/* Dólar BCV */}
                                                <View
                                                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                                                    style={{
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <View className="flex-1">
                                                        <Text
                                                            className="text-sm font-medium"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .onSurface,
                                                            }}
                                                        >
                                                            Dólar BCV (Bs.)
                                                        </Text>
                                                        <Text
                                                            className="text-xs"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .outline,
                                                            }}
                                                        >
                                                            Oficial BCV
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        className="text-right text-sm font-medium"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .onSurface,
                                                            width: 80,
                                                        }}
                                                        keyboardType="decimal-pad"
                                                        value={rates.bcvUsd}
                                                        onChangeText={(v) =>
                                                            updateRate(
                                                                key,
                                                                "bcvUsd",
                                                                v,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        placeholderTextColor={
                                                            colors.outline
                                                        }
                                                    />
                                                </View>

                                                {/* Euro BCV */}
                                                <View
                                                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                                                    style={{
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <View className="flex-1">
                                                        <Text
                                                            className="text-sm font-medium"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .onSurface,
                                                            }}
                                                        >
                                                            Euro BCV (Bs.)
                                                        </Text>
                                                        <Text
                                                            className="text-xs"
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                color: colors
                                                                    .outline,
                                                            }}
                                                        >
                                                            Oficial BCV
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        className="text-right text-sm font-medium"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .onSurface,
                                                            width: 80,
                                                        }}
                                                        keyboardType="decimal-pad"
                                                        value={rates.bcvEur}
                                                        onChangeText={(v) =>
                                                            updateRate(
                                                                key,
                                                                "bcvEur",
                                                                v,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        placeholderTextColor={
                                                            colors.outline
                                                        }
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Resumen de Conversión */}
                                        <View
                                            className="rounded-xl p-4"
                                            style={{
                                                backgroundColor:
                                                    colors.glassOverlay,
                                                borderWidth: 1,
                                                borderColor:
                                                    colors.glassBorderStrong,
                                            }}
                                        >
                                            <Text
                                                className="text-xs font-semibold uppercase tracking-widest mb-3"
                                                style={{
                                                    fontFamily: "Inter",
                                                    color: colors
                                                        .onSurfaceVariant,
                                                }}
                                            >
                                                Resumen de Conversión
                                            </Text>
                                            <View className="gap-0">
                                                <View
                                                    className="flex-row justify-between items-center py-2"
                                                    style={{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <Text
                                                        className="text-sm"
                                                        style={{
                                                            fontFamily:
                                                                "Inter",
                                                            color: colors
                                                                .onSurfaceVariant,
                                                        }}
                                                    >
                                                        Bolívares (P2P)
                                                    </Text>
                                                    <Text
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .onSurface,
                                                        }}
                                                    >
                                                        {(budget * p2p).toLocaleString(
                                                            "es-VE",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}{" "}
                                                        Bs.
                                                    </Text>
                                                </View>
                                                <View
                                                    className="flex-row justify-between items-center py-2"
                                                    style={{
                                                        borderBottomWidth: 1,
                                                        borderBottomColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <Text
                                                        className="text-sm"
                                                        style={{
                                                            fontFamily:
                                                                "Inter",
                                                            color: colors
                                                                .onSurfaceVariant,
                                                        }}
                                                    >
                                                        Dólares (BCV)
                                                    </Text>
                                                    <Text
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .primary,
                                                        }}
                                                    >
                                                        {(bcvUsd > 0
                                                            ? (budget * p2p) / bcvUsd
                                                            : 0
                                                        ).toLocaleString(
                                                            "en-US",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}{" "}
                                                        $
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between items-center py-2">
                                                    <Text
                                                        className="text-sm"
                                                        style={{
                                                            fontFamily:
                                                                "Inter",
                                                            color: colors
                                                                .onSurfaceVariant,
                                                        }}
                                                    >
                                                        Euros (BCV)
                                                    </Text>
                                                    <Text
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            fontFamily:
                                                                "Geist",
                                                            color: colors
                                                                .onSurface,
                                                        }}
                                                    >
                                                        {(bcvEur > 0
                                                            ? (budget * p2p) / bcvEur
                                                            : 0
                                                        ).toLocaleString(
                                                            "de-DE",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}{" "}
                                                        €
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </CollapsiblePanel>

                {/* ════════════════════════════════════════════════════════════ */}
                {/* ── Secciones Visibles ── */}
                {/* ════════════════════════════════════════════════════════════ */}
                <GlassPanel>
                    <SectionHeader icon={Eye} label="Secciones Visibles" />
                    <View className="gap-3">
                        {/* Toggle Categorías */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text
                                    className="text-sm font-medium"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurface,
                                    }}
                                >
                                    Categorías
                                </Text>
                                <Text
                                    className="text-xs"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.outline,
                                    }}
                                >
                                    Pantalla de gestión de categorías
                                </Text>
                            </View>
                            <Pressable
                                className="w-12 h-7 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: showCategories
                                        ? colors.primary
                                        : colors.glassBorderStrong,
                                }}
                                onPress={() =>
                                    setShowCategories(!showCategories)
                                }
                            >
                                {showCategories ? (
                                    <Eye size={16} color={colors.onPrimary} />
                                ) : (
                                    <EyeOff
                                        size={16}
                                        color={colors.onSurfaceVariant}
                                    />
                                )}
                            </Pressable>
                        </View>

                        {/* Toggle Presupuesto */}
                        <View
                            className="flex-row items-center justify-between pt-3"
                            style={{
                                borderTopWidth: 1,
                                borderTopColor: colors.glassBorder,
                            }}
                        >
                            <View className="flex-1">
                                <Text
                                    className="text-sm font-medium"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurface,
                                    }}
                                >
                                    Presupuesto
                                </Text>
                                <Text
                                    className="text-xs"
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.outline,
                                    }}
                                >
                                    Pantalla de presupuesto mensual
                                </Text>
                            </View>
                            <Pressable
                                className="w-12 h-7 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: showPresupuesto
                                        ? colors.primary
                                        : colors.glassBorderStrong,
                                }}
                                onPress={() =>
                                    setShowPresupuesto(!showPresupuesto)
                                }
                            >
                                {showPresupuesto ? (
                                    <Eye size={16} color={colors.onPrimary} />
                                ) : (
                                    <EyeOff
                                        size={16}
                                        color={colors.onSurfaceVariant}
                                    />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </GlassPanel>

                {/* ── Guardar Configuración ── */}
                <Pressable
                    className="py-4 rounded-full items-center"
                    style={{
                        backgroundColor: colors.primary,
                        shadowColor: "#57f1db",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 8,
                    }}
                    onPress={handleSave}
                >
                    <View className="flex-row items-center gap-2">
                        <Save size={18} color={colors.onPrimary} />
                        <Text
                            className="text-base font-semibold"
                            style={{
                                fontFamily: "Inter",
                                color: colors.onPrimary,
                            }}
                        >
                            Guardar Configuración
                        </Text>
                    </View>
                </Pressable>

                {/* ── Restablecer Base de Datos ── */}
                <Pressable
                    className="py-4 rounded-full items-center mt-4"
                    style={{
                        backgroundColor: `${colors.error}1A`,
                        borderWidth: 1,
                        borderColor: `${colors.error}4D`,
                    }}
                    onPress={() => {
                        Alert.alert(
                            "Restablecer base de datos",
                            "Se eliminarán TODOS los datos (transacciones, categorías, presupuesto). Esta acción no se puede deshacer.",
                            [
                                { text: "Cancelar", style: "cancel" },
                                {
                                    text: "Eliminar todo",
                                    style: "destructive",
                                    onPress: async () => {
                                        try {
                                            await resetDatabase();
                                            await Promise.all([
                                                useCategoryStore
                                                    .getState()
                                                    .loadCategories(),
                                                useTransactionStore
                                                    .getState()
                                                    .loadTransactions(),
                                                useTransactionStore
                                                    .getState()
                                                    .loadMonthlySummary(),
                                                useTransactionStore
                                                    .getState()
                                                    .loadCategorySummaries(),
                                            ]);
                                            showSuccessToast(
                                                "Base de datos restablecida",
                                            );
                                        } catch {
                                            showErrorToast(
                                                "No se pudo restablecer la base de datos",
                                            );
                                        }
                                    },
                                },
                            ],
                        );
                    }}
                >
                    <View className="flex-row items-center gap-2">
                        <TriangleAlert size={22} color={colors.error} />
                        <Text
                            className="text-base font-semibold"
                            style={{ fontFamily: "Inter", color: colors.error }}
                        >
                            Restablecer Base de Datos
                        </Text>
                    </View>
                </Pressable>
            </View>
        </ScrollView>
    );
}
