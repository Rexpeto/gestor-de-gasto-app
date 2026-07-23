import '../global.css';

import { useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { Stack, ThemeProvider } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ToastMessage from 'react-native-toast-message';

import { HeroUINativeProvider } from 'heroui-native/provider';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { AlertDialog } from '@/components/AlertDialog';
import { toastConfig } from '@/components/ThemedToast';

import { useRateStore } from '@/store/rate-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useCategoryStore } from '@/store/category-store';
import { useThemeColors, useThemeStore } from '@/store/theme-store';
import { useSheetStore } from '@/store/sheet-store';
import { fetchAndPersistBcvRates } from '@/services/bcv-rates';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);

  const colors = useThemeColors();
  const systemScheme = useColorScheme();

  const resolvedTheme = themeMode === 'system'
    ? (systemScheme ?? 'dark')
    : themeMode;

  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadMonthlySummary = useTransactionStore((s) => s.loadMonthlySummary);
  const loadCategorySummaries = useTransactionStore((s) => s.loadCategorySummaries);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadRates = useRateStore((s) => s.loadRates);
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);
  const sheetIsOpen = useSheetStore((s) => s.isOpen);
  const sheetType = useSheetStore((s) => s.type);
  const closeSheet = useSheetStore((s) => s.closeSheet);

  useEffect(() => {
    async function init() {
      try {
        await Font.loadAsync({
          Inter: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
          'Inter-SemiBold': require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
          'Inter-Bold': require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
        }).catch(() => {});

        // Load rates first so summaries can use them for currency conversion
        await loadRates();

        // Fire-and-forget: prefetch fresh BCV rates via React Query
        // This populates the cache so useBcvRates() doesn't re-fetch
        queryClient.prefetchQuery({
          queryKey: ['bcv-rates'],
          queryFn: fetchAndPersistBcvRates,
          staleTime: 1000 * 60 * 60,
        }).then(() => {
          // Reload daily rates cache in memory after API fetch
          const now = new Date();
          useRateStore.getState().loadDailyRates(now.getFullYear(), now.getMonth() + 1);
        }).catch(() => {});

        await Promise.all([
          loadCategories(),
          loadTransactions(),
          loadMonthlySummary(),
          loadCategorySummaries(),
          loadPreferences(),
        ]);
      } catch {
      } finally {
        setAppIsReady(true);
      }
    }
    init();
  }, []);

  // Hide splash once app is ready (with safety timeout)
  useEffect(() => {
    if (appIsReady) {
      const hide = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch {
          // Expo Go sometimes doesn't support hideAsync — ignore
        }
      };
      hide();
    }
  }, [appIsReady]);

  const statusBarStyle =
    resolvedTheme === 'dark' ? 'light' : 'dark';

  // Tema para React Navigation (tab bar, headers) — reactivo al acento/modo
  const navigationTheme = useMemo(
    () => ({
      dark: resolvedTheme === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.onSurface,
        border: colors.outlineVariant,
        notification: colors.primary,
      },
      fonts: {
        regular: { fontFamily: 'Inter', fontWeight: '400' },
        medium: { fontFamily: 'Inter', fontWeight: '600' },
        bold: { fontFamily: 'Inter', fontWeight: '700' },
        heavy: { fontFamily: 'Inter', fontWeight: '800' },
      },
    }),
    [colors, resolvedTheme]
  );

  if (!appIsReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <HeroUINativeProvider>
            <ThemeProvider value={navigationTheme}>
              <View className={`flex-1 bg-background ${resolvedTheme}`}>
                <StatusBar style={statusBarStyle} />
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="add-transaction"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen
                    name="categories"
                    options={{
                      title: 'Categorías',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                  <Stack.Screen
                    name="budget"
                    options={{
                      title: 'Presupuesto',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                  <Stack.Screen
                    name="add-category"
                    options={{
                      presentation: 'modal',
                      title: 'Nueva categoría',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                  <Stack.Screen
                    name="apariencia"
                    options={{
                      title: 'Apariencia',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                  <Stack.Screen
                    name="database"
                    options={{
                      title: 'Base de Datos',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                  <Stack.Screen
                    name="fiscal"
                    options={{
                      title: 'Fiscal',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.onSurface,
                    }}
                  />
                </Stack>

                {/* BottomSheet a nivel raíz — POR ENCIMA de los tabs */}
                <AddTransactionSheet
                  isOpen={sheetIsOpen}
                  initialType={sheetType}
                  onClose={closeSheet}
                />

                {/* AlertDialog personalizado — POR ENCIMA de los tabs */}
                <AlertDialog />

                {/* Toast notifications - POR ENCIMA de todo */}
                <ToastMessage config={toastConfig} />
              </View>
            </ThemeProvider>
          </HeroUINativeProvider>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
