import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useThemeColors } from "@/store/theme-store";
import { useBcvRates } from "@/hooks/useBcvRates";
import { RateInputRow } from "./RateInputRow";
import { ConversionSummary } from "./ConversionSummary";

// ── Spanish locale for react-native-calendars ──
LocaleConfig.locales["es"] = {
    monthNames: [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
    monthNamesShort: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ],
    dayNames: [
        "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
    ],
    dayNamesShort: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
    today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface RateCalendarProps {
    month: number; // 0-indexed
    year: number;
    p2pRate: string;
    bcvUsdRate: string;
    bcvEurRate: string;
    onP2pRateChange: (rate: string) => void;
    onBcvUsdRateChange: (rate: string) => void;
    onBcvEurRateChange: (rate: string) => void;
    onDayChange?: () => void;
    conversionLines?: { label: string; value: string; highlighted?: boolean }[];
}

/**
 * Calendar-based rate picker. Fetches daily BCV rates from dolarapi.com.
 * Days with available data show a green dot. Tapping a day auto-fills BCV rates.
 */
export function RateCalendar({
    month,
    year,
    p2pRate,
    bcvUsdRate,
    bcvEurRate,
    onP2pRateChange,
    onBcvUsdRateChange,
    onBcvEurRateChange,
    onDayChange,
    conversionLines,
}: RateCalendarProps) {
    const colors = useThemeColors();
    const { ratesByDate, isLoading } = useBcvRates();

    // Auto-select today's date on mount
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Reset selected day when month/year changes
    useEffect(() => {
        setSelectedDate(null);
    }, [month, year]);

    // Auto-fill rates from BCV data when today is selected on mount
    useEffect(() => {
        if (selectedDate && ratesByDate[selectedDate]) {
            const rate = ratesByDate[selectedDate];
            if (rate.usd > 0) onBcvUsdRateChange(String(Math.trunc(rate.usd * 1000) / 1000));
            if (rate.eur > 0) onBcvEurRateChange(String(Math.trunc(rate.eur * 1000) / 1000));
        }
    }, [selectedDate, ratesByDate]);

    // Build markedDates for react-native-calendars
    const markedDates = useMemo(() => {
        const marks: Record<
            string,
            {
                marked?: boolean;
                dotColor?: string;
                selected?: boolean;
                selectedColor?: string;
            }
        > = {};

        // Mark days that have BCV data
        for (const dateStr of Object.keys(ratesByDate)) {
            const rate = ratesByDate[dateStr];
            if (rate.usd > 0 || rate.eur > 0) {
                marks[dateStr] = { marked: true, dotColor: colors.success };
            }
        }

        // Mark selected day
        if (selectedDate) {
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: colors.primary,
            };
        }

        return marks;
    }, [ratesByDate, selectedDate, colors]);

    function handleDayPress(day: DateData) {
        setSelectedDate(day.dateString);
        const rate = ratesByDate[day.dateString];
        if (rate) {
            if (rate.usd > 0) onBcvUsdRateChange(String(Math.trunc(rate.usd * 1000) / 1000));
            if (rate.eur > 0) onBcvEurRateChange(String(Math.trunc(rate.eur * 1000) / 1000));
        }
        onDayChange?.();
    }

    const isCurrentMonth =
        today.getMonth() === month && today.getFullYear() === year;
    const maxDate = isCurrentMonth
        ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
        : `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

    // Calendar key forces re-render when month/year changes
    const calendarKey = `${year}-${month}`;

    return (
        <View>
            {/* Month header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
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
                    {MONTHS[month]} {year}
                </Text>
                {isLoading && (
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 12,
                            color: colors.outline,
                        }}
                    >
                        Cargando tasas...
                    </Text>
                )}
            </View>

            {/* Legend */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.success,
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 11,
                            color: colors.outline,
                        }}
                    >
                        Datos disponibles
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: colors.primary,
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 11,
                            color: colors.outline,
                        }}
                    >
                        Hoy
                    </Text>
                </View>
            </View>

            {/* Calendar */}
            <Calendar
                key={calendarKey}
                current={`${year}-${String(month + 1).padStart(2, "0")}-01`}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                maxDate={maxDate}
                theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: colors.outline,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: colors.primary,
                    dayTextColor: colors.onSurface,
                    textDisabledColor: `${colors.outline}60`,
                    dotColor: colors.success,
                    selectedDotColor: "#ffffff",
                    arrowColor: colors.primary,
                    monthTextColor: colors.onSurface,
                    textMonthFontFamily: "Inter",
                    textDayFontFamily: "Inter",
                    textDayHeaderFontFamily: "Inter",
                    textMonthFontWeight: "600",
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 12,
                }}
            />

            {/* Selected day section */}
            {selectedDate && (
                <View
                    style={{
                        marginTop: 16,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: colors.glassSurface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: "Inter",
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.onSurface,
                            marginBottom: 12,
                        }}
                    >
                        {Number(selectedDate.split("-")[2])} de{" "}
                        {MONTHS[month]} {year}
                    </Text>

                    <View style={{ gap: 8 }}>
                        <RateInputRow
                            label="Dólar BCV (Bs.)"
                            subtitle="Oficial BCV"
                            value={bcvUsdRate}
                            onChangeText={onBcvUsdRateChange}
                        />
                        <RateInputRow
                            label="Euro BCV (Bs.)"
                            subtitle="Oficial BCV"
                            value={bcvEurRate}
                            onChangeText={onBcvEurRateChange}
                        />
                        <RateInputRow
                            label="Dólar P2P (Bs.)"
                            subtitle="Referencia Binance"
                            value={p2pRate}
                            onChangeText={onP2pRateChange}
                            highlighted
                        />
                    </View>

                    {conversionLines && conversionLines.length > 0 && (
                        <View style={{ marginTop: 16 }}>
                            <ConversionSummary
                                title="Resumen de Conversión"
                                lines={conversionLines}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
