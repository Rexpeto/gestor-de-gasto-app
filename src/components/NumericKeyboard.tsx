import { Delete } from 'lucide-react-native/icons';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';

const KEYBOARD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
}

/**
 * Custom numeric keypad used in the transaction forms.
 *
 * Renders a 4×3 grid of keys (1-9, ., 0, backspace) with consistent
 * spacing and theme-aware colors.
 */
export function NumericKeyboard({ onKeyPress }: NumericKeyboardProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: 20, gap: 12 }}>
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={{
            flexDirection: 'row',
            gap: 12,
          }}
        >
          {row.map((key) => {
            const isBackspace = key === 'backspace';
            return (
              <Pressable
                key={key}
                onPress={() => onKeyPress(key)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isBackspace
                    ? colors.error + '1A'
                    : colors.glassBorder,
                }}
                android_ripple={{ color: colors.glassBorder }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: isBackspace ? 18 : 24,
                    fontWeight: '600',
                    color: isBackspace ? colors.error : colors.onSurface,
                  }}
                >
                  {isBackspace ? <Delete size={22} color={colors.error} /> : key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
