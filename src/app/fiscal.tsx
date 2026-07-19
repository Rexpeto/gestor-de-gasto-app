import { Wallet } from "lucide-react-native/icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text } from "react-native";

import { showErrorToast, showSuccessToast } from "@/components/ThemedToast";
import { GlassCard } from "@/components/settings/GlassCard";
import { SectionTitle } from "@/components/settings/SectionTitle";
import { BudgetInput } from "@/components/fiscal/BudgetInput";
import { RateCalendar } from "@/components/fiscal/RateCalendar";
import { PeriodSelector } from "@/components/fiscal/PeriodSelector";
import { SaveButton } from "@/components/fiscal/SaveButton";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import { budgetToBs, bsToUsdt, bsToUsd, bsToEur } from "@/utils/currency";

// ── Screen ───────────────────────────────────────────────────────────────────

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
    const [budgetValue, setBudgetValue] = useState(
        String(monthlyBudget > 0 ? monthlyBudget : ""),
    );
    const [p2pRate, setP2pRate] = useState("");
    const [bcvUsdRate, setBcvUsdRate] = useState("");
    const [bcvEurRate, setBcvEurRate] = useState("");

    // ── Effects ──

    const budgetInitialized = useRef(false);
    useEffect(() => {
        if (monthlyBudget > 0 && !budgetInitialized.current) {
            budgetInitialized.current = true;
            setBudgetValue(String(monthlyBudget));
        }
    }, [monthlyBudget]);

    const initRef = useRef(false);
    useEffect(() => {
        if (!loaded) loadRates();
    }, [loaded, loadRates]);

    // When store rates are loaded or month changes, populate inputs
    useEffect(() => {
        if (!loaded) return;
        const key = `${selectedMonth}-${selectedYear}`;
        const rates = storeRatesByMonth[key];
        if (rates) {
            setP2pRate(String(rates.p2pRate || ""));
            setBcvUsdRate(String(rates.bcvUsdRate || ""));
            setBcvEurRate(String(rates.bcvEurRate || ""));
        } else {
            setP2pRate("");
            setBcvUsdRate("");
            setBcvEurRate("");
        }
    }, [loaded, storeRatesByMonth, selectedMonth, selectedYear]);

    // ── Conversion lines ──

    function buildConversionLines() {
        const p2p = parseFloat(p2pRate) || 0;
        const bcvUsd = parseFloat(bcvUsdRate) || 0;
        const bcvEur = parseFloat(bcvEurRate) || 0;
        const budget = parseFloat(budgetValue) || 0;
        const rates = { p2pRate: p2p, bcvUsdRate: bcvUsd, bcvEurRate: bcvEur };

        const hasData =
            budget > 0 &&
            (budgetCurrency === "USDT"
                ? p2p > 0
                : bcvUsd > 0 || bcvEur > 0 || p2p > 0);

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
        if (budgetCurrency !== "USDT" && p2p > 0) {
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

            const year = parseInt(selectedYear, 10);
            const p2p = parseFloat(p2pRate) || 0;
            const bcvUsd = parseFloat(bcvUsdRate) || 0;
            const bcvEur = parseFloat(bcvEurRate) || 0;
            if (p2p > 0 || bcvUsd > 0 || bcvEur > 0) {
                await setRates(selectedMonth, year, {
                    p2pRate: p2p,
                    bcvUsdRate: bcvUsd,
                    bcvEurRate: bcvEur,
                });
            }

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
                    p2pRate={p2pRate}
                    bcvUsdRate={bcvUsdRate}
                    bcvEurRate={bcvEurRate}
                    onP2pRateChange={setP2pRate}
                    onBcvUsdRateChange={setBcvUsdRate}
                    onBcvEurRateChange={setBcvEurRate}
                    conversionLines={buildConversionLines()}
                />
            </GlassCard>

            {/* ── Save ── */}
            <SaveButton onPress={handleSave} />
        </ScrollView>
    );
}
