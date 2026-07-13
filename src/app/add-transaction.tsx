import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { TransactionType } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
      Alert.alert('Error', 'Ingresá un monto válido mayor a 0');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Seleccioná una categoría');
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
        });
      } else {
        await addTransaction({
          amount: amountNum,
          type: txType,
          categoryId,
          description,
          date,
        });
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, categoryId, date, description, editTransaction, id, isEditing, addTransaction, txType]);

  const displayAmount = amount === '' ? '0' : amount;

  const keyboardRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

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
          backgroundColor: '#0e1513',
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
                  backgroundColor: 'rgba(255,255,255,0.15)',
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
                <Text style={{ fontFamily: 'Inter', fontSize: 20, color: '#bacac5' }}>✕</Text>
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 17,
                    color: '#dde4e1',
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
                  color: '#bacac5',
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
                    color: '#57f1db',
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
                    color: '#dde4e1',
                    lineHeight: 72,
                  }}
                >
                  {displayAmount}
                </Text>
              </View>
            </View>

            {/* Category chips */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: '600',
                  color: '#bacac5',
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
                          ? 'rgba(87,241,219,0.2)'
                          : '#242b2a',
                        borderColor: active
                          ? 'rgba(87,241,219,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        shadowColor: active ? '#57f1db' : 'transparent',
                        shadowOpacity: active ? 0.25 : 0,
                        shadowRadius: active ? 8 : 0,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      <Text
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: '500',
                          color: active ? '#57f1db' : '#bacac5',
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
                  color: '#bacac5',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 10,
                }}
              >
                Método de Pago
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
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
                          ? 'rgba(87,241,219,0.2)'
                          : '#242b2a',
                        borderColor: active
                          ? 'rgba(87,241,219,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        shadowColor: active ? '#57f1db' : 'transparent',
                        shadowOpacity: active ? 0.25 : 0,
                        shadowRadius: active ? 8 : 0,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: '500',
                          color: active ? '#57f1db' : '#bacac5',
                        }}
                      >
                        {pm.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
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
                  backgroundColor: '#242b2a',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, color: '#bacac5' }}>📅</Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: '#dde4e1',
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
                  backgroundColor: '#242b2a',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, color: '#bacac5' }}>✏️</Text>
                <TextInput
                  placeholder="¿En qué gastaste?"
                  placeholderTextColor="#859490"
                  value={description}
                  onChangeText={setDescription}
                  style={{
                    flex: 1,
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: '#dde4e1',
                    paddingVertical: 10,
                  }}
                />
              </View>
            </View>

            {/* Custom numeric keyboard */}
            <View style={{ paddingHorizontal: 20 }}>
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
                            ? 'rgba(255,180,171,0.1)'
                            : 'rgba(255,255,255,0.05)',
                        }}
                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Inter',
                            fontSize: isBackspace ? 18 : 22,
                            fontWeight: '600',
                            color: isBackspace ? '#ffb4ab' : '#dde4e1',
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

            {/* Save button */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 80 }}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  alignSelf: 'stretch',
                  height: 56,
                  borderRadius: 24,
                  backgroundColor: isSubmitting
                    ? 'rgba(87,241,219,0.5)'
                    : '#57f1db',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: '#57f1db',
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
                    color: '#00201c',
                  }}
                >
                  {saveLabel}
                </Text>
                <Text style={{ fontSize: 18, color: '#00201c' }}>→</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
