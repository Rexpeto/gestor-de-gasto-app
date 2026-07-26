import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useThemeColors } from "@/store/theme-store";
import { useBcvRates } from "@/hooks/useBcvRates";
import { RateInputRow } from "./RateInputRow";
import { ConversionSummary } from "./ConversionSummary";
import { CalendarSkeleton } from "@/components/Skeleton";

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
    bcvUsdRate: string;
    bcvEurRate: string;
    onBcvUsdRateChange: (rate: string) => void;
    onBcvEurRateChange: (rate: string) => void;
    onDayChange?: (date: string) => void;
    conversionLines?: { label: string; value: string; highlighted?: boolean }[];
}

/**
 * Calendar-based rate picker. Fetches daily BCV rates from dolarapi.com.
 * Days with available data show a green dot. Tapping a day auto-fills BCV rates.
 */
export function RateCalendar({
    month,
    year,
    bcvUsdRate,
    bcvEurRate,
    onBcvUsdRateChange,
    onBcvEurRateChange,
    onDayChange,
    conversionLines,
}: RateCalendarProps) {
    const colors = useThemeColors();
    const { ratesByDate, isLoading } = useBcvRates();
    const hasData = Object.keys(ratesByDate).length > 0;

    // Auto-select today's date on mount
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Reset selected day when month/year changes
    useEffect(() => {
        setSelectedDate(null);
    }, [month, year]);

    // Resolve rate for a date, falling back to Monday for weekends
    function resolveRateForDate(dateStr: string) {
        if (ratesByDate[dateStr]) return ratesByDate[dateStr];
        const d = new Date(dateStr + "T00:00:00");
        const day = d.getDay();
        if (day === 6) {
            d.setDate(d.getDate() + 2);
        } else if (day === 0) {
            d.setDate(d.getDate() + 1);
        }
        const monday = d.toISOString().split("T")[0];
        return ratesByDate[monday] ?? null;
    }

    // Auto-fill rates from BCV data when today is selected on mount
    useEffect(() => {
        if (selectedDate) {
            const rate = resolveRateForDate(selectedDate);
            if (rate) {
                if (rate.usd > 0) onBcvUsdRateChange(String(Math.trunc(rate.usd * 1000) / 1000));
                if (rate.eur > 0) onBcvEurRateChange(String(Math.trunc(rate.eur * 1000) / 1000));
            }
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

        // Mark days that have BCV data (including weekends via Monday fallback)
        for (const dateStr of Object.keys(ratesByDate)) {
            const rate = ratesByDate[dateStr];
            if (rate.usd > 0 || rate.eur > 0) {
                marks[dateStr] = { marked: true, dotColor: colors.success };
            }
        }

        // Also mark weekends that resolve to a Monday with data
        const allDates = Object.keys(marks);
        for (const dateStr of allDates) {
            const d = new Date(dateStr + "T00:00:00");
            const day = d.getDay();
            if (day === 6 || day === 0) {
                // Find the Monday this weekend resolves to
                const monday = new Date(d);
                monday.setDate(monday.getDate() + (day === 6 ? 2 : 1));
                const mondayStr = monday.toISOString().split("T")[0];
                if (ratesByDate[mondayStr] && (ratesByDate[mondayStr].usd > 0 || ratesByDate[mondayStr].eur > 0)) {
                    marks[dateStr] = { marked: true, dotColor: colors.success };
                }
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
        const rate = resolveRateForDate(day.dateString);
        if (rate) {
            if (rate.usd > 0) onBcvUsdRateChange(String(Math.trunc(rate.usd * 1000) / 1000));
            if (rate.eur > 0) onBcvEurRateChange(String(Math.trunc(rate.eur * 1000) / 1000));
        }
        onDayChange?.(day.dateString);
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
                {isLoading && !hasData && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.6 }} />
                        <Text
                            style={{
                                fontFamily: "Inter",
                                fontSize: 12,
                                color: colors.outline,
                            }}
                        >
                            Sincronizando tasas...
                        </Text>
                    </View>
                )}
            </View>

            {/* Skeleton while loading — or full calendar content */}
            {isLoading && !hasData ? (
                <CalendarSkeleton />
            ) : (
                <>
                    {/* Legend */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: colors.success,
                                }}
                            />
                            <Text style={{ fontFamily: "Inter", fontSize: 11, color: colors.outline }}>
                                Datos disponibles
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    borderColor: colors.primary,
                                }}
                            />
                            <Text style={{ fontFamily: "Inter", fontSize: 11, color: colors.outline }}>
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
                </>
            )}
        </View>
    );
}
