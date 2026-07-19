import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { AnimatedSection } from "@/components/AnimatedSection";
import { CategorySummaryList } from "@/components/CategorySummaryList";
import { CreditCard } from "@/components/CreditCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentTransactions } from "@/components/RecentTransactions";
import { showAlert } from "@/store/alert-store";
import { useBudgetStore } from "@/store/budget-store";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useSheetStore } from "@/store/sheet-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction } from "@/types";

export default function DashboardScreen() {
    const colors = useThemeColors();
    const openSheet = useSheetStore((s) => s.openSheet);

    const transactions = useTransactionStore((s) => s.transactions);
    const monthlySummary = useTransactionStore((s) => s.monthlySummary);
    const incomeCategorySummaries = useTransactionStore((s) => s.incomeCategorySummaries);
    const expenseCategorySummaries = useTransactionStore((s) => s.expenseCategorySummaries);
    const categories = useCategoryStore((s) => s.categories);
    const budgets = useBudgetStore((s) => s.budgets);
    const isLoading = useTransactionStore((s) => s.isLoading);

    const monthlyBudget = usePreferencesStore((s) => s.monthlyBudget);
    const budgetCurrency = usePreferencesStore((s) => s.budgetCurrency);
    const totalIncome = monthlySummary?.totalIncome ?? 0; // Already in Bs
    const totalExpense = monthlySummary?.totalExpense ?? 0; // Already in Bs

    const getCategoryInfo = useCallback(
        (categoryId: number) => categories.find((c) => c.id === categoryId),
        [categories],
    );

    const recentTransactions = useMemo(
        () => transactions.slice(0, 5),
        [transactions],
    );

    const topIncomeCategories = useMemo(
        () =>
            incomeCategorySummaries
                .filter((c) => c.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 4),
        [incomeCategorySummaries],
    );

    const topExpenseCategories = useMemo(
        () =>
            expenseCategorySummaries
                .filter((c) => c.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 4),
        [expenseCategorySummaries],
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

    const handleTransactionPress = useCallback(
        (type: Transaction['type'], tx: Transaction) => openSheet(type, tx),
        [openSheet],
    );

    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const txStore = useTransactionStore.getState();
            const catStore = useCategoryStore.getState();
            const rateStore = useRateStore.getState();
            const prefsStore = usePreferencesStore.getState();
            await Promise.all([
                txStore.loadTransactions(),
                txStore.loadMonthlySummary(),
                txStore.loadCategorySummaries(),
                catStore.loadCategories(),
                rateStore.loadRates(),
                prefsStore.loadPreferences(),
            ]);
            setRefreshKey((k) => k + 1);
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
                <View key={refreshKey}>
                {/* ── Hero Balance Card ── */}
                <AnimatedSection delay={100} duration={600} style={{ paddingHorizontal: 20, paddingTop: 40 }}>
                    <CreditCard
                        budgetAmount={monthlyBudget}
                        budgetCurrency={budgetCurrency}
                        totalIncome={totalIncome}
                        totalExpense={totalExpense}
                    />
                </AnimatedSection>

                {/* ── Quick Actions ── */}
                <QuickActions
                    onIncomePress={() => openSheet("income")}
                    onExpensePress={() => openSheet("expense")}
                />

                {/* ── Transacciones Recientes ── */}
                <RecentTransactions
                    transactions={recentTransactions}
                    isLoading={isLoading}
                    colors={colors}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onTransactionPress={handleTransactionPress}
                    onAddFirstTransaction={() => openSheet("expense")}
                    onNavigateToTransactions={() => router.push("/(tabs)/transactions")}
                    getCategoryInfo={getCategoryInfo}
                />

                {/* ── Ingresos por Categoría ── */}
                <CategorySummaryList
                    title="Ingresos por Categoría"
                    categories={topIncomeCategories}
                    budgets={budgets}
                    colors={colors}
                    delay={700}
                    type="income"
                />

                {/* ── Gastos por Categoría ── */}
                <CategorySummaryList
                    title="Gastos por Categoría"
                    categories={topExpenseCategories}
                    budgets={budgets}
                    colors={colors}
                    delay={900}
                    type="expense"
                />
                </View>
            </ScrollView>
        </View>
    );
}
