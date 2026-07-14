import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Action } from "@/components/Action";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CreditCard } from "@/components/CreditCard";
import { useCategoryStore } from "@/store/category-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRateStore } from "@/store/rate-store";
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
    `$${Math.abs(amount).toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

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
    console.log('[dashboard] monthlyBudget:', monthlyBudget);
    console.log('[dashboard] netBalance:', monthlySummary?.balance);
    console.log('[dashboard] displayBalance:', monthlyBudget + (monthlySummary?.balance ?? 0));
    const netBalance = monthlySummary?.balance ?? 0;
    const totalIncome = monthlySummary?.totalIncome ?? 0;
    const totalExpense = monthlySummary?.totalExpense ?? 0;

    // Available = monthly budget + income - expense
    const displayBalance = monthlyBudget + netBalance;

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

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 96 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero Balance Card ── */}
                <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
                    <CreditCard
                        balance={displayBalance}
                        totalIncome={totalIncome}
                        totalExpense={totalExpense}
                        balanceUsd={balanceUsd}
                        balanceEur={balanceEur}
                    />
                </View>

                {/* ── Quick Actions ── */}
                <View
                    style={{
                        flexDirection: "row",
                        gap: 12,
                        paddingHorizontal: 20,
                        marginTop: 20,
                    }}
                >
                    <Action
                        icon={ArrowDownLeft}
                        label="Ingreso"
                        onPress={() => openSheet("income")}
                    />

                    <Action
                        icon={CreditCardIcon}
                        label="Gasto"
                        color="#ce93d8"
                        onPress={() => openSheet("expense")}
                    />
                </View>

                {/* ── Gastos por Categoría ── */}
                {topExpenseCategories.length > 0 && (
                    <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
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
                            {topExpenseCategories.map((cat) => (
                                <View key={cat.categoryId}>
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
                                                    {formatCurrency(cat.total)}
                                                </Text>
                                            </View>

                                            {/* Progress bar */}
                                            <View
                                                style={{
                                                    height: 6,
                                                    borderRadius: 9999,
                                                    overflow: "hidden",
                                                    backgroundColor:
                                                        colors.glassBorderStrong,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: "100%",
                                                        width: `${cat.percentage}%`,
                                                        borderRadius: 9999,
                                                        backgroundColor:
                                                            cat.categoryColor ||
                                                            "#57f1db",
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Transacciones Recientes ── */}
                <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
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
                    ) : recentTransactions.length === 0 ? (
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
                                    borderColor: `${colors.primary}66`,
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
                                        <View key={tx.id}>
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
                                            <TransactionRow
                                                tx={tx}
                                                category={category}
                                                onPress={() =>
                                                    router.push({
                                                        pathname:
                                                            "/add-transaction",
                                                        params: { id: tx.id },
                                                    })
                                                }
                                            />
                                        </View>
                                    );
                                },
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
