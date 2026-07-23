import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/store/theme-store';

const PAYMENT_METHODS = [
  { id: 'bs', label: 'Bs' },
  { id: 'bsc', label: '$ BCV' },
  { id: 'eur', label: '€ BCV' },
  { id: 'usdt', label: 'USDT' },
];

interface PaymentMethodPickerProps {
  value: string;
  onChange: (id: string) => void;
}

/**
 * Horizontal chip picker for selecting the payment method.
 *
 * Renders $ BCV, € BCV, and USDT as tappable pills with active state
 * theming derived from the app's colors.
 */
export function PaymentMethodPicker({
  value,
  onChange,
}: PaymentMethodPickerProps) {
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
        Método de Pago
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {PAYMENT_METHODS.map((pm) => {
          const active = pm.id === value;
          return (
            <Pressable
              key={pm.id}
              onPress={() => onChange(pm.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 9999,
                borderWidth: 1,
                backgroundColor: active
                  ? colors.primary + '33'
                  : colors.surfaceContainerHigh,
                borderColor: active
                  ? colors.primary + '4D'
                  : colors.glassBorder,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: '500',
                  color: active ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {pm.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
