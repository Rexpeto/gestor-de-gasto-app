import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { FolderOpen, Plus } from 'lucide-react-native/icons';
import { CategoryIcon } from '@/components/CategoryIcon';
import { showErrorToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import type { Category, TransactionType } from '@/types';
import { useThemeColors } from '@/store/theme-store';

type TabType = 'income' | 'expense';

const TABS: { key: TabType; label: string }[] = [
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

export default function CategoriesScreen() {
  const colors = useThemeColors();
  const categories = useCategoryStore((s) => s.categories);
  const removeCategory = useCategoryStore((s) => s.removeCategory);
  const [activeTab, setActiveTab] = useState<TabType>('expense');

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${cat.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCategory(cat.id);
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : 'Error al eliminar';
              showErrorToast(message);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View className="px-5 pt-16 pb-4">
        <Text
          className="text-xl font-bold"
          style={{ fontFamily: 'Inter', color: colors.onSurface }}
        >
          Categorías
        </Text>
      </View>

      {/* ── Tab Filters ── */}
      <ScrollView horizontal className="px-5 py-2" showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor:
                  activeTab === tab.key ? `${colors.primary}26` : colors.glassSurface,
                borderWidth: 1,
                borderColor:
                  activeTab === tab.key ? `${colors.primary}4D` : colors.glassBorder,
              }}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  fontFamily: 'Inter',
                  color: activeTab === tab.key ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* ── Categories List ── */}
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-28">
        {filteredCategories.length === 0 ? (
          <View className="py-16 items-center">
            <FolderOpen size={48} color={colors.onSurfaceVariant} />
            <Text
              className="text-center mt-3"
              style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
            >
              No hay categorías de {activeTab === 'income' ? 'ingresos' : 'gastos'}
            </Text>
          </View>
        ) : (
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: colors.glassSurface,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            {filteredCategories.map((cat, index) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  },
                ]}
                onLongPress={() => handleDelete(cat)}
              >
                {index > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 56,
                      right: 0,
                      height: 1,
                      backgroundColor: colors.glassBorder,
                    }}
                  />
                )}
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <CategoryIcon name={cat.icon} size={22} color={cat.color} />
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    className="text-base font-medium"
                    style={{ fontFamily: 'Inter', color: colors.onSurface }}
                  >
                    {cat.name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: cat.color }}
                    />
                    <Text
                      className="text-xs"
                      style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
                    >
                      {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-xs"
                  style={{ fontFamily: 'Inter', color: colors.outline }}
                >
                  Mantené presionado
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── FAB (Teal) ── */}
      <Pressable
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push('/add-category')}
      >
        <Plus size={24} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
