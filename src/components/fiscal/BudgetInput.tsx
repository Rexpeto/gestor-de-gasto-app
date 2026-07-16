import { ChevronDown } from "lucide-react-native/icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface BudgetInputProps {
    value: string;
    onChangeText: (text: string) => void;
    currency: string;
    onCurrencyChange: (currency: "USDT" | "Bs") => void;
}

const CURRENCIES = ["USDT", "Bs"];

/**
 * Large budget amount input with currency dropdown. Used in fiscal settings.
 */
export function BudgetInput({
    value,
    onChangeText,
    currency,
    onCurrencyChange,
}: BudgetInputProps) {
    const colors = useThemeColors();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
            }}
        >
            <TextInput
                style={{
                    fontFamily: "Geist",
                    fontSize: 36,
                    fontWeight: "700",
                    color: colors.onSurface,
                    minWidth: 140,
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
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
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
                            fontSize: 16,
                            fontWeight: "600",
                            color: colors.onSurface,
                        }}
                    >
                        {currency}
                    </Text>
                    <ChevronDown size={14} color={colors.outline} />
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
                                    onCurrencyChange(c as "USDT" | "Bs");
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
