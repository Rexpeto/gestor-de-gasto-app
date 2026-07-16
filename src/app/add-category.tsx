import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CategoryIcon, ICON_NAMES } from '@/components/CategoryIcon';
import { showSuccessToast, showErrorToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import { useThemeColors } from '@/store/theme-store';
import type { TransactionType } from '@/types';
import { ArrowRight } from 'lucide-react-native/icons';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
];

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#78716c', '#64748b',
];

const PRESET_ICONS = ICON_NAMES;

export default function AddCategoryScreen() {
  const addCategory = useCategoryStore((s) => s.addCategory);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('circle-question-mark');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = useThemeColors();

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      showErrorToast('Ingresá un nombre para la categoría');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCategory({ name: name.trim(), icon, color, type });
      showSuccessToast('Categoría creada');
      router.back();
    } catch {
      showErrorToast('No se pudo crear la categoría');
    } finally {
      setIsSubmitting(false);
    }
  }, [addCategory, color, icon, name, type]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Type Selector ── */}
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.05,
            textTransform: 'uppercase',
            color: colors.onSurfaceVariant,
            marginBottom: 8,
          }}
        >
          Tipo
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor:
                  type === opt.value ? `${colors.primary}1F` : colors.surfaceContainerHigh,
                borderWidth: 1,
                borderColor:
                  type === opt.value ? `${colors.primary}4D` : colors.glassBorder,
              }}
              onPress={() => setType(opt.value)}
            >
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '500',
                  color: type === opt.value ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Name Input ── */}
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.05,
            textTransform: 'uppercase',
            color: colors.onSurfaceVariant,
            marginBottom: 8,
          }}
        >
          Nombre
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceContainerHigh,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 20,
          }}
        >
          <TextInput
            placeholder="Ej: Supermercado"
            placeholderTextColor={colors.outline}
            value={name}
            onChangeText={setName}
            style={{
              flex: 1,
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.onSurface,
              paddingVertical: 12,
            }}
          />
        </View>

        {/* ── Icon Picker (scrollable) ── */}
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.05,
            textTransform: 'uppercase',
            color: colors.onSurfaceVariant,
            marginBottom: 8,
          }}
        >
          Icono
        </Text>
        <ScrollView
          style={{ maxHeight: 200, marginBottom: 20 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_ICONS.map((ic) => (
              <Pressable
                key={ic}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    icon === ic ? `${colors.primary}1F` : colors.surfaceContainerHigh,
                  borderWidth: 1,
                  borderColor:
                    icon === ic ? `${colors.primary}4D` : colors.glassBorder,
                }}
                onPress={() => setIcon(ic)}
              >
                <CategoryIcon
                  name={ic}
                  size={20}
                  color={icon === ic ? colors.primary : colors.onSurfaceVariant}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ── Color Picker (scrollable) ── */}
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.05,
            textTransform: 'uppercase',
            color: colors.onSurfaceVariant,
            marginBottom: 8,
          }}
        >
          Color
        </Text>
        <ScrollView
          style={{ maxHeight: 180, marginBottom: 20 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_COLORS.map((c) => (
              <Pressable
                key={c}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: c,
                  borderWidth: color === c ? 2 : 0,
                  borderColor: color === c ? colors.primary : 'transparent',
                }}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ── Preview ── */}
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}20`,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <CategoryIcon name={icon} size={32} color={color} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: '500',
              color: colors.onSurface,
              marginTop: 8,
            }}
          >
            {name || 'Nombre'}
          </Text>
        </View>

        {/* ── Submit Button ── */}
        <View style={{ marginTop: 24 }}>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              height: 56,
              borderRadius: 24,
              backgroundColor: isSubmitting ? `${colors.primary}80` : colors.primary,
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
              Crear categoría
            </Text>
            <ArrowRight size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
