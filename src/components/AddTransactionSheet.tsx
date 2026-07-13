import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useThemeColors } from '@/store/theme-store';
import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { TransactionType } from '@/types';

const PAYMENT_METHODS = [
  { id: 'bsc', label: '$ BCV' },
  { id: 'eur', label: '€ BCV' },
  { id: 'usdt', label: 'USDT' },
];

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

interface AddTransactionSheetProps {
  isOpen: boolean;
  initialType?: TransactionType;
  onClose: () => void;
}

export const AddTransactionSheet = ({
  isOpen,
  initialType,
  onClose,
}: AddTransactionSheetProps) => {
  const sheetRef = useRef<BottomSheet>(null);

  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const categories = useCategoryStore((s) => s.categories);

  const [txType, setTxType] = useState<TransactionType>(
    initialType ?? 'expense',
  );
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO);
  const [paymentMethod, setPaymentMethod] = useState('bsc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const colors = useThemeColors();

  // Control sheet visibility via ref methods
  useEffect(() => {
    if (isOpen) {
      setTxType(initialType ?? 'expense');
      setAmount('');
      setCategoryId(null);
      setDescription('');
      setDate(todayISO);
      setPaymentMethod('bsc');
      setIsSubmitting(false);
      setContentKey((k) => k + 1);
      // Use setTimeout to ensure state updates are flushed before opening
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 50);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen, initialType]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === txType),
    [categories, txType],
  );

  const title = txType === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto';
  const saveLabel = txType === 'income' ? 'Guardar Ingreso' : 'Guardar Gasto';

  const handleKeyPress = useCallback((key: string) => {
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
  }, []);

  const handleSubmit = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido mayor a 0');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Seleccioná una categoría');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: amountNum,
        type: txType,
        categoryId,
        description,
        date,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, categoryId, date, description, addTransaction, txType, onClose]);

  const displayAmount = amount === '' ? '0' : amount;

  const keyboardRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  const PADDING_2REM = 32;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['100%']}
      enablePanDownToClose
      onChange={(index) => {
        if (index === -1) onClose();
      }}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
      handleIndicatorStyle={{
        width: 32,
        height: 4,
        borderRadius: 9999,
        backgroundColor: colors.glassBorderStrong,
      }}
      keyboardBlurBehavior="none"
    >
      <View style={{ flex: 1 }}>
        <BottomSheetScrollView
          key={contentKey}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 96 }}
        >
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
              onPress={() => sheetRef.current?.close()}
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
          <View style={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: '600',
                color: colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              MONTO TOTAL
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 28,
                  fontWeight: '600',
                  color: colors.primary,
                  marginBottom: 4,
                }}
              >
                $
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: colors.onSurface,
                  lineHeight: 72,
                }}
              >
                {displayAmount}
              </Text>
            </View>
          </View>

          {/* Category chips — horizontal carousel */}
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
              {filteredCategories.map((cat) => {
                const active = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
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
                    <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
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

          {/* Payment method chips */}
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
                const active = pm.id === paymentMethod;
                return (
                  <Pressable
                    key={pm.id}
                    onPress={() => setPaymentMethod(pm.id)}
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
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            {keyboardRows.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {row.map((key) => {
                  const isBackspace = key === 'backspace';
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleKeyPress(key)}
                      style={{
                        flex: 1,
                        height: 64,
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
                          fontSize: isBackspace ? 18 : 22,
                          fontWeight: '600',
                          color: isBackspace ? colors.error : colors.onSurface,
                        }}
                      >
                        {isBackspace ? '⌫' : key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </BottomSheetScrollView>

        {/* Fixed save button — above tab bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: PADDING_2REM,
            backgroundColor: colors.background,
          }}
        >
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
      </View>
    </BottomSheet>
  );
};
