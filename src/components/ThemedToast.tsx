import { Text, View } from 'react-native';
import ToastMessage, { type ToastConfigParams } from 'react-native-toast-message';

import { useThemeColors } from '@/store/theme-store';

export function showSuccessToast(text1: string, text2?: string) {
  ToastMessage.show({
    type: 'success',
    text1,
    text2,
    visibilityTime: 3000,
    position: 'bottom',
  });
}

export function showErrorToast(text1: string, text2?: string) {
  ToastMessage.show({
    type: 'error',
    text1,
    text2,
    visibilityTime: 4000,
    position: 'bottom',
  });
}

interface ThemedToastProps {
  text1?: string;
  text2?: string;
  type?: 'success' | 'error';
}

function ThemedToastContent({ text1, text2, type }: ThemedToastProps) {
  const colors = useThemeColors();
  const isError = type === 'error';

  return (
    <View
      style={{
        backgroundColor: colors.surfaceContainerHighest,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isError ? `${colors.error}4D` : `${colors.primary}33`,
        borderLeftWidth: 4,
        borderLeftColor: isError ? colors.error : colors.primary,
        padding: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 15,
          fontWeight: '600',
          color: isError ? colors.error : colors.onSurface,
        }}
      >
        {text1}
      </Text>
      {text2 && (
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {text2}
        </Text>
      )}
    </View>
  );
}

export const toastConfig = {
  success: (params: ToastConfigParams<unknown>) => (
    <ThemedToastContent text1={params.text1} text2={params.text2} type="success" />
  ),
  error: (params: ToastConfigParams<unknown>) => (
    <ThemedToastContent text1={params.text1} text2={params.text2} type="error" />
  ),
};
