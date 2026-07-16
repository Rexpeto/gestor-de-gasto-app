import { AmountDisplay } from '@/components/AmountDisplay';
import { CategoryPicker } from '@/components/CategoryPicker';
import { NumericKeyboard } from '@/components/NumericKeyboard';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { useCategoryStore } from '@/store/category-store';
import { showSuccessToast, showErrorToast } from '@/components/ThemedToast';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { TransactionType } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92;

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function todayFormatted(): string {
  const d = new Date();
  return `Hoy, ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function isDigitsOnly(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

export default function AddTransactionScreen() {
  const { id, type: typeParam } = useLocalSearchParams<{ id: string; type: string }>();
  const isEditing = !!id;

  const transactions = useTransactionStore((s) => s.transactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const editTransaction = useTransactionStore((s) => s.editTransaction);
  const categories = useCategoryStore((s) => s.categories);

  const [txType, setTxType] = useState<TransactionType>(
    typeParam === 'income' ? 'income' : 'expense',
  );
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO);
  const [paymentMethod, setPaymentMethod] = useState('bsc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = useThemeColors();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 28,
      stiffness: 280,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    if (!isEditing || !id) return;
    const tx = transactions.find((t) => t.id === Number(id));
    if (!tx) return;
    setTxType(tx.type);
    setAmount(String(tx.amount));
    setCategoryId(tx.categoryId);
    setDescription(tx.description);
    setDate(tx.date);
    setPaymentMethod(tx.currency || 'bsc');
  }, [id, isEditing, transactions]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === txType),
    [categories, txType],
  );

  const title = txType === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto';
  const saveLabel = txType === 'income' ? 'Guardar Ingreso' : 'Guardar Gasto';

  const handleKeyPress = useCallback(
    (key: string) => {
      setAmount((prev) => {
        if (key === 'backspace') return prev.slice(0, -1);
        if (key === '.') {
          if (prev.includes('.')) return prev;
          return prev === '' ? '0.' : prev + '.';
        }
        if (isDigitsOnly(key)) {
          if (prev === '0' && key !== '.') return key;
          return prev + key;
        }
        return prev;
      });
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showErrorToast('Ingresá un monto válido mayor a 0');
      return;
    }
    if (!categoryId) {
      showErrorToast('Seleccioná una categoría');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await editTransaction(Number(id), {
          amount: amountNum,
          type: txType,
          categoryId,
          description,
          date,
          currency: paymentMethod,
        });
      } else {
        await addTransaction({
          amount: amountNum,
          type: txType,
          categoryId,
          description,
          date,
          currency: paymentMethod,
        });
      }
      showSuccessToast('Transacción guardada');
      router.back();
    } catch {
      showErrorToast('No se pudo guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, categoryId, date, description, paymentMethod, editTransaction, id, isEditing, addTransaction, txType]);

  const displayAmount = amount === '' ? '0' : amount;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Background overlay */}
      <Pressable
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onPress={() => router.back()}
      />

      {/* Sheet container */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: SHEET_MAX_HEIGHT,
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: [{ translateY: slideAnim }],
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View
                style={{
                  width: 32,
                  height: 4,
                  borderRadius: 9999,
                  backgroundColor: colors.glassBorderStrong,
                }}
              />
            </View>

            {/* Header row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
                hitSlop={12}
              >
                <Text style={{ fontFamily: 'Inter', fontSize: 20, color: colors.onSurfaceVariant }}>✕</Text>
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 17,
                    color: colors.onSurface,
                  }}
                >
                  {title}
                </Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Amount display */}
            <AmountDisplay amount={displayAmount} currency={paymentMethod} />

            {/* Category chips */}
            <CategoryPicker
              categories={filteredCategories}
              value={categoryId}
              onChange={setCategoryId}
            />

            {/* Payment method chips */}
            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* Date + Notes row */}
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                gap: 10,
                marginBottom: 20,
              }}
            >
              {/* Date */}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceContainerHigh,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>📅</Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.onSurface,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {todayFormatted()}
                </Text>
              </View>

              {/* Notes */}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceContainerHigh,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>✏️</Text>
                <TextInput
                  placeholder="¿En qué gastaste?"
                  placeholderTextColor={colors.outline}
                  value={description}
                  onChangeText={setDescription}
                  style={{
                    flex: 1,
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.onSurface,
                    paddingVertical: 10,
                  }}
                />
              </View>
            </View>

            {/* Custom numeric keyboard */}
            <NumericKeyboard onKeyPress={handleKeyPress} />

            {/* Save button */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 }}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  alignSelf: 'stretch',
                  height: 56,
                  borderRadius: 24,
                  backgroundColor: isSubmitting
                    ? colors.primary + '80'
                    : colors.primary,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 25,
                  shadowOffset: { width: 0, height: 20 },
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.onPrimary,
                  }}
                >
                  {saveLabel}
                </Text>
                <Text style={{ fontSize: 18, color: colors.onPrimary }}>→</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
