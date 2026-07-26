import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';

interface ActionProps {
  /** Lucide icon component (e.g. ArrowDownLeft) */
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Display label */
  label: string;
  /** Called when the user taps */
  onPress: () => void;
  /** Hex accent color that drives container bg, circle bg, and icon color */
  color?: string;
}

/**
 * Quick-action button used in the dashboard.
 *
 * Renders a pressable card with an icon circle and label.
 * The `color` prop (default: `colors.primary`) automatically derives
 * semi-transparent backgrounds for the container and icon circle.
 */
export function Action({
  icon: Icon,
  label,
  onPress,
  color: accent,
}: ActionProps) {
  const colors = useThemeColors();
  const c = accent ?? colors.primary;

  return (
    <Pressable
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: `${c}1A`,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 9999,
          backgroundColor: `${c}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={c} />
      </View>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 12,
          fontWeight: '500',
          color: colors.onSurface,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
