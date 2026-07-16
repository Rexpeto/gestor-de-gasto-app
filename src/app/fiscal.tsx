import {
    ArrowLeftRight,
    ChevronDown,
    ChevronRight,
    Save,
    Wallet,
} from "lucide-react-native/icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { showErrorToast, showSuccessToast } from "@/components/ThemedToast";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { useThemeColors } from "@/store/theme-store";
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

// ─── Components ───────────────────────────────────────────────────────────────

function GlassPanel({ children }: { children: React.ReactNode }) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
                borderRadius: 16,
                padding: 20,
            }}
        >
            {children}
        </View>
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
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
            }}
        >
            <Icon size={20} color={colors.primary} />
            <Text
                style={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    fontWeight: "600",
                    letterSpacing: 0.05,
                    textTransform: "uppercase",
                    color: colors.onSurfaceVariant,
                }}
            >
                {label}
            </Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FiscalScreen() {
    const colors = useThemeColors();

    // ── Stores ──
    const monthlyBudget = usePreferencesStore((s) => s.monthlyBudget);
    const budgetCurrency = usePreferencesStore((s) => s.budgetCurrency);
    const setMonthlyBudget = usePreferencesStore((s) => s.setMonthlyBudget);
    const setBudgetCurrency = usePreferencesStore((s) => s.setBudgetCurrency);

    const storeRatesByMonth = useRateStore((s) => s.ratesByMonth);
    const loadRates = useRateStore((s) => s.loadRates);
    const setRates = useRateStore((s) => s.setRates);
    const loaded = useRateStore((s) => s.loaded);

    // ── Local state ──
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(
        String(new Date().getFullYear()),
    );
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [budgetValue, setBudgetValue] = useState(
        String(monthlyBudget > 0 ? monthlyBudget : ""),
    );
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
        new Set([`${new Date().getMonth()}-${new Date().getFullYear()}`]),
    );
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

    // Load persisted rates on mount
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
        return inputRates[key] ?? { p2p: "", bcvUsd: "", bcvEur: "" };
    }

    function updateRate(
        key: string,
        field: "p2p" | "bcvUsd" | "bcvEur",
        value: string,
    ) {
        setInputRates((prev) => ({
            ...prev,
            [key]: {
                ...(prev[key] ?? { p2p: "", bcvUsd: "", bcvEur: "" }),
                [field]: value,
            },
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

    async function handleSave() {
        try {
            const budget = parseFloat(budgetValue) || 0;
            await setMonthlyBudget(budget);
            await setBudgetCurrency(budgetCurrency);

            const year = parseInt(selectedYear, 10);
            for (let m = 0; m < 12; m++) {
                const key = `${m}-${selectedYear}`;
                const rates = inputRates[key];
                if (!rates) continue;
                const p2pRate = parseFloat(rates.p2p) || 0;
                const bcvUsdRate = parseFloat(rates.bcvUsd) || 0;
                const bcvEurRate = parseFloat(rates.bcvEur) || 0;
                if (p2pRate === 0 && bcvUsdRate === 0 && bcvEurRate === 0)
                    continue;
                await setRates(m, year, { p2pRate, bcvUsdRate, bcvEurRate });
            }

            // Reload summaries so dashboard reflects converted amounts
            await Promise.all([
                useTransactionStore.getState().loadMonthlySummary(),
                useTransactionStore.getState().loadCategorySummaries(),
            ]);

            showSuccessToast("Configuración guardada correctamente");
        } catch (e) {
            console.error("[fiscal] handleSave error:", e);
            showErrorToast("Error al guardar la configuración");
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 60,
                    gap: 20,
                }}
            >
                {/* ════════════════════════════════════════════════════════════ */}
                {/* ── Presupuesto Mensual ── */}
                {/* ════════════════════════════════════════════════════════════ */}
                <GlassPanel>
                    <SectionHeader icon={Wallet} label="Presupuesto Mensual" />

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "baseline",
                            gap: 8,
                            marginBottom: 20,
                        }}
                    >
                        <TextInput
                            style={{
                                fontFamily: "Geist",
                                fontSize: 36,
                                fontWeight: "700",
                                color: colors.onSurface,
                                minWidth: 140,
                            }}
                            keyboardType="decimal-pad"
                            value={budgetValue}
                            onChangeText={setBudgetValue}
                            placeholder="0.00"
                            placeholderTextColor={colors.outline}
                        />
                        <View style={{ position: "relative" }}>
                            <Pressable
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    backgroundColor: colors.glassSurface,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                                onPress={() =>
                                    setShowCurrencyPicker(!showCurrencyPicker)
                                }
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 16,
                                        fontWeight: "600",
                                        color: colors.onSurface,
                                    }}
                                >
                                    {budgetCurrency}
                                </Text>
                                <ChevronDown
                                    size={14}
                                    color={colors.outline}
                                />
                            </Pressable>
                            {showCurrencyPicker && (
                                <View
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        marginTop: 4,
                                        zIndex: 50,
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        backgroundColor:
                                            colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor:
                                            colors.glassBorderStrong,
                                        minWidth: 100,
                                    }}
                                >
                                    <Pressable
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            backgroundColor:
                                                budgetCurrency === "USDT"
                                                    ? `${colors.primary}4D`
                                                    : "transparent",
                                        }}
                                        onPress={() => {
                                            setBudgetCurrency("USDT");
                                            setShowCurrencyPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 14,
                                                fontWeight: "500",
                                                color:
                                                    budgetCurrency === "USDT"
                                                        ? colors.primary
                                                        : colors.onSurface,
                                            }}
                                        >
                                            USDT
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            backgroundColor:
                                                budgetCurrency === "Bs"
                                                    ? `${colors.primary}4D`
                                                    : "transparent",
                                        }}
                                        onPress={() => {
                                            setBudgetCurrency("Bs");
                                            setShowCurrencyPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 14,
                                                fontWeight: "500",
                                                color:
                                                    budgetCurrency === "Bs"
                                                        ? colors.primary
                                                        : colors.onSurface,
                                            }}
                                        >
                                            Bs
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>

                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            fontWeight: "500",
                            color: colors.onSurface,
                            marginBottom: 8,
                        }}
                    >
                        Periodo
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {/* Month selector */}
                        <View style={{ flex: 1, position: "relative" }}>
                            <Pressable
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    backgroundColor: colors.glassSurface,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                                onPress={() => {
                                    setShowMonthPicker(!showMonthPicker);
                                    setShowYearPicker(false);
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 14,
                                        color: colors.onSurface,
                                    }}
                                >
                                    {MONTHS[selectedMonth]}
                                </Text>
                                <ChevronDown size={16} color={colors.outline} />
                            </Pressable>
                            {showMonthPicker && (
                                <View
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: 4,
                                        zIndex: 50,
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        backgroundColor:
                                            colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor: colors.glassBorderStrong,
                                    }}
                                >
                                    <ScrollView
                                        style={{ maxHeight: 200 }}
                                        nestedScrollEnabled
                                    >
                                        {MONTHS.map((m, i) => (
                                            <Pressable
                                                key={i}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                    backgroundColor:
                                                        i === selectedMonth
                                                            ? `${colors.primary}4D`
                                                            : "transparent",
                                                }}
                                                onPress={() => {
                                                    setSelectedMonth(i);
                                                    setShowMonthPicker(false);
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 14,
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
                        <View style={{ position: "relative", width: 100 }}>
                            <Pressable
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    backgroundColor: colors.glassSurface,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                                onPress={() => {
                                    setShowYearPicker(!showYearPicker);
                                    setShowMonthPicker(false);
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 14,
                                        color: colors.onSurface,
                                    }}
                                >
                                    {selectedYear}
                                </Text>
                                <ChevronDown size={16} color={colors.outline} />
                            </Pressable>
                            {showYearPicker && (
                                <View
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: 4,
                                        zIndex: 50,
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        backgroundColor:
                                            colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor: colors.glassBorderStrong,
                                    }}
                                >
                                    {YEARS.map((y) => (
                                        <Pressable
                                            key={y}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                                backgroundColor:
                                                    y === selectedYear
                                                        ? `${colors.primary}4D`
                                                        : "transparent",
                                            }}
                                            onPress={() => {
                                                setSelectedYear(y);
                                                setShowYearPicker(false);
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 14,
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
                <GlassPanel>
                    <SectionHeader
                        icon={ArrowLeftRight}
                        label="Tasas (por mes)"
                    />

                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            color: colors.outline,
                            marginBottom: 16,
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
                                style={{
                                    marginBottom: 12,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                }}
                            >
                                {/* Month header */}
                                <Pressable
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        backgroundColor: colors.glassSurface,
                                    }}
                                    onPress={() => toggleMonth(key)}
                                >
                                    <Text
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 14,
                                            fontWeight: "600",
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
                                    <View style={{ padding: 16, gap: 16 }}>
                                        <View>
                                            <Text
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 12,
                                                    fontWeight: "600",
                                                    letterSpacing: 0.05,
                                                    textTransform: "uppercase",
                                                    color: colors.onSurfaceVariant,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                Tasas de Cambio
                                            </Text>
                                            <View style={{ gap: 8 }}>
                                                {/* Dólar P2P */}
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                        borderRadius: 12,
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor: `${colors.primary}4D`,
                                                        borderLeftWidth: 3,
                                                        borderLeftColor: `${colors.primary}99`,
                                                    }}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 14,
                                                                fontWeight:
                                                                    "500",
                                                                color: colors.onSurface,
                                                            }}
                                                        >
                                                            Dólar P2P (Bs.)
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 12,
                                                                color: colors.outline,
                                                            }}
                                                        >
                                                            Referencia Binance
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        style={{
                                                            fontFamily: "Geist",
                                                            fontSize: 14,
                                                            fontWeight: "500",
                                                            color: colors.onSurface,
                                                            width: 80,
                                                            textAlign: "right",
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
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                        borderRadius: 12,
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 14,
                                                                fontWeight:
                                                                    "500",
                                                                color: colors.onSurface,
                                                            }}
                                                        >
                                                            Dólar BCV (Bs.)
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 12,
                                                                color: colors.outline,
                                                            }}
                                                        >
                                                            Oficial BCV
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        style={{
                                                            fontFamily: "Geist",
                                                            fontSize: 14,
                                                            fontWeight: "500",
                                                            color: colors.onSurface,
                                                            width: 80,
                                                            textAlign: "right",
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
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                        borderRadius: 12,
                                                        backgroundColor:
                                                            colors.glassSurface,
                                                        borderWidth: 1,
                                                        borderColor:
                                                            colors.glassBorder,
                                                    }}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 14,
                                                                fontWeight:
                                                                    "500",
                                                                color: colors.onSurface,
                                                            }}
                                                        >
                                                            Euro BCV (Bs.)
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Inter",
                                                                fontSize: 12,
                                                                color: colors.outline,
                                                            }}
                                                        >
                                                            Oficial BCV
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        style={{
                                                            fontFamily: "Geist",
                                                            fontSize: 14,
                                                            fontWeight: "500",
                                                            color: colors.onSurface,
                                                            width: 80,
                                                            textAlign: "right",
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
                                        {budget > 0 && (
                                            budgetCurrency === "USDT"
                                                ? p2p > 0
                                                : bcvUsd > 0 ||
                                                    bcvEur > 0 ||
                                                    p2p > 0
                                        ) && (
                                            <View
                                                style={{
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    backgroundColor:
                                                        colors.glassOverlay,
                                                    borderWidth: 1,
                                                    borderColor:
                                                        colors.glassBorderStrong,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 12,
                                                        fontWeight: "600",
                                                        letterSpacing: 0.05,
                                                        textTransform:
                                                            "uppercase",
                                                        color: colors.onSurfaceVariant,
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    Resumen de Conversión
                                                </Text>
                                                <View>
                                                    {budgetCurrency ===
                                                    "USDT" ? (
                                                        <>
                                                            {/* USDT → Bs */}
                                                            <View
                                                                style={{
                                                                    flexDirection:
                                                                        "row",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    alignItems:
                                                                        "center",
                                                                    paddingVertical: 8,
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor:
                                                                        colors.glassBorder,
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            "Inter",
                                                                        fontSize: 14,
                                                                        color: colors.onSurfaceVariant,
                                                                    }}
                                                                >
                                                                    Bolívares (P2P)
                                                                </Text>
                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            "Geist",
                                                                        fontSize: 14,
                                                                        fontWeight:
                                                                            "600",
                                                                        color: colors.onSurface,
                                                                    }}
                                                                >
                                                                    {(
                                                                        budget *
                                                                        p2p
                                                                    ).toLocaleString(
                                                                        "es-VE",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        },
                                                                    )}{" "}
                                                                    Bs.
                                                                </Text>
                                                            </View>
                                                            {bcvUsd > 0 && (
                                                                <View
                                                                    style={{
                                                                        flexDirection:
                                                                            "row",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        paddingVertical: 8,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor:
                                                                            colors.glassBorder,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Inter",
                                                                            fontSize: 14,
                                                                            color: colors.onSurfaceVariant,
                                                                        }}
                                                                    >
                                                                        Dólares (BCV)
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Geist",
                                                                            fontSize: 14,
                                                                            fontWeight:
                                                                                "600",
                                                                            color: colors.primary,
                                                                        }}
                                                                    >
                                                                        {(
                                                                            (budget *
                                                                                p2p) /
                                                                            bcvUsd
                                                                        ).toLocaleString(
                                                                            "es-VE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}{" "}
                                                                        USD
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            {bcvEur > 0 && (
                                                                <View
                                                                    style={{
                                                                        flexDirection:
                                                                            "row",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        paddingVertical: 8,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Inter",
                                                                            fontSize: 14,
                                                                            color: colors.onSurfaceVariant,
                                                                        }}
                                                                    >
                                                                        Euros (BCV)
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Geist",
                                                                            fontSize: 14,
                                                                            fontWeight:
                                                                                "600",
                                                                            color: colors.primary,
                                                                        }}
                                                                    >
                                                                        {(
                                                                            (budget *
                                                                                p2p) /
                                                                            bcvEur
                                                                        ).toLocaleString(
                                                                            "es-VE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}{" "}
                                                                        EUR
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Bs → USDT (P2P) */}
                                                            {p2p > 0 && (
                                                                <View
                                                                    style={{
                                                                        flexDirection:
                                                                            "row",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        paddingVertical: 8,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor:
                                                                            colors.glassBorder,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Inter",
                                                                            fontSize: 14,
                                                                            color: colors.onSurfaceVariant,
                                                                        }}
                                                                    >
                                                                        USDT (P2P)
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Geist",
                                                                            fontSize: 14,
                                                                            fontWeight:
                                                                                "600",
                                                                            color: colors.onSurface,
                                                                        }}
                                                                    >
                                                                        {(
                                                                            budget /
                                                                            p2p
                                                                        ).toLocaleString(
                                                                            "es-VE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}{" "}
                                                                        USDT
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            {bcvUsd > 0 && (
                                                                <View
                                                                    style={{
                                                                        flexDirection:
                                                                            "row",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        paddingVertical: 8,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor:
                                                                            colors.glassBorder,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Inter",
                                                                            fontSize: 14,
                                                                            color: colors.onSurfaceVariant,
                                                                        }}
                                                                    >
                                                                        Dólares (BCV)
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Geist",
                                                                            fontSize: 14,
                                                                            fontWeight:
                                                                                "600",
                                                                            color: colors.primary,
                                                                        }}
                                                                    >
                                                                        {(
                                                                            budget /
                                                                            bcvUsd
                                                                        ).toLocaleString(
                                                                            "es-VE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}{" "}
                                                                        USD
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            {bcvEur > 0 && (
                                                                <View
                                                                    style={{
                                                                        flexDirection:
                                                                            "row",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        paddingVertical: 8,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Inter",
                                                                            fontSize: 14,
                                                                            color: colors.onSurfaceVariant,
                                                                        }}
                                                                    >
                                                                        Euros (BCV)
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontFamily:
                                                                                "Geist",
                                                                            fontSize: 14,
                                                                            fontWeight:
                                                                                "600",
                                                                            color: colors.primary,
                                                                        }}
                                                                    >
                                                                        {(
                                                                            budget /
                                                                            bcvEur
                                                                        ).toLocaleString(
                                                                            "es-VE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}{" "}
                                                                        EUR
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </GlassPanel>

                {/* ── Save Button ── */}
                <Pressable
                    style={{
                        paddingVertical: 16,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        backgroundColor: `${colors.primary}4D`,
                        borderWidth: 1,
                        borderColor: `${colors.primary}66`,
                    }}
                    onPress={handleSave}
                >
                    <Save size={20} color={colors.primary} />
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 16,
                            fontWeight: "600",
                            color: colors.primary,
                        }}
                    >
                        Guardar configuración
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
