import { useThemeColors } from "@/store/theme-store";
import { Tabs } from "expo-router";
import {
    ChartBarBig,
    SlidersHorizontal,
    LayoutDashboard,
    Receipt,
} from "lucide-react-native/icons";

export default function TabLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                // tint colors los maneja ThemeProvider desde _layout.tsx
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
                    tabBarIcon: ({ color }) => (
                        <LayoutDashboard size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Historial",
                    tabBarIcon: ({ color }) => (
                        <Receipt size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: "Estadísticas",
                    tabBarIcon: ({ color }) => (
                        <ChartBarBig size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Ajustes",
                    tabBarIcon: ({ color }) => (
                        <SlidersHorizontal size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
