import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';

interface CurrencyToggleChipProps {
  label: string;
  onPress: () => void;
}

/**
 * Tappable currency chip that shows the current currency label.
 * Triggers the parent's currency toggle animation on press.
 */
export function CurrencyToggleChip({ label, onPress }: CurrencyToggleChipProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        alignSelf: 'flex-end',
        marginBottom: 6,
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.9 : 1 }],
      })}
    >
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '700',
          color: colors.onPrimary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
