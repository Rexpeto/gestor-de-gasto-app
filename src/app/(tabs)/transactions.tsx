import { CategoryIcon } from "@/components/CategoryIcon";
import { useCategoryStore } from "@/store/category-store";
import { useThemeColors } from "@/store/theme-store";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction, TransactionType } from "@/types";
import { router } from "expo-router";
import { Inbox, Plus, Search } from "lucide-react-native/icons";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const formatCurrency = (amount: number): string =>
    `$${Math.abs(amount).toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

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
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
};

type FilterType = "all" | TransactionType;
const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "expense", label: "Gastos" },
    { key: "income", label: "Ingresos" },
];

export default function TransactionsScreen() {
    const colors = useThemeColors();
    const transactions = useTransactionStore((s) => s.transactions);
    const removeTransaction = useTransactionStore((s) => s.removeTransaction);
    const categories = useCategoryStore((s) => s.categories);
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const getCategoryInfo = useCallback(
        (categoryId: number) => categories.find((c) => c.id === categoryId),
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

    const handleDelete = (tx: Transaction) => {
        const category = getCategoryInfo(tx.categoryId);
        Alert.alert(
            "Eliminar movimiento",
            `¿Eliminar ${tx.description || category?.name || "este movimiento"} por ${formatCurrency(tx.amount)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => removeTransaction(tx.id),
                },
            ],
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Content Container */}
            <View style={{ flex: 1, paddingTop: 116 }}>
                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "rgba(33, 33, 33, 0.7)",
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                        }}
                    >
                        <Search size={20} color="#888888" />
                        <TextInput
                            style={{
                                marginLeft: 8,
                                fontFamily: "Inter",
                                fontSize: 15,
                                color: "#ffffff",
                                flex: 1,
                                backgroundColor: "transparent",
                                borderWidth: 0,
                                padding: 0,
                            }}
                            placeholder="Buscar comercio o categoría..."
                            placeholderTextColor="#888888"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Filter Pills */}
                <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            {FILTERS.map((f) => {
                                const active = filterType === f.key;
                                return (
                                    <Pressable
                                        key={f.key}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            backgroundColor: active
                                                ? colors.primary
                                                : colors.surfaceContainer,
                                            borderWidth: active ? 0 : 1,
                                            borderColor: "#3c4a46",
                                            ...(active
                                                ? {
                                                      shadowColor: "#57f1db",
                                                      shadowOffset: {
                                                          width: 0,
                                                          height: 4,
                                                      },
                                                      shadowOpacity: 0.25,
                                                      shadowRadius: 8,
                                                  }
                                                : {}),
                                        }}
                                        onPress={() => setFilterType(f.key)}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 13,
                                                fontWeight: "600",
                                                color: active
                                                    ? colors.background
                                                    : colors.onSurfaceVariant,
                                            }}
                                        >
                                            {f.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* Transaction Groups */}
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {filteredTransactions.length === 0 ? (
                        <View style={{ alignItems: "center", marginTop: 64 }}>
                            <Inbox size={48} color="#888888" />
                            <Text
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 15,
                                    color: "#888888",
                                    marginTop: 12,
                                }}
                            >
                                No hay movimientos
                            </Text>
                        </View>
                    ) : (
                        Array.from(grouped.entries()).map(([label, txs]) => (
                            <View key={label} style={{ marginBottom: 24 }}>
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
                                        overflow: "hidden",
                                    }}
                                >
                                    {txs.map((tx, index) => {
                                        const cat = getCategoryInfo(
                                            tx.categoryId,
                                        );
                                        const isExpense = tx.type === "expense";
                                        const time = "14:30";
                                        return (
                                            <Pressable
                                                key={tx.id}
                                                onLongPress={() =>
                                                    handleDelete(tx)
                                                }
                                                onPress={() =>
                                                    router.push({
                                                        pathname:
                                                            "/add-transaction",
                                                        params: { id: tx.id },
                                                    })
                                                }
                                                style={({ pressed }) => ({
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 16,
                                                    borderBottomWidth:
                                                        index < txs.length - 1
                                                            ? 1
                                                            : 0,
                                                    borderBottomColor:
                                                        colors.glassBorder,
                                                    backgroundColor: pressed
                                                        ? `${colors.primary}0D`
                                                        : "transparent",
                                                })}
                                            >
                                                <View
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 8,
                                                        backgroundColor:
                                                            cat?.color
                                                                ? `${cat.color}20`
                                                                : `${colors.primary}1A`,
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        marginRight: 16,
                                                    }}
                                                >
                                                    <CategoryIcon
                                                        name={
                                                            cat?.icon ??
                                                            "circle-question-mark"
                                                        }
                                                        size={20}
                                                        color={cat?.color}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontSize: 15,
                                                            fontWeight: "600",
                                                            color: colors.onSurface,
                                                        }}
                                                    >
                                                        {tx.description}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontSize: 13,
                                                            color: colors.onSurfaceVariant,
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {cat?.name ||
                                                            "Sin categoría"}{" "}
                                                        • {time}
                                                    </Text>
                                                </View>
                                                <Text
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 15,
                                                        fontWeight: "600",
                                                        color: isExpense
                                                            ? colors.error
                                                            : colors.primary,
                                                        fontVariant: [
                                                            "tabular-nums",
                                                        ],
                                                    }}
                                                >
                                                    {isExpense ? "-" : "+"}
                                                    {formatCurrency(tx.amount)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* FAB */}
            <Pressable
                style={{
                    position: "absolute",
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    zIndex: 30,
                }}
                onPress={() => router.push("/add-transaction")}
            >
                <Plus size={24} color={colors.background} strokeWidth={2.5} />
            </Pressable>
        </View>
    );
}
