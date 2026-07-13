import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CategoryIcon, ICON_NAMES } from '@/components/CategoryIcon';
import { showSuccessToast, showErrorToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import { useThemeColors } from '@/store/theme-store';
import type { TransactionType } from '@/types';

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
  }, [addCategory, color, icon, name, router, type]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Type Selector ── */}
        <Text
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
        >
          Tipo
        </Text>
        <View className="flex-row gap-2 mb-5">
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              className="flex-1 py-3.5 rounded-xl items-center"
              style={{
                backgroundColor:
                  type === opt.value ? colors.primary + '1F' : colors.glassSurface,
                borderWidth: 1,
                borderColor:
                  type === opt.value ? colors.primary + '4D' : colors.glassBorder,
              }}
              onPress={() => setType(opt.value)}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  fontFamily: 'Inter',
                  color: type === opt.value ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Name ── */}
        <View
          className="rounded-xl p-3 mb-4"
          style={{
            backgroundColor: colors.glassSurface,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <TextField isRequired>
            <Label className="text-xs uppercase tracking-wider font-sans" style={{ color: colors.onSurfaceVariant }}>
              Nombre
            </Label>
            <Input
              placeholder="Ej: Supermercado"
              placeholderTextColor={colors.outline}
              value={name}
              onChangeText={setName}
              style={{ fontFamily: 'Inter', color: colors.onSurface }}
            />
          </TextField>
        </View>

        {/* ── Icon Picker ── */}
        <Text
          className="text-xs font-semibold uppercase tracking-widest mt-4 mb-2"
          style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
        >
          Icono
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESET_ICONS.map((ic) => (
            <Pressable
              key={ic}
              className="w-11 h-11 rounded-xl items-center justify-center"
              style={{
                backgroundColor:
                  icon === ic ? colors.primary + '1F' : colors.glassSurface,
                borderWidth: 1,
                borderColor:
                  icon === ic ? colors.primary + '4D' : colors.glassBorder,
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

        {/* ── Color Picker ── */}
        <Text
          className="text-xs font-semibold uppercase tracking-widest mt-4 mb-2"
          style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
        >
          Color
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <Pressable
              key={c}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{
                backgroundColor: c,
                borderWidth: color === c ? 2 : 0,
                borderColor: color === c ? colors.primary : 'transparent',
              }}
              onPress={() => setColor(c)}
            >
              {color === c && (
                <Text className="text-white text-sm font-bold">✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Preview ── */}
        <View className="mt-6 items-center">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: color + '20',
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <CategoryIcon name={icon} size={36} color={color} />
          </View>
          <Text
            className="font-medium mt-2"
            style={{ fontFamily: 'Inter', color: colors.onSurface }}
          >
            {name || 'Nombre'}
          </Text>
        </View>

        {/* ── Submit ── */}
        <View className="mt-8 gap-3">
          <Pressable
            className="w-full py-3.5 rounded-full items-center"
            style={{ backgroundColor: isSubmitting ? colors.primary + '80' : colors.primary }}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: 'Inter', color: colors.onPrimary }}
            >
              Crear categoría
            </Text>
          </Pressable>
          <Pressable
            className="w-full py-3.5 rounded-full items-center"
            style={{
              backgroundColor: colors.glassSurface,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
            onPress={() => router.back()}
          >
            <Text
              className="text-base font-medium"
              style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}
            >
              Cancelar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
