import { ChevronDown, ChevronRight } from "lucide-react-native/icons";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";
import { RateInputRow } from "./RateInputRow";
import { ConversionSummary } from "./ConversionSummary";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MonthRates {
    p2p: string;
    bcvUsd: string;
    bcvEur: string;
}

interface MonthAccordionProps {
    monthIndex: number;
    year: string;
    isExpanded: boolean;
    rates: MonthRates;
    onToggle: () => void;
    onRateChange: (field: "p2p" | "bcvUsd" | "bcvEur", value: string) => void;
    conversionLines?: { label: string; value: string; highlighted?: boolean }[];
}

/**
 * Expandable month section with rate inputs and optional conversion summary.
 * Used in fiscal settings.
 */
export function MonthAccordion({
    monthIndex,
    year,
    isExpanded,
    rates,
    onToggle,
    onRateChange,
    conversionLines,
}: MonthAccordionProps) {
    const colors = useThemeColors();
    return (
        <View
            style={{
                marginBottom: 12,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.glassBorder,
            }}
        >
            <Pressable
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: colors.glassSurface,
                }}
                onPress={onToggle}
            >
                <Text
                    style={{
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.onSurface,
                    }}
                >
                    {MONTHS[monthIndex]} {year}
                </Text>
                {isExpanded ? (
                    <ChevronDown size={16} color={colors.outline} />
                ) : (
                    <ChevronRight size={16} color={colors.outline} />
                )}
            </Pressable>

            {isExpanded && (
                <View style={{ padding: 16, gap: 16 }}>
                    <View>
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 12,
                                fontWeight: "600",
                                letterSpacing: 0.05,
                                textTransform: "uppercase",
                                color: colors.onSurfaceVariant,
                                marginBottom: 8,
                            }}
                        >
                            Tasas de Cambio
                        </Text>
                        <View style={{ gap: 8 }}>
                            <RateInputRow
                                label="Dólar P2P (Bs.)"
                                subtitle="Referencia Binance"
                                value={rates.p2p}
                                onChangeText={(v) => onRateChange("p2p", v)}
                                highlighted
                            />
                            <RateInputRow
                                label="Dólar BCV (Bs.)"
                                subtitle="Oficial BCV"
                                value={rates.bcvUsd}
                                onChangeText={(v) => onRateChange("bcvUsd", v)}
                            />
                            <RateInputRow
                                label="Euro BCV (Bs.)"
                                subtitle="Oficial BCV"
                                value={rates.bcvEur}
                                onChangeText={(v) => onRateChange("bcvEur", v)}
                            />
                        </View>
                    </View>

                    {conversionLines && conversionLines.length > 0 && (
                        <ConversionSummary
                            title="Resumen de Conversión"
                            lines={conversionLines}
                        />
                    )}
                </View>
            )}
        </View>
    );
}
