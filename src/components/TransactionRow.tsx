import { Pressable, Text, View } from "react-native";

import { CategoryIcon } from "@/components/CategoryIcon";
import { useThemeColors } from "@/store/theme-store";
import type { Transaction } from "@/types";
import { CURRENCY_LABELS, formatCurrency, formatDate } from "@/utils/format";

interface TransactionRowProps {
    tx: Transaction;
    category?: { name: string; icon: string; color: string };
    onPress: () => void;
    onLongPress?: () => void;
}

export function TransactionRow({
    tx,
    category,
    onPress,
    onLongPress,
}: TransactionRowProps) {
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
