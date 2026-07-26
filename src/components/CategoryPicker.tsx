import { Pressable, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { CategoryIcon } from '@/components/CategoryIcon';
import { useThemeColors } from '@/store/theme-store';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CategoryPickerProps {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
}

/**
 * Horizontal carousel of category chips with icon + name.
 *
 * Each chip shows a Lucide icon and the category name, with active
 * state theming derived from the app's colors.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: CategoryPickerProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '600',
          color: colors.onSurfaceVariant,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 10,
        }}
      >
        Categoría
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((cat) => {
          const active = cat.id === value;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 9999,
                borderWidth: 1,
                gap: 6,
                backgroundColor: active
                  ? colors.primary + '33'
                  : colors.surfaceContainerHigh,
                borderColor: active
                  ? colors.primary + '4D'
                  : colors.glassBorder,
              }}
            >
              <CategoryIcon name={cat.icon} size={16} color={cat.color} />
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: '500',
                  color: active ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
