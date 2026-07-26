import { useThemeColors } from '@/store/theme-store';
import { Text, View } from 'react-native';

export function EmptyBudgetState() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-2xl p-6 items-center"
      style={{
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}
    >
      <Text style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant, textAlign: 'center' }}>
        No hay categorías de gasto. Creá algunas desde Categorías.
      </Text>
    </View>
  );
}
