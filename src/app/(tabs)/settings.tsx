import { useState, useMemo } from 'react';
import {
  CalendarDays,
  Wallet,
  ArrowLeftRight,
  ChartBar,
  Palette,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  Save,
} from 'lucide-react-native/icons';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { resetDatabase } from '@/db/database';
import { useThemeColors, useThemeStore, type ThemeMode } from '@/store/theme-store';
import { useBudgetStore } from '@/store/budget-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useCategoryStore } from '@/store/category-store';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const YEARS = ['2023', '2024', '2025'];

function GlassPanel({
  children,
  accent,
  heavy,
  className = '',
}: {
  children: React.ReactNode;
  accent?: boolean;
  heavy?: boolean;
  className?: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      className={`p-4 ${className}`}
      style={{
        backgroundColor: heavy ? colors.glassOverlay : colors.glassSurface,
        borderWidth: 1,
        borderColor: accent ? `${colors.primary}4D` : colors.glassBorderStrong,
        borderRadius: 12,
        ...(heavy
          ? {
              shadowColor: '#57f1db',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 8,
            }
          : {}),
      }}
    >
      {children}
    </View>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 mb-3">
      <Icon size={20} color={colors.primary} />
      <Text
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const totalBudget = useBudgetStore((s) => s.totalBudget);
  const exchangeRates = useBudgetStore((s) => s.exchangeRates);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [budgetValue, setBudgetValue] = useState(String(totalBudget()));
  const [p2pRate, setP2pRate] = useState('825.00');
  const [bcvUsdRate, setBcvUsdRate] = useState('0.87');
  const [bcvEurRate, setBcvEurRate] = useState('1.20');

  const conversionSummary = useMemo(() => {
    const p2p = parseFloat(p2pRate) || 0;
    const bcvUsd = parseFloat(bcvUsdRate) || 0;
    const bcvEur = parseFloat(bcvEurRate) || 0;
    const budget = parseFloat(budgetValue) || 0;

    const bolivaresP2P = budget * p2p;
    const dolaresBCV = budget / bcvUsd;
    const eurosBCV = budget / bcvEur;

    return { bolivaresP2P, dolaresBCV, eurosBCV };
  }, [budgetValue, p2pRate, bcvUsdRate, bcvEurRate]);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerClassName="pb-28"
    >
      {/* ── Sticky-style Header ── */}
      <View
        className="flex-row items-center justify-between px-5 pt-14 pb-4"
        style={{ backgroundColor: `${colors.background}F2` }}
      >
        <Text
          className="text-xl font-bold"
          style={{ fontFamily: 'Inter', color: colors.onSurface }}
        >
          Financier
        </Text>
        <View className="flex-row items-center gap-4">
          <Bell size={22} color={colors.onSurfaceVariant} />
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: `${colors.primary}26` }}
          >
            <User size={18} color={colors.primary} />
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View className="px-5 gap-5">
        {/* Section Title */}
        <View className="mt-2">
          <Text
            className="text-2xl font-bold"
            style={{ fontFamily: 'Inter', color: colors.onSurface }}
          >
            Configuración
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
          >
            Define tu presupuesto y tasas de mercado.
          </Text>
        </View>

        {/* ── Periodo Fiscal ── */}
        <GlassPanel>
          <SectionHeader icon={CalendarDays} label="Periodo Fiscal" />
          <View className="flex-row gap-3">
            {/* Month selector */}
            <View className="flex-1 relative">
              <Pressable
                className="flex-row items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.glassBorder,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                }}
                onPress={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              >
                <Text
                  className="text-sm"
                  style={{ fontFamily: 'Inter', color: colors.onSurface }}
                >
                  {MONTHS[selectedMonth]}
                </Text>
                <ChevronDown size={16} color={colors.outline} />
              </Pressable>
              {showMonthPicker && (
                <View
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                  }}
                >
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {MONTHS.map((m, i) => (
                      <Pressable
                        key={i}
                        className="px-4 py-3"
                        style={{
                          backgroundColor: i === selectedMonth ? `${colors.primary}1F` : 'transparent',
                        }}
                        onPress={() => { setSelectedMonth(i); setShowMonthPicker(false); }}
                      >
                        <Text
                          className="text-sm"
                          style={{
                            fontFamily: 'Inter',
                            color: i === selectedMonth ? colors.primary : colors.onSurface,
                          }}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Year selector */}
            <View className="relative" style={{ width: 100 }}>
              <Pressable
                className="flex-row items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.glassBorder,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                }}
                onPress={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              >
                <Text
                  className="text-sm"
                  style={{ fontFamily: 'Inter', color: colors.onSurface }}
                >
                  {selectedYear}
                </Text>
                <ChevronDown size={16} color={colors.outline} />
              </Pressable>
              {showYearPicker && (
                <View
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                  }}
                >
                  {YEARS.map((y) => (
                    <Pressable
                      key={y}
                      className="px-4 py-3"
                      style={{
                        backgroundColor: y === selectedYear ? `${colors.primary}1F` : 'transparent',
                      }}
                      onPress={() => { setSelectedYear(y); setShowYearPicker(false); }}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          fontFamily: 'Inter',
                          color: y === selectedYear ? colors.primary : colors.onSurface,
                        }}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </GlassPanel>

        {/* ── Tema ── */}
        <GlassPanel>
          <SectionHeader icon={Palette} label="Tema" />
          <View
            className="flex-row rounded-xl overflow-hidden"
            style={{
              backgroundColor: colors.glassBorder,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <Pressable
              className="flex-1 py-3 items-center"
              style={{
                backgroundColor: themeMode === 'light' ? `${colors.primary}1A` : 'transparent',
              }}
              onPress={() => setThemeMode('light')}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  fontFamily: 'Inter',
                  color: themeMode === 'light' ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                Claro
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3 items-center"
              style={{
                backgroundColor: themeMode === 'dark' ? `${colors.primary}1A` : 'transparent',
              }}
              onPress={() => setThemeMode('dark')}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  fontFamily: 'Inter',
                  color: themeMode === 'dark' ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                Oscuro
              </Text>
            </Pressable>
          </View>
        </GlassPanel>

        {/* ── Presupuesto Mensual ── */}
        <GlassPanel>
          <SectionHeader icon={Wallet} label="Presupuesto Mensual" />
          <View className="items-center py-4">
            <View className="flex-row items-baseline gap-2">
              <TextInput
                className="text-4xl font-bold text-center"
                style={{
                  fontFamily: 'Geist',
                  color: colors.onSurface,
                  minWidth: 120,
                }}
                keyboardType="decimal-pad"
                value={budgetValue}
                onChangeText={setBudgetValue}
                placeholder="0.00"
                placeholderTextColor="rgba(221,228,225,0.3)"
              />
              <Text
                className="text-base font-semibold"
                style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
              >
                USDT
              </Text>
            </View>
          </View>
        </GlassPanel>

        {/* ── Tasas de Cambio ── */}
        <GlassPanel>
          <SectionHeader icon={ArrowLeftRight} label="Tasas de Cambio" />
          <View className="gap-3">
            {/* Dólar P2P */}
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: `${colors.primary}33`,
                borderLeftWidth: 3,
                borderLeftColor: `${colors.primary}66`,
              }}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ fontFamily: 'Inter', color: colors.onSurface }}>
                  Dólar P2P (Bs.)
                </Text>
                <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.outline }}>
                  Referencia Binance
                </Text>
              </View>
              <TextInput
                className="text-right text-sm font-medium"
                style={{ fontFamily: 'Geist', color: colors.onSurface, width: 80 }}
                keyboardType="decimal-pad"
                value={p2pRate}
                onChangeText={setP2pRate}
              />
            </View>

            {/* Dólar BCV */}
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ fontFamily: 'Inter', color: colors.onSurface }}>
                  Dólar BCV (Bs.)
                </Text>
                <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.outline }}>
                  Oficial BCV
                </Text>
              </View>
              <TextInput
                className="text-right text-sm font-medium"
                style={{ fontFamily: 'Geist', color: colors.onSurface, width: 80 }}
                keyboardType="decimal-pad"
                value={bcvUsdRate}
                onChangeText={setBcvUsdRate}
              />
            </View>

            {/* Euro BCV */}
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.glassSurface,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ fontFamily: 'Inter', color: colors.onSurface }}>
                  Euro BCV (Bs.)
                </Text>
                <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.outline }}>
                  Oficial BCV
                </Text>
              </View>
              <TextInput
                className="text-right text-sm font-medium"
                style={{ fontFamily: 'Geist', color: colors.onSurface, width: 80 }}
                keyboardType="decimal-pad"
                value={bcvEurRate}
                onChangeText={setBcvEurRate}
              />
            </View>
          </View>
        </GlassPanel>

        {/* ── Resumen de Conversión ── */}
        <GlassPanel heavy>
          <SectionHeader icon={ChartBar} label="Resumen de Conversión" />
          <View className="gap-0">
            {/* Bolívares P2P */}
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.glassBorder }}>
              <Text className="text-sm" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
                Bolívares (P2P)
              </Text>
              <Text className="text-sm font-semibold" style={{ fontFamily: 'Geist', color: colors.onSurface }}>
                {conversionSummary.bolivaresP2P.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
              </Text>
            </View>

            {/* Dólares BCV */}
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.glassBorder }}>
              <Text className="text-sm" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
                Dólares (BCV)
              </Text>
              <Text className="text-sm font-semibold" style={{ fontFamily: 'Geist', color: colors.primary }}>
                {conversionSummary.dolaresBCV.toLocaleString('en-US', { minimumFractionDigits: 2 })} $
              </Text>
            </View>

            {/* Euros BCV */}
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
                Euros (BCV)
              </Text>
              <Text className="text-sm font-semibold" style={{ fontFamily: 'Geist', color: colors.onSurface }}>
                {conversionSummary.eurosBCV.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </Text>
            </View>
          </View>
        </GlassPanel>

        {/* ── Guardar Configuración ── */}
        <Pressable
          className="py-4 rounded-full items-center"
          style={{
            backgroundColor: colors.primary,
            shadowColor: '#57f1db',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 8,
          }}
          onPress={() => {
            /* TODO: persist settings */
          }}
        >
          <View className="flex-row items-center gap-2">
            <Save size={18} color={colors.onPrimary} />
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.onPrimary }}
            >
              Guardar Configuración
            </Text>
          </View>
        </Pressable>

        {/* ── Restablecer Base de Datos ── */}
        <Pressable
          className="py-4 rounded-full items-center mt-4"
          style={{
            backgroundColor: `${colors.error}1A`,
            borderWidth: 1,
            borderColor: `${colors.error}4D`,
          }}
          onPress={() => {
            Alert.alert(
              'Restablecer base de datos',
              'Se eliminarán TODOS los datos (transacciones, categorías, presupuesto). Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar todo',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await resetDatabase();
                      // Reload all stores
                      await Promise.all([
                        useCategoryStore.getState().loadCategories(),
                        useTransactionStore.getState().loadTransactions(),
                        useTransactionStore.getState().loadMonthlySummary(),
                        useTransactionStore.getState().loadCategorySummaries(),
                      ]);
                      Alert.alert('Listo', 'Base de datos restablecida con los valores por defecto.');
                    } catch {
                      Alert.alert('Error', 'No se pudo restablecer la base de datos');
                    }
                  },
                },
              ],
            );
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 16, color: colors.error }}>⚠️</Text>
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.error }}
            >
              Restablecer Base de Datos
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
