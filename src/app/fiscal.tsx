import { Wallet } from "lucide-react-native/icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text } from "react-native";

import { showErrorToast, showSuccessToast } from "@/components/ThemedToast";
import { GlassCard } from "@/components/settings/GlassCard";
import { SectionTitle } from "@/components/settings/SectionTitle";
import { BudgetInput } from "@/components/fiscal/BudgetInput";
import { RateCalendar } from "@/components/fiscal/RateCalendar";
import { RateInputRow } from "@/components/fiscal/RateInputRow";
import { PeriodSelector } from "@/components/fiscal/PeriodSelector";
import { SaveButton } from "@/components/fiscal/SaveButton";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import { budgetToBs, bsToUsdt, bsToUsd, bsToEur } from "@/utils/currency";
import { upsertDailyRate } from "@/db/database";

// ── Screen ───────────────────────────────────────────────────────────────────

export default function FiscalScreen() {
    const colors = useThemeColors();

    // ── Stores ──
    const monthlyBudget = usePreferencesStore((s) => s.monthlyBudget);
    const budgetCurrency = usePreferencesStore((s) => s.budgetCurrency);
    const budgetRate = usePreferencesStore((s) => s.budgetRate);
    const setMonthlyBudget = usePreferencesStore((s) => s.setMonthlyBudget);
    const setBudgetCurrency = usePreferencesStore((s) => s.setBudgetCurrency);
    const setBudgetRate = usePreferencesStore((s) => s.setBudgetRate);
    const prefsLoaded = usePreferencesStore((s) => s.loaded);

    const storeRatesByMonth = useRateStore((s) => s.ratesByMonth);
    const loadRates = useRateStore((s) => s.loadRates);
    const setRates = useRateStore((s) => s.setRates);
    const loaded = useRateStore((s) => s.loaded);

    // ── Local state ──
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(
        String(new Date().getFullYear()),
    );
    const [budgetValue, setBudgetValue] = useState("");
    const [budgetRateValue, setBudgetRateValue] = useState("");
    const [bcvUsdRate, setBcvUsdRate] = useState("");
    const [bcvEurRate, setBcvEurRate] = useState("");
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // ── Effects ──

    // Initialize local state from store AFTER DB loads
    const budgetInitialized = useRef(false);
    useEffect(() => {
        if (!prefsLoaded) return;
        if (budgetInitialized.current) return;
        budgetInitialized.current = true;
        setBudgetValue(String(monthlyBudget > 0 ? monthlyBudget : ""));
        if (budgetRate > 0) {
            setBudgetRateValue(String(budgetRate));
        }
    }, [prefsLoaded, monthlyBudget, budgetRate]);

    const initRef = useRef(false);
    useEffect(() => {
        if (!loaded) loadRates();
    }, [loaded, loadRates]);

    // Auto-fill budget rate only when USER changes currency (not on data load)
    const prevCurrencyRef = useRef(budgetCurrency);
    useEffect(() => {
        // Only auto-fill if currency actually changed by user action
        if (prevCurrencyRef.current === budgetCurrency) return;
        prevCurrencyRef.current = budgetCurrency;

        if (budgetCurrency === "$" && bcvUsdRate) {
            setBudgetRateValue(bcvUsdRate);
        } else if (budgetCurrency === "€" && bcvEurRate) {
            setBudgetRateValue(bcvEurRate);
        } else if (budgetCurrency === "Bs") {
            setBudgetRateValue("");
        }
        // USDT: user enters the rate manually
    }, [budgetCurrency, bcvUsdRate, bcvEurRate]);

    // When store rates are loaded or month changes, populate inputs
    useEffect(() => {
        if (!loaded) return;
        const key = `${selectedMonth}-${selectedYear}`;
        const rates = storeRatesByMonth[key];
        if (rates) {
            setBcvUsdRate(String(rates.bcvUsdRate || ""));
            setBcvEurRate(String(rates.bcvEurRate || ""));
        } else {
            setBcvUsdRate("");
            setBcvEurRate("");
        }
    }, [loaded, storeRatesByMonth, selectedMonth, selectedYear]);

    // ── Conversion lines ──

    function buildConversionLines() {
        const bcvUsd = parseFloat(bcvUsdRate) || 0;
        const bcvEur = parseFloat(bcvEurRate) || 0;
        const budget = parseFloat(budgetValue) || 0;
        const budgetRate = parseFloat(budgetRateValue) || 0;
        const rates = { p2pRate: budgetRate, bcvUsdRate: bcvUsd, bcvEurRate: bcvEur };

        const hasData =
            budget > 0 &&
            (budgetCurrency === "USDT"
                ? budgetRate > 0
                : bcvUsd > 0 || bcvEur > 0);

        if (!hasData) return undefined;

        const fmt = (n: number) =>
            n.toLocaleString("es-VE", { minimumFractionDigits: 2 });

        // Convert budget to Bs first
        const budgetInBs = budgetToBs(budget, budgetCurrency, rates);
        const lines: { label: string; value: string; highlighted?: boolean }[] = [];

        // Show Bs equivalent
        if (budgetCurrency !== "Bs") {
            lines.push({ label: "Bolívares (Bs)", value: `${fmt(budgetInBs)} Bs.` });
        }

        // Show conversions from Bs to other currencies
        if (budgetCurrency !== "USDT" && budgetRate > 0) {
            lines.push({ label: "USDT (P2P)", value: `${fmt(bsToUsdt(budgetInBs, rates))} USDT` });
        }
        if (budgetCurrency !== "$" && bcvUsd > 0) {
            lines.push({
                label: "Dólares (BCV)",
                value: `${fmt(bsToUsd(budgetInBs, rates))} USD`,
                highlighted: true,
            });
        }
        if (budgetCurrency !== "€" && bcvEur > 0) {
            lines.push({
                label: "Euros (BCV)",
                value: `${fmt(bsToEur(budgetInBs, rates))} EUR`,
                highlighted: true,
            });
        }

        return lines.length > 0 ? lines : undefined;
    }

    // ── Save ──

    async function handleSave() {
        try {
            const budget = parseFloat(budgetValue) || 0;
            await setMonthlyBudget(budget);
            await setBudgetCurrency(budgetCurrency);

            // Save the rate for the selected currency
            const rate = parseFloat(budgetRateValue) || 0;
            await setBudgetRate(rate);

            const year = parseInt(selectedYear, 10);
            const bcvUsd = parseFloat(bcvUsdRate) || 0;
            const bcvEur = parseFloat(bcvEurRate) || 0;
            if (bcvUsd > 0 || bcvEur > 0) {
                await setRates(selectedMonth, year, {
                    p2pRate: budgetCurrency === "USDT" ? rate : 0,
                    bcvUsdRate: bcvUsd,
                    bcvEurRate: bcvEur,
                });
            }

            // Also save daily rate for the selected day (non-critical)
            if (selectedDay) {
                await upsertDailyRate(selectedDay, {
                    p2pRate: budgetCurrency === "USDT" ? rate : 0,
                    bcvUsdRate: bcvUsd,
                    bcvEurRate: bcvEur,
                }).catch(() => {});
            }

            await Promise.all([
                useTransactionStore.getState().loadMonthlySummary(),
                useTransactionStore.getState().loadCategorySummaries(),
            ]);

            showSuccessToast("Configuración guardada correctamente");
        } catch {
            showErrorToast("Error al guardar la configuración");
        }
    }

    // ── Render ──

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 60,
                gap: 20,
            }}
        >
            {/* ── Budget ── */}
            <GlassCard style={{ marginTop: 48 }}>
                <SectionTitle label="Presupuesto Mensual" />
                <BudgetInput
                    value={budgetValue}
                    onChangeText={setBudgetValue}
                    currency={budgetCurrency}
                    onCurrencyChange={setBudgetCurrency}
                />

                {/* Show rate field when $, €, or USDT is selected */}
                {(budgetCurrency === "$" || budgetCurrency === "€" || budgetCurrency === "USDT") && (
                    <>
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 14,
                                fontWeight: "500",
                                color: colors.onSurface,
                                marginTop: 20,
                                marginBottom: 8,
                            }}
                        >
                            Tasa de Cambio
                        </Text>
                        <RateInputRow
                            label={
                                budgetCurrency === "$"
                                    ? "Dólar BCV (Bs.)"
                                    : budgetCurrency === "€"
                                        ? "Euro BCV (Bs.)"
                                        : "USDT / Bs (P2P)"
                            }
                            subtitle="Tasa al guardar"
                            value={budgetRateValue}
                            onChangeText={setBudgetRateValue}
                            highlighted={budgetCurrency === "USDT"}
                        />
                    </>
                )}

                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: "500",
                        color: colors.onSurface,
                        marginTop: 20,
                        marginBottom: 8,
                    }}
                >
                    Periodo
                </Text>
                <PeriodSelector
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={setSelectedMonth}
                    onYearChange={setSelectedYear}
                />
            </GlassCard>

            {/* ── Rates ── */}
            <GlassCard>
                <SectionTitle label="Tasas de Cambio" />
                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 13,
                        color: colors.outline,
                        marginBottom: 16,
                    }}
                >
                    Selecciona un día para ver las tasas BCV. Los datos se
                    cargan automáticamente del BCV.
                </Text>

                <RateCalendar
                    month={selectedMonth}
                    year={parseInt(selectedYear, 10)}
                    bcvUsdRate={bcvUsdRate}
                    bcvEurRate={bcvEurRate}
                    onBcvUsdRateChange={setBcvUsdRate}
                    onBcvEurRateChange={setBcvEurRate}
                    onDayChange={setSelectedDay}
                    conversionLines={buildConversionLines()}
                />
            </GlassCard>

            {/* ── Save ── */}
            <SaveButton onPress={handleSave} />
        </ScrollView>
    );
}
