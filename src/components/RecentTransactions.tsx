import { Pressable, Text, View } from "react-native";
import { Inbox, ListFilter } from "lucide-react-native/icons";

import { AnimatedSection } from "@/components/AnimatedSection";
import { SwipeableTransactionRow } from "@/components/SwipeableTransactionRow";
import { TransactionRow } from "@/components/TransactionRow";
import type { Transaction } from "@/types";
import type { ThemeColors } from "@/store/theme-store";

interface RecentTransactionsProps {
    transactions: Transaction[];
    isLoading: boolean;
    colors: ThemeColors;
    onEditTransaction: (transactionId: number) => void;
    onDeleteTransaction: (transactionId: number) => void;
    onTransactionPress: (type: Transaction['type'], tx: Transaction) => void;
    onAddFirstTransaction?: () => void;
    onNavigateToTransactions: () => void;
    getCategoryInfo: (categoryId: number) => { name: string; icon: string; color: string } | undefined;
}

export function RecentTransactions({
    transactions,
    isLoading,
    colors,
    onEditTransaction,
    onDeleteTransaction,
    onTransactionPress,
    onAddFirstTransaction,
    onNavigateToTransactions,
    getCategoryInfo,
}: RecentTransactionsProps) {
    return (
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
                <Pressable onPress={onNavigateToTransactions}>
                    <ListFilter size={18} color={colors.onSurfaceVariant} />
                </Pressable>
            </View>

            {isLoading ? (
                <AnimatedSection delay={600} duration={400}>
                    <View style={{ paddingVertical: 32, alignItems: "center" }}>
                        <Text style={{ fontFamily: "Inter", color: colors.onSurfaceVariant }}>
                            Cargando...
                        </Text>
                    </View>
                </AnimatedSection>
            ) : transactions.length === 0 ? (
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
                            onPress={onAddFirstTransaction ?? (() => {})}
                        >
                            <Text style={{ fontFamily: "Inter", color: colors.primary, fontSize: 14 }}>
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
                    {transactions.map((tx: Transaction, index: number) => {
                        const category = getCategoryInfo(tx.categoryId);
                        return (
                            <AnimatedSection key={tx.id} delay={500 + index * 120} duration={500} distance={20}>
                                {index > 0 && (
                                    <View
                                        style={{
                                            height: 1,
                                            backgroundColor: colors.glassBorder,
                                            marginLeft: 56,
                                        }}
                                    />
                                )}
                                <SwipeableTransactionRow
                                    transactionId={tx.id}
                                    onEdit={onEditTransaction}
                                    onDelete={onDeleteTransaction}
                                >
                                    <TransactionRow
                                        tx={tx}
                                        category={category}
                                        onPress={() => onTransactionPress(tx.type, tx)}
                                    />
                                </SwipeableTransactionRow>
                            </AnimatedSection>
                        );
                    })}
                </View>
            )}
        </AnimatedSection>
    );
}
