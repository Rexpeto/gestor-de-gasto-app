import { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
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
    { name: 'stats', path: '/stats', label: 'Stats', icon: ChartBarBig },
    { name: 'settings', path: '/settings', label: 'Ajustes', icon: SlidersHorizontal },
];

const CIRCLE_SIZE = 48;
const TAB_WIDTH = 72;

// ── Bottom tab bar personalizado (Stitch floating pill) ──
function BottomTabBar() {
    const colors = useThemeColors();
    const pathname = usePathname();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const translateX = useSharedValue(0);

    const isActive = useCallback(
        (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path)),
        [pathname],
    );

    // Find active index and animate
    useEffect(() => {
        const idx = TABS.findIndex((t) => isActive(t.path));
        if (idx >= 0) {
            translateX.value = withSpring(idx * TAB_WIDTH, {
                damping: 20,
                stiffness: 300,
                mass: 0.8,
            });
        }
    }, [pathname, isActive, translateX]);

    // Animated circle style
    const circleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Glow halo
    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 24 + insets.bottom,
                alignSelf: 'center',
                width: '90%',
                maxWidth: 448,
                height: 64,
                borderRadius: 9999,
                backgroundColor: `${colors.surfaceContainer}CC`,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
                overflow: 'hidden',
            }}
        >
            {/* Tabs row — centered, contains animated circles */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Animated active circle indicator — inside tabs row */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            width: CIRCLE_SIZE,
                            height: CIRCLE_SIZE,
                            borderRadius: 9999,
                            backgroundColor: `${colors.primary}1A`,
                            // Center circle in first tab: offset from row start
                            left: (TAB_WIDTH - CIRCLE_SIZE) / 2,
                            top: (64 - CIRCLE_SIZE) / 2,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                            elevation: 8,
                        },
                        circleStyle,
                    ]}
                />

                {/* Glow halo — inside tabs row */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            width: CIRCLE_SIZE + 8,
                            height: CIRCLE_SIZE + 8,
                            borderRadius: 9999,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderColor: `${colors.primary}15`,
                            left: (TAB_WIDTH - CIRCLE_SIZE - 8) / 2,
                            top: (64 - CIRCLE_SIZE - 8) / 2,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.3,
                            shadowRadius: 25,
                        },
                        glowStyle,
                    ]}
                />

                {TABS.map((tab) => {
                    const active = isActive(tab.path);

                    return (
                        <Pressable
                            key={tab.name}
                            onPress={() => {
                                if (!active) router.replace(tab.path);
                            }}
                            style={({ pressed }) => ({
                                width: TAB_WIDTH,
                                height: 64,
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: [{ scale: pressed ? 0.9 : 1 }],
                            })}
                        >
                            <tab.icon
                                size={22}
                                color={active ? colors.primary : colors.onSurfaceVariant}
                            />
                            {!active && (
                                <Text
                                    style={{
                                        fontFamily: 'Geist',
                                        fontSize: 11,
                                        fontWeight: '600',
                                        letterSpacing: 0.05,
                                        textTransform: 'uppercase',
                                        color: colors.onSurfaceVariant,
                                        marginTop: 2,
                                        opacity: 0.6,
                                    }}
                                >
                                    {tab.label}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

// ── Layout export ──
export default function TabLayout() {
    return (
        <View style={{ flex: 1 }}>
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

            <BottomTabBar />
        </View>
    );
}
