import '../global.css';

import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import ToastMessage from 'react-native-toast-message';

import { HeroUINativeProvider } from 'heroui-native/provider';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { toastConfig } from '@/components/ThemedToast';
import { useTransactionStore } from '@/store/transaction-store';
import { useCategoryStore } from '@/store/category-store';
import { useThemeColors, useThemeStore } from '@/store/theme-store';
import { useSheetStore } from '@/store/sheet-store';

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
        }).catch(() => {
          console.warn('⚠️ Inter not loaded, using system font');
        });

        await Promise.all([
          loadCategories(),
          loadTransactions(),
          loadMonthlySummary(),
          loadCategorySummaries(),
        ]);
      } catch (e) {
        console.warn('Error loading initial data:', e);
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

  if (!appIsReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <HeroUINativeProvider>
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
                name="add-category"
                options={{
                  presentation: 'modal',
                  title: 'Nueva categoría',
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

            {/* Toast notifications - POR ENCIMA de todo */}
            <ToastMessage config={toastConfig} />
          </View>
        </HeroUINativeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
