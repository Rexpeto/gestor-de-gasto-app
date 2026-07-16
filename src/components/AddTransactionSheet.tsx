import { ArrowRight, CalendarDays, Pencil } from 'lucide-react-native/icons';

import { AmountDisplay } from '@/components/AmountDisplay';
import { CategoryPicker } from '@/components/CategoryPicker';
import { NumericKeyboard } from '@/components/NumericKeyboard';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { showErrorToast, showSuccessToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import { useSheetStore } from '@/store/sheet-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { TransactionType } from '@/types';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function formatDateDisplay(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const prefix = isToday ? 'Hoy, ' : '';
  return `${prefix}${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
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
  const editTransaction = useTransactionStore((s) => s.editTransaction);
  const categories = useCategoryStore((s) => s.categories);
  const editingTransaction = useSheetStore((s) => s.editingTransaction);

  const [txType, setTxType] = useState<TransactionType>(
    initialType ?? 'expense',
  );
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bsc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const colors = useThemeColors();

  const isEditing = editingTransaction !== null;

  // Control sheet visibility + pre-fill form in edit mode
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        // ── Edit mode: pre-fill ──
        setTxType(editingTransaction.type);
        setAmount(String(editingTransaction.amount));
        setCategoryId(editingTransaction.categoryId);
        setDescription(editingTransaction.description);
        setSelectedDate(new Date(editingTransaction.date + 'T00:00:00'));
        setShowDatePicker(false);
        setPaymentMethod(editingTransaction.currency || 'bsc');
        setIsSubmitting(false);
      } else {
        // ── Create mode: reset ──
        setTxType(initialType ?? 'expense');
        setAmount('');
        setCategoryId(null);
        setDescription('');
        setSelectedDate(new Date());
        setShowDatePicker(false);
        setPaymentMethod('bsc');
        setIsSubmitting(false);
      }
      setContentKey((k) => k + 1);
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 50);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen, initialType, editingTransaction]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === txType),
    [categories, txType],
  );

  const title = isEditing
    ? txType === 'income'
      ? 'Editar Ingreso'
      : 'Editar Gasto'
    : txType === 'income'
      ? 'Nuevo Ingreso'
      : 'Nuevo Gasto';

  const saveLabel = isEditing
    ? 'Actualizar'
    : txType === 'income'
      ? 'Guardar Ingreso'
      : 'Guardar Gasto';

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
      showErrorToast('Ingresá un monto válido mayor a 0');
      return;
    }
    if (!categoryId) {
      showErrorToast('Seleccioná una categoría');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateISO = selectedDate.toISOString().split('T')[0];
      if (editingTransaction) {
        await editTransaction(editingTransaction.id, {
          amount: amountNum,
          type: txType,
          categoryId,
          description,
          date: dateISO,
          currency: paymentMethod,
        });
        showSuccessToast('Transacción actualizada');
      } else {
        await addTransaction({
          amount: amountNum,
          type: txType,
          categoryId,
          description,
          date: dateISO,
          currency: paymentMethod,
        });
        showSuccessToast('Transacción guardada');
      }
      onClose();
    } catch {
      showErrorToast('No se pudo guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amount,
    categoryId,
    selectedDate,
    description,
    paymentMethod,
    addTransaction,
    editTransaction,
    editingTransaction,
    txType,
    onClose,
  ]);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, pickedDate?: Date) => {
      setShowDatePicker(false);
      if (pickedDate) setSelectedDate(pickedDate);
    },
    [],
  );

  const displayAmount = amount === '' ? '0' : amount;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['98%']}
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
          </View>

          {/* Amount display */}
          <AmountDisplay amount={displayAmount} currency={paymentMethod} />

          {/* Category chips — horizontal carousel */}
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

          {/* Date picker row */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
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
              <CalendarDays size={16} color={colors.onSurfaceVariant} />
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.onSurface,
                }}
              >
                {formatDateDisplay(selectedDate)}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
              />
            </View>
          )}

          {/* Description (full width) */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
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
              <Pencil size={16} color={colors.onSurfaceVariant} />
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

          <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
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
            <ArrowRight size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
        </BottomSheetScrollView>
        
      </View>
    </BottomSheet>
  );
};
