import { ChevronDown } from "lucide-react-native/icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

type BudgetCurrency = "$" | "€" | "Bs" | "USDT";

interface BudgetInputProps {
    value: string;
    onChangeText: (text: string) => void;
    currency: BudgetCurrency;
    onCurrencyChange: (currency: BudgetCurrency) => void;
    size?: "sm" | "lg";
}

const CURRENCIES: BudgetCurrency[] = ["$", "€", "Bs", "USDT"];

/**
 * Budget amount input with currency dropdown. Used in fiscal and budget screens.
 * size="lg" for fiscal (36px font), size="sm" for budget categories (14px font).
 */
export function BudgetInput({
    value,
    onChangeText,
    currency,
    onCurrencyChange,
    size = "lg",
}: BudgetInputProps) {
    const colors = useThemeColors();
    const [showDropdown, setShowDropdown] = useState(false);

    const isLarge = size === "lg";

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: isLarge ? "baseline" : "center",
                gap: isLarge ? 8 : 4,
            }}
        >
            <TextInput
                style={{
                    fontFamily: "Geist",
                    fontSize: isLarge ? 36 : 14,
                    fontWeight: "700",
                    color: colors.onSurface,
                    minWidth: isLarge ? 140 : 60,
                    backgroundColor: isLarge ? "transparent" : `${colors.primary}33`,
                    borderWidth: isLarge ? 0 : 1,
                    borderColor: isLarge ? "transparent" : `${colors.primary}4d`,
                    borderRadius: isLarge ? 0 : 8,
                    paddingHorizontal: isLarge ? 0 : 8,
                    paddingVertical: isLarge ? 0 : 4,
                }}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChangeText}
                placeholder="0.00"
                placeholderTextColor={colors.outline}
            />
            <View style={{ position: "relative" }}>
                <Pressable
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: isLarge ? 12 : 6,
                        paddingVertical: isLarge ? 6 : 4,
                        borderRadius: 8,
                        backgroundColor: colors.glassSurface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                    }}
                    onPress={() => setShowDropdown(!showDropdown)}
                >
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: isLarge ? 16 : 12,
                            fontWeight: "600",
                            color: colors.onSurface,
                        }}
                    >
                        {currency}
                    </Text>
                    <ChevronDown size={isLarge ? 14 : 10} color={colors.outline} />
                </Pressable>
                {showDropdown && (
                    <View
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            marginTop: 4,
                            zIndex: 50,
                            borderRadius: 12,
                            overflow: "hidden",
                            backgroundColor: colors.surfaceContainer,
                            borderWidth: 1,
                            borderColor: colors.glassBorderStrong,
                            minWidth: 100,
                        }}
                    >
                        {CURRENCIES.map((c) => (
                            <Pressable
                                key={c}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    backgroundColor:
                                        currency === c
                                            ? `${colors.primary}4D`
                                            : "transparent",
                                }}
                                onPress={() => {
                                    onCurrencyChange(c);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 14,
                                        fontWeight: "500",
                                        color:
                                            currency === c
                                                ? colors.primary
                                                : colors.onSurface,
                                    }}
                                >
                                    {c}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
