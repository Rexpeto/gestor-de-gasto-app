import { useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Pencil, Trash2 } from 'lucide-react-native/icons';

import { showAlert } from '@/store/alert-store';
import { useThemeColors } from '@/store/theme-store';

interface SwipeableTransactionRowProps {
  transactionId: number;
  onEdit: (transactionId: number) => void;
  onDelete: (transactionId: number) => void;
  children: React.ReactNode;
}

/**
 * Wraps a transaction row with swipe gestures:
 * - Swipe LEFT → reveals "Editar" button (primary color, right side)
 * - Swipe RIGHT → reveals "Eliminar" button (red, left side) with confirmation
 */
export function SwipeableTransactionRow({
  transactionId,
  onEdit,
  onDelete,
  children,
}: SwipeableTransactionRowProps) {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => {
    return (
      <Pressable
        onPress={() => {
          swipeableRef.current?.close();
          onEdit(transactionId);
        }}
        style={{
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
        }}
      >
        <Pencil size={20} color="white" />
        <Text
          style={{
            color: 'white',
            fontSize: 11,
            fontWeight: '600',
            fontFamily: 'Inter',
            marginTop: 4,
          }}
        >
          Editar
        </Text>
      </Pressable>
    );
  };

  const renderLeftActions = () => {
    return (
      <Pressable
        onPress={() => {
          swipeableRef.current?.close();
          showAlert(
            'Eliminar transacción',
            '¿Eliminar esta transacción? Esta acción no se puede deshacer.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => onDelete(transactionId),
              },
            ],
            'trash',
          );
        }}
        style={{
          backgroundColor: '#ef4444',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
        }}
      >
        <Trash2 size={20} color="white" />
        <Text
          style={{
            color: 'white',
            fontSize: 11,
            fontWeight: '600',
            fontFamily: 'Inter',
            marginTop: 4,
          }}
        >
          Eliminar
        </Text>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}
