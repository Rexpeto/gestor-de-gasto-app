import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Plus, Search, Inbox } from 'lucide-react-native/icons';
import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import type { Transaction, TransactionType } from '@/types';

const formatCurrency = (amount: number): string =>
  `$${Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);

  if (date.getTime() === today.getTime()) return 'Hoy';
  if (date.getTime() === yesterday.getTime()) return 'Ayer';
  if (date.getTime() >= weekStart.getTime()) return 'Esta Semana';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

type FilterType = 'all' | TransactionType;
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'expense', label: 'Gastos' },
  { key: 'income', label: 'Ingresos' },
];

export default function TransactionsScreen() {
  const transactions = useTransactionStore((s) => s.transactions);
  const removeTransaction = useTransactionStore((s) => s.removeTransaction);
  const categories = useCategoryStore((s) => s.categories);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryInfo = useCallback(
    (categoryId: number) => categories.find((c) => c.id === categoryId),
    [categories],
  );

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') {
      result = result.filter((tx) => tx.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const cat = getCategoryInfo(tx.categoryId);
        return (
          tx.description.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [transactions, filterType, searchQuery, getCategoryInfo]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filteredTransactions) {
      const label = getDateLabel(tx.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(tx);
    }
    return map;
  }, [filteredTransactions]);

  const handleDelete = (tx: Transaction) => {
    const category = getCategoryInfo(tx.categoryId);
    Alert.alert(
      'Eliminar movimiento',
      `¿Eliminar ${tx.description || category?.name || 'este movimiento'} por ${formatCurrency(tx.amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeTransaction(tx.id) },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0e1513' }}>
      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: 60 }}>
        <View style={{ backgroundColor: 'rgba(14, 21, 19, 0.8)', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#3c4a46' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 'bold', fontSize: 24, letterSpacing: -0.5, color: '#57f1db' }}>Financier</Text>
        </View>
      </View>

      {/* Content Container */}
      <View style={{ flex: 1, paddingTop: 116 }}>
        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(33, 33, 33, 0.7)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
            <Search size={20} color="#888888" />
            <TextInput
              style={{ marginLeft: 8, fontFamily: 'Inter', fontSize: 15, color: '#ffffff', flex: 1, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
              placeholder="Buscar comercio o categoría..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Pills */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {FILTERS.map((f) => {
                const active = filterType === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? '#57f1db' : '#1a211f',
                      borderWidth: active ? 0 : 1,
                      borderColor: '#3c4a46',
                      ...(active ? { shadowColor: '#57f1db', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 } : {})
                    }}
                    onPress={() => setFilterType(f.key)}
                  >
                    <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: active ? '#0e1513' : '#bacac5' }}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Transaction Groups */}
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {filteredTransactions.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 64 }}>
              <Inbox size={48} color="#888888" />
              <Text style={{ fontFamily: 'Inter', fontSize: 15, color: '#888888', marginTop: 12 }}>No hay movimientos</Text>
            </View>
          ) : (
            Array.from(grouped.entries()).map(([label, txs]) => (
              <View key={label} style={{ marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#bacac5', marginBottom: 12, paddingHorizontal: 20 }}>{label}</Text>
                <View style={{ backgroundColor: '#1a211f', borderRadius: 12, marginHorizontal: 20, overflow: 'hidden' }}>
                  {txs.map((tx, index) => {
                    const cat = getCategoryInfo(tx.categoryId);
                    const isExpense = tx.type === 'expense';
                    const time = '14:30';
                    return (
                      <Pressable
                        key={tx.id}
                        onLongPress={() => handleDelete(tx)}
                        onPress={() => router.push({ pathname: '/add-transaction', params: { id: tx.id } })}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          borderBottomWidth: index < txs.length - 1 ? 1 : 0,
                          borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                          backgroundColor: pressed ? 'rgba(87, 241, 219, 0.05)' : 'transparent'
                        })}
                      >
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          backgroundColor: cat?.color ? `${cat.color}20` : 'rgba(87, 241, 219, 0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 16
                        }}>
                          <Text style={{ fontSize: 20, color: cat?.color || '#57f1db' }}>{cat?.icon || '•'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#dde4e1' }}>{tx.description}</Text>
                          <Text style={{ fontFamily: 'Inter', fontSize: 13, color: '#bacac5', marginTop: 2 }}>{cat?.name || 'Sin categoría'} • {time}</Text>
                        </View>
                        <Text style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: isExpense ? '#ffb4ab' : '#57f1db', fontVariant: ['tabular-nums'] }}>
                          {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* FAB */}
      <Pressable
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#57f1db', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, zIndex: 30 }}
        onPress={() => router.push('/add-transaction')}
      >
        <Plus size={24} color="#0e1513" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
