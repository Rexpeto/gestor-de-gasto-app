import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import TopTabs from 'expo-router/js-top-tabs';
import {
    ChartBarBig,
    LayoutDashboard,
    Receipt,
    SlidersHorizontal,
} from 'lucide-react-native/icons';

import { useThemeColors } from '@/store/theme-store';

// ── Configuración de cada tab ──
interface TabConfig {
    name: string;
    path: '/' | '/transactions' | '/stats' | '/settings';
    label: string;
    icon: React.FC<{ size: number; color: string }>;
}

const TABS: TabConfig[] = [
    { name: 'index', path: '/', label: 'Inicio', icon: LayoutDashboard },
    { name: 'transactions', path: '/transactions', label: 'Historial', icon: Receipt },
    { name: 'stats', path: '/stats', label: 'Estadísticas', icon: ChartBarBig },
    { name: 'settings', path: '/settings', label: 'Ajustes', icon: SlidersHorizontal },
];

// ── Bottom tab bar personalizado ──
function BottomTabBar() {
    const colors = useThemeColors();
    const pathname = usePathname();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isActive = useCallback(
        (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path)),
        [pathname],
    );

    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: colors.glassOverlay,
                borderTopWidth: 1,
                borderTopColor: colors.glassBorder,
                paddingTop: 4,
                height: 64 + insets.bottom,
                paddingBottom: insets.bottom,
            }}
        >
            {TABS.map((tab) => {
                const active = isActive(tab.path);
                const color = active ? colors.primary : colors.onSurfaceVariant;

                return (
                    <Pressable
                        key={tab.name}
                        onPress={() => {
                            if (!active) router.replace(tab.path);
                        }}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        <tab.icon size={22} color={color} />
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '600',
                                fontFamily: 'Inter',
                                color,
                            }}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

// ── Layout export ──
export default function TabLayout() {
    return (
        <View style={{ flex: 1 }}>
            {/*
             * TopTabs de expo-router/js-top-tabs — navigator con swipe nativo.
             * Reemplaza al antiguo Tabs de expo-router + withLayoutContext.
             *
             * Swipe horizontal entre todas las pantallas:
             *   Inicio ← swipe → Historial ← swipe → Estadísticas ← swipe → Ajustes
             */}
            <TopTabs
                tabBar={() => null}
                style={{ flex: 1 }}
                screenOptions={{
                    swipeEnabled: true,
                    animationEnabled: true,
                    lazy: true,
                }}
            >
                <TopTabs.Screen name="index" />
                <TopTabs.Screen name="transactions" />
                <TopTabs.Screen name="stats" />
                <TopTabs.Screen name="settings" />
            </TopTabs>

            {/*
             * Bottom tab bar personalizado — mismo estilo visual que antes:
             * glassmorphism, bordes, altura 64 + safe area.
             */}
            <BottomTabBar />
        </View>
    );
}
