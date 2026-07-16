import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { Action } from "@/components/Action";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CreditCard } from "@/components/CreditCard";
import { SwipeableTransactionRow } from "@/components/SwipeableTransactionRow";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
import { showAlert } from '@/store/alert-store';
import { useSheetStore } from "@/store/sheet-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction } from "@/types";
import {
    ArrowDownLeft,
    CreditCard as CreditCardIcon,
    Inbox,
    ListFilter,
} from "lucide-react-native/icons";

const formatCurrency = (amount: number): string =>
    `${Math.abs(amount).toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const CURRENCY_LABELS: Record<string, string> = {
    bsc: "$",
    usdt: "USDT",
    eur: "€",
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

/**
 * Transaction row used in dashboard + transactions screen
 */
export function TransactionRow({
    tx,
    category,
    onPress,
    onLongPress,
}: {
    tx: Transaction;
    category?: { name: string; icon: string; color: string };
    onPress: () => void;
    onLongPress?: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            className="flex-row items-center px-4 py-3.5"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                    backgroundColor: (category?.color ?? "#6366f1") + "20",
                }}
            >
                <CategoryIcon
                    name={category?.icon ?? "circle-question-mark"}
                    size={18}
                    color={category?.color}
                />
            </View>
            <View className="flex-1 ml-3">
                <Text
                    className="text-sm font-medium"
                    style={{ fontFamily: "Inter", color: colors.onSurface }}
                >
                    {tx.description || category?.name || "Sin categoría"}
                </Text>
                <Text
                    className="text-xs mt-0.5"
                    style={{
                        fontFamily: "Inter",
                        color: colors.onSurfaceVariant,
                    }}
                >
                    {category?.name || "Sin categoría"} • {formatDate(tx.date)}
                </Text>
            </View>
            <View className="items-end">
                <Text
                    className="text-sm font-semibold"
                    style={{
                        fontFamily: "Inter",
                        color:
                            tx.type === "income"
                                ? colors.primary
                                : colors.error,
                    }}
                >
                    {tx.type === "income" ? "+ " : "- "}
                    {CURRENCY_LABELS[tx.currency] ?? tx.currency}{" "}
                    {formatCurrency(tx.amount)}
                </Text>
            </View>
        </Pressable>
    );
}

export default function DashboardScreen() {
    const colors = useThemeColors();
    const openSheet = useSheetStore((s) => s.openSheet);

    const transactions = useTransactionStore((s) => s.transactions);
    const monthlySummary = useTransactionStore((s) => s.monthlySummary);
    const categorySummaries = useTransactionStore((s) => s.categorySummaries);
    const categories = useCategoryStore((s) => s.categories);
    const isLoading = useTransactionStore((s) => s.isLoading);

    const monthlyBudget = usePreferencesStore((s) => s.monthlyBudget);
    const budgetCurrency = usePreferencesStore((s) => s.budgetCurrency);
    const getRates = useRateStore((s) => s.getRates);
    const netBalance = monthlySummary?.balance ?? 0;
    const totalIncome = monthlySummary?.totalIncome ?? 0;
    const totalExpense = monthlySummary?.totalExpense ?? 0;

    // Normalize monthlyBudget to USDT if user configured it in Bs
    let budgetInUsdt = monthlyBudget;
    if (budgetCurrency === 'Bs' && monthlySummary) {
        const [yearStr, monthStr] = monthlySummary.month.split("-");
        const m = parseInt(monthStr, 10) - 1;
        const y = parseInt(yearStr, 10);
        const p2p = getRates(m, y).p2pRate;
        if (p2p > 0) {
            budgetInUsdt = monthlyBudget / p2p;
        }
    }

    // Available: in Bs mode show only budget (normalized); in USDT mode show budget + net flow
    const displayBalance = budgetCurrency === 'Bs' ? budgetInUsdt : budgetInUsdt + netBalance;

    // ── USDT → USD/EUR conversion (reactive via ratesByMonth) ──
    const convert = useRateStore((s) => s.convert);
    const ratesByMonth = useRateStore((s) => s.ratesByMonth);

    const { balanceUsd, balanceEur } = useMemo(() => {
        if (!monthlySummary) return { balanceUsd: 0, balanceEur: 0 };
        const [yearStr, monthStr] = monthlySummary.month.split("-");
        const month = parseInt(monthStr, 10) - 1;
        const year = parseInt(yearStr, 10);
        const result = convert(displayBalance, month, year);
        return { balanceUsd: result.usd, balanceEur: result.eur };
    }, [displayBalance, monthlySummary, convert, ratesByMonth]);

    const getCategoryInfo = useCallback(
        (categoryId: number) => categories.find((c) => c.id === categoryId),
        [categories],
    );

    const recentTransactions = useMemo(
        () => transactions.slice(0, 5),
        [transactions],
    );

    const topExpenseCategories = useMemo(
        () =>
            categorySummaries
                .filter((c) => c.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 4),
        [categorySummaries],
    );

    const removeTransaction = useTransactionStore((s) => s.removeTransaction);

    const handleEditTransaction = useCallback(
        (transactionId: number) => {
            const tx = transactions.find((t) => t.id === transactionId);
            if (tx) openSheet(tx.type, tx);
        },
        [transactions, openSheet],
    );

    const handleDeleteTransaction = useCallback(
        async (transactionId: number) => {
            try {
                await removeTransaction(transactionId);
            } catch {
                showAlert("Error", "No se pudo eliminar la transacción");
            }
        },
        [removeTransaction],
    );

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const store = useTransactionStore.getState();
            await Promise.all([
                store.loadTransactions(),
                store.loadMonthlySummary(),
                store.loadCategorySummaries(),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, []);

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 96 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* ── Hero Balance Card ── */}
                <AnimatedSection delay={100} duration={600} style={{ paddingHorizontal: 20, paddingTop: 40 }}>
                    <CreditCard
                        balance={displayBalance}
                        totalIncome={totalIncome}
                        totalExpense={totalExpense}
                        balanceUsd={balanceUsd}
                        balanceEur={balanceEur}
                    />
                </AnimatedSection>

                {/* ── Quick Actions ── */}
                <View
                    style={{
                        flexDirection: "row",
                        gap: 12,
                        paddingHorizontal: 20,
                        marginTop: 20,
                    }}
                >
                    <AnimatedSection delay={200} duration={500} style={{ flex: 1 }}>
                        <Action
                            icon={ArrowDownLeft}
                            label="Ingreso"
                            onPress={() => openSheet("income")}
                        />
                    </AnimatedSection>

                    <AnimatedSection delay={300} duration={500} style={{ flex: 1 }}>
                        <Action
                            icon={CreditCardIcon}
                            label="Gasto"
                            color="#ce93d8"
                            onPress={() => openSheet("expense")}
                        />
                    </AnimatedSection>
                </View>

                {/* ── Transacciones Recientes ── */}
                <AnimatedSection delay={400} duration={600} style={{ marginTop: 28, paddingHorizontal: 20 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.onSurface,
                            }}
                        >
                            Transacciones Recientes
                        </Text>
                        <Pressable
                            onPress={() => router.push("/(tabs)/transactions")}
                        >
                            <ListFilter
                                size={18}
                                color={colors.onSurfaceVariant}
                            />
                        </Pressable>
                    </View>

                    {isLoading ? (
                        <AnimatedSection delay={600} duration={400}>
                            <View
                                style={{
                                    paddingVertical: 32,
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.onSurfaceVariant,
                                    }}
                                >
                                    Cargando...
                                </Text>
                            </View>
                        </AnimatedSection>
                    ) : recentTransactions.length === 0 ? (
                        <AnimatedSection delay={600} duration={500}>
                            <View
                                style={{
                                    backgroundColor: colors.glassSurface,
                                    borderWidth: 1,
                                    borderColor: colors.glassBorder,
                                    borderRadius: 12,
                                    padding: 32,
                                    alignItems: "center",
                                }}
                            >
                            <Inbox size={48} color={colors.onSurfaceVariant} />
                            <Text
                                style={{
                                    textAlign: "center",
                                    marginTop: 12,
                                    fontFamily: "Inter",
                                    color: colors.onSurfaceVariant,
                                }}
                            >
                                No hay movimientos este mes
                            </Text>
                            <Pressable
                                style={{
                                    marginTop: 16,
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    borderRadius: 9999,
                                    borderWidth: 1,
                                    borderColor: `${colors.primary}99`,
                                }}
                                onPress={() => openSheet("expense")}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        color: colors.primary,
                                        fontSize: 14,
                                    }}
                                >
                                    Agregar primero
                                </Text>
                                </Pressable>
                        </View>
                        </AnimatedSection>
                    ) : (
                        <View
                            style={{
                                backgroundColor: colors.glassSurface,
                                borderWidth: 1,
                                borderColor: colors.glassBorder,
                                borderRadius: 12,
                                overflow: "hidden",
                            }}
                        >
                            {recentTransactions.map(
                                (tx: Transaction, index: number) => {
                                    const category = getCategoryInfo(
                                        tx.categoryId,
                                    );
                                    return (
                                        <AnimatedSection key={tx.id} delay={500 + index * 120} duration={500} distance={20}>
                                            {index > 0 && (
                                                <View
                                                    style={{
                                                        height: 1,
                                                        backgroundColor:
                                                            colors.glassBorder,
                                                        marginLeft: 56,
                                                    }}
                                                />
                                            )}
                                            <SwipeableTransactionRow
                                                transactionId={tx.id}
                                                onEdit={handleEditTransaction}
                                                onDelete={handleDeleteTransaction}
                                            >
                                                <TransactionRow
                                                    tx={tx}
                                                    category={category}
                                                    onPress={() =>
                                                        openSheet(tx.type, tx)
                                                    }
                                                />
                                            </SwipeableTransactionRow>
                                        </AnimatedSection>
                                    );
                                },
                            )}
                        </View>
                    )}
                </AnimatedSection>

                {/* ── Gastos por Categoría ── */}
                {topExpenseCategories.length > 0 && (
                    <AnimatedSection delay={700} duration={600} style={{ marginTop: 28, paddingHorizontal: 20 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: colors.onSurface,
                                }}
                            >
                                Gastos por Categoría
                            </Text>
                            <Pressable
                                onPress={() =>
                                    router.push("/(tabs)/transactions")
                                }
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        fontWeight: "500",
                                        color: colors.primary,
                                    }}
                                >
                                    Ver todo
                                </Text>
                            </Pressable>
                        </View>

                        <View
                            style={{
                                backgroundColor: colors.glassSurface,
                                borderWidth: 1,
                                borderColor: colors.glassBorder,
                                borderRadius: 12,
                                padding: 16,
                                gap: 16,
                            }}
                        >
                            {topExpenseCategories.map((cat, index) => (
                                <AnimatedSection key={cat.categoryId} delay={800 + index * 120} duration={500} distance={16}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
                                    >
                                        {/* Icon circle */}
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 9999,
                                                backgroundColor:
                                                    (cat.categoryColor ||
                                                        "#6366f1") + "20",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <CategoryIcon
                                                name={cat.categoryIcon}
                                                size={18}
                                                color={cat.categoryColor}
                                            />
                                        </View>

                                        {/* Name + amounts */}
                                        <View style={{ flex: 1 }}>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 14,
                                                        fontWeight: "500",
                                                        color: colors.onSurface,
                                                    }}
                                                >
                                                    {cat.categoryName}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 14,
                                                        fontWeight: "600",
                                                        color: colors.onSurface,
                                                    }}
                                                >
                                                    ${formatCurrency(cat.total)}
                                                </Text>
                                            </View>

                                            <AnimatedProgressBar
                                                percentage={cat.percentage}
                                                color={cat.categoryColor || colors.primary}
                                                trackColor={colors.glassBorderStrong}
                                                delay={900 + index * 120}
                                                duration={700}
                                                height={6}
                                                radius={9999}
                                            />
                                        </View>
                                    </View>
                                </AnimatedSection>
                            ))}
                        </View>
                    </AnimatedSection>
                )}
            </ScrollView>
        </View>
    );
}
