import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AnimatedSection } from '@/components/AnimatedSection';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SwipeableCategoryRow } from '@/components/SwipeableCategoryRow';
import { showErrorToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import { useThemeColors } from '@/store/theme-store';
import type { Category } from '@/types';
import { FolderOpen, Plus } from 'lucide-react-native/icons';

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

  const handleDelete = async (catId: number) => {
    try {
      await removeCategory(catId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar';
      showErrorToast(message);
    }
  };

  const handleEdit = (catId: number) => {
    // TODO: add-category screen doesn't support editing yet
    console.log('Edit category:', catId);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Tab Filters ── */}
      <View className="px-5 py-2">
        <View className="flex-row gap-2 w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const accent = isActive ? colors.primary : colors.onSurfaceVariant;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 120,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: `${accent}1A`,
                  borderWidth: 1,
                  borderColor: isActive ? `${colors.primary}66` : colors.glassBorder,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  opacity: pressed ? 0.8 : 1,
                })}
                onPress={() => setActiveTab(tab.key)}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9999,
                    backgroundColor: `${accent}26`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      fontWeight: '600',
                      color: accent,
                    }}
                  >
                    {tab.key === 'income' ? '↓' : '↑'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.onSurface,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
              <AnimatedSection
                key={cat.id}
                delay={index * 60}
                duration={400}
              >
                <SwipeableCategoryRow
                  categoryId={cat.id}
                  categoryName={cat.name}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                >
                  <Pressable
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
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
                      Deslizá ← →
                    </Text>
                  </Pressable>
                </SwipeableCategoryRow>
              </AnimatedSection>
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
