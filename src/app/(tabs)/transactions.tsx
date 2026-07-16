import { AnimatedSection } from "@/components/AnimatedSection";
import { EmptyState } from "@/components/EmptyState";
import { FilterPills } from "@/components/FilterPills";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { SearchBar } from "@/components/SearchBar";
import { SwipeableTransactionRow } from "@/components/SwipeableTransactionRow";
import { TransactionRow } from "@/components/TransactionRow";
import { showAlert } from "@/store/alert-store";
import { useCategoryStore } from "@/store/category-store";
import { useSheetStore } from "@/store/sheet-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction, TransactionType } from "@/types";
import { router } from "expo-router";
import { Inbox } from "lucide-react-native/icons";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

// ── Date Grouping ────────────────────────────────────────────────────────────

const getDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);

    if (date.getTime() === today.getTime()) return "Hoy";
    if (date.getTime() === yesterday.getTime()) return "Ayer";
    if (date.getTime() >= weekStart.getTime()) return "Esta Semana";
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
    });
};

// ── Constants ────────────────────────────────────────────────────────────────

type FilterType = "all" | TransactionType;
const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "expense", label: "Gastos" },
    { key: "income", label: "Ingresos" },
];

// ── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
    const colors = useThemeColors();
    const transactions = useTransactionStore((s) => s.transactions);
    const removeTransaction = useTransactionStore((s) => s.removeTransaction);
    const categories = useCategoryStore((s) => s.categories);
    const openSheet = useSheetStore((s) => s.openSheet);

    const [filterType, setFilterType] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // ── Derived Data ──────────────────────────────────────────────────────

    const getCategoryInfo = useCallback(
        (categoryId: number) =>
            categories.find((c) => c.id === categoryId),
        [categories],
    );

    const filteredTransactions = useMemo(() => {
        let result = transactions;
        if (filterType !== "all") {
            result = result.filter((tx) => tx.type === filterType);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((tx) => {
                const cat = getCategoryInfo(tx.categoryId);
                return (
                    tx.description.toLowerCase().includes(q) ||
                    cat?.name.toLowerCase().includes(q)
                );
            });
        }
        return result;
    }, [transactions, filterType, searchQuery, getCategoryInfo]);

    const grouped = useMemo(() => {
        const map = new Map<string, Transaction[]>();
        for (const tx of filteredTransactions) {
            const label = getDateLabel(tx.date);
            if (!map.has(label)) map.set(label, []);
            map.get(label)!.push(tx);
        }
        return map;
    }, [filteredTransactions]);

    // ── Handlers ──────────────────────────────────────────────────────────

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
                showAlert(
                    "Error",
                    "No se pudo eliminar la transacción",
                );
            }
        },
        [removeTransaction],
    );

    // ── Pull-to-Refresh ───────────────────────────────────────────────────

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

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, paddingTop: 42 }}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar comercio o categoría..."
                />

                <FilterPills
                    filters={FILTERS}
                    activeFilter={filterType}
                    onFilterChange={(k) => setFilterType(k as FilterType)}
                />

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                >
                    {filteredTransactions.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            message="No hay movimientos"
                        />
                    ) : (
                        Array.from(grouped.entries()).map(
                            ([label, txs]) => (
                                <AnimatedSection
                                    key={label}
                                    delay={0}
                                    duration={400}
                                >
                                    <View style={{ marginBottom: 24 }}>
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 13,
                                                fontWeight: "600",
                                                color: colors.onSurfaceVariant,
                                                marginBottom: 12,
                                                paddingHorizontal: 20,
                                            }}
                                        >
                                            {label}
                                        </Text>

                                        <View
                                            style={{
                                                backgroundColor:
                                                    colors.surfaceContainer,
                                                borderRadius: 12,
                                                marginHorizontal: 20,
                                            }}
                                        >
                                            {txs.map(
                                                (tx, index) => (
                                                    <AnimatedSection
                                                        key={tx.id}
                                                        delay={
                                                            index * 80
                                                        }
                                                        duration={
                                                            400
                                                        }
                                                    >
                                                        <SwipeableTransactionRow
                                                            transactionId={
                                                                tx.id
                                                            }
                                                            onEdit={
                                                                handleEditTransaction
                                                            }
                                                            onDelete={
                                                                handleDeleteTransaction
                                                            }
                                                        >
                                                            <TransactionRow
                                                                tx={
                                                                    tx
                                                                }
                                                                category={getCategoryInfo(
                                                                    tx.categoryId,
                                                                )}
                                                                onPress={() =>
                                                                    openSheet(
                                                                        tx.type,
                                                                        tx,
                                                                    )
                                                                }
                                                            />
                                                        </SwipeableTransactionRow>
                                                    </AnimatedSection>
                                                ),
                                            )}
                                        </View>
                                    </View>
                                </AnimatedSection>
                            ),
                        )
                    )}
                </ScrollView>
            </View>

            <FloatingAddButton
                onPress={() => router.push("/add-transaction")}
            />
        </View>
    );
}
