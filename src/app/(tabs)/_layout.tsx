import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Receipt,
  ChartBarBig,
  Settings,
} from 'lucide-react-native/icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#57f1db',
        tabBarInactiveTintColor: '#bacac5',
        tabBarStyle: {
          backgroundColor: 'rgba(9, 16, 14, 0.9)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(60, 74, 70, 0.3)',
          paddingTop: 4,
          height: 72,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Inter',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={22} color={focused ? '#57f1db' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Receipt size={22} color={focused ? '#57f1db' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <ChartBarBig size={22} color={focused ? '#57f1db' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="presupuesto"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={focused ? '#57f1db' : color} />
          ),
        }}
      />
    </Tabs>
  );
}
