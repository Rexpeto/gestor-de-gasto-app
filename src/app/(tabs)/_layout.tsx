import { useThemeColors } from "@/store/theme-store";
import { Tabs } from "expo-router";
import {
    ChartBarBig,
    LayoutDashboard,
    Receipt,
    Settings,
} from "lucide-react-native/icons";

export default function TabLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: colors.glassOverlay,
                    borderTopWidth: 1,
                    borderTopColor: colors.glassBorder,
                    paddingTop: 4,
                    height: 72,
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                    fontFamily: "Inter",
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color, focused }) => (
                        <LayoutDashboard
                            size={22}
                            color={focused ? colors.primary : color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Historial",
                    tabBarIcon: ({ color, focused }) => (
                        <Receipt
                            size={22}
                            color={focused ? colors.primary : color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: "Estadísticas",
                    tabBarIcon: ({ color, focused }) => (
                        <ChartBarBig
                            size={22}
                            color={focused ? colors.primary : color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="Categorías"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="Presupuesto"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="Ajustes"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, focused }) => (
                        <Settings
                            size={22}
                            color={focused ? colors.primary : color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
