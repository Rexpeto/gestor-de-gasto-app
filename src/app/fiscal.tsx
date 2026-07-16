import { ArrowLeftRight, Wallet } from "lucide-react-native/icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { showErrorToast, showSuccessToast } from "@/components/ThemedToast";
import { GlassCard } from "@/components/settings/GlassCard";
import { SectionTitle } from "@/components/settings/SectionTitle";
import { BudgetInput } from "@/components/fiscal/BudgetInput";
import { MonthAccordion } from "@/components/fiscal/MonthAccordion";
import { PeriodSelector } from "@/components/fiscal/PeriodSelector";
import { SaveButton } from "@/components/fiscal/SaveButton";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";

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
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
        new Set([`${new Date().getMonth()}-${new Date().getFullYear()}`]),
    );
    const [inputRates, setInputRates] = useState<
        Record<string, { p2p: string; bcvUsd: string; bcvEur: string }>
    >({});

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

    useEffect(() => {
        if (loaded && !initRef.current) {
            initRef.current = true;
            const initial: Record<string, { p2p: string; bcvUsd: string; bcvEur: string }> = {};
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

    // ── Helpers ──

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

    function toggleMonth(key: string) {
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function buildConversionLines(key: string) {
        const rates = getInputRates(key);
        const p2p = parseFloat(rates.p2p) || 0;
        const bcvUsd = parseFloat(rates.bcvUsd) || 0;
        const bcvEur = parseFloat(rates.bcvEur) || 0;
        const budget = parseFloat(budgetValue) || 0;

        const hasData =
            budget > 0 &&
            (budgetCurrency === "USDT"
                ? p2p > 0
                : bcvUsd > 0 || bcvEur > 0 || p2p > 0);

        if (!hasData) return undefined;

        const fmt = (n: number) =>
            n.toLocaleString("es-VE", { minimumFractionDigits: 2 });

        if (budgetCurrency === "USDT") {
            const lines: { label: string; value: string; highlighted?: boolean }[] = [
                { label: "Bolívares (P2P)", value: `${fmt(budget * p2p)} Bs.` },
            ];
            if (bcvUsd > 0)
                lines.push({
                    label: "Dólares (BCV)",
                    value: `${fmt((budget * p2p) / bcvUsd)} USD`,
                    highlighted: true,
                });
            if (bcvEur > 0)
                lines.push({
                    label: "Euros (BCV)",
                    value: `${fmt((budget * p2p) / bcvEur)} EUR`,
                    highlighted: true,
                });
            return lines;
        }

        const lines: { label: string; value: string; highlighted?: boolean }[] = [];
        if (p2p > 0)
            lines.push({ label: "USDT (P2P)", value: `${fmt(budget / p2p)} USDT` });
        if (bcvUsd > 0)
            lines.push({
                label: "Dólares (BCV)",
                value: `${fmt(budget / bcvUsd)} USD`,
                highlighted: true,
            });
        if (bcvEur > 0)
            lines.push({
                label: "Euros (BCV)",
                value: `${fmt(budget / bcvEur)} EUR`,
                highlighted: true,
            });
        return lines;
    }

    // ── Save ──

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
                if (p2pRate === 0 && bcvUsdRate === 0 && bcvEurRate === 0) continue;
                await setRates(m, year, { p2pRate, bcvUsdRate, bcvEurRate });
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

    const yearMonths = Array.from({ length: 12 }, (_, i) => ({
        index: i,
        key: `${i}-${selectedYear}`,
    }));

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
                <SectionTitle label="Tasas (por mes)" />
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

                {yearMonths.map(({ index, key }) => (
                    <MonthAccordion
                        key={key}
                        monthIndex={index}
                        year={selectedYear}
                        isExpanded={expandedMonths.has(key)}
                        rates={getInputRates(key)}
                        onToggle={() => toggleMonth(key)}
                        onRateChange={(field, value) =>
                            updateRate(key, field, value)
                        }
                        conversionLines={buildConversionLines(key)}
                    />
                ))}
            </GlassCard>

            {/* ── Save ── */}
            <SaveButton onPress={handleSave} />
        </ScrollView>
    );
}
