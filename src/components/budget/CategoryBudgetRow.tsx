import { CategoryIcon } from '@/components/CategoryIcon';
import { BudgetInput } from '@/components/fiscal/BudgetInput';
import { useThemeColors } from '@/store/theme-store';
import { Pressable, Text, View } from 'react-native';
import { Pause, Play, Trash2 } from 'lucide-react-native/icons';

import type { BudgetCurrency } from '@/store/budget-store';

interface CategoryBudgetRowProps {
  category: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };
  budget?: {
    amount: number;
    currency: BudgetCurrency;
    enabled: boolean;
  } | null;
  /** Spent amount in USDT equivalent */
  spentUsdt: number;
  /** Budget amount in USDT equivalent */
  budgetUsdt: number;
  /** Spent amount converted back to budget's currency (for display) */
  spentInBudgetCurrency: number;
  editValue: string;
  onEditChange: (v: string) => void;
  onEditBlur: () => void;
  onCurrencyChange: (c: BudgetCurrency) => void;
  onRemove: () => void;
  onToggle: () => void;
}

export function CategoryBudgetRow({
  category,
  budget,
  spentUsdt,
  budgetUsdt,
  spentInBudgetCurrency,
  editValue,
  onEditChange,
  onEditBlur,
  onCurrencyChange,
  onRemove,
  onToggle,
}: CategoryBudgetRowProps) {
  const colors = useThemeColors();

  const isEnabled = budget?.enabled ?? false;
  const currency = budget?.currency ?? '$';

  // Calculate percentage based on USDT equivalents
  const pct = isEnabled && budgetUsdt > 0
    ? Math.min(Math.round((spentUsdt / budgetUsdt) * 100), 100)
    : 0;
  const isOver = isEnabled && spentUsdt > budgetUsdt;

  return (
    <View
      className="rounded-2xl p-4 mb-2"
      style={{
        backgroundColor: !isEnabled && budget ? `${colors.glassSurface}66` : colors.glassSurface,
        borderWidth: 1,
        borderColor: isEnabled
          ? isOver ? `${colors.danger}4d` : colors.glassBorder
          : colors.glassBorder,
        opacity: budget && !isEnabled ? 0.5 : 1,
      }}
    >
      <View className="flex-row items-center gap-3">
        {/* Category icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: category.color + '20' }}
        >
          <CategoryIcon name={category.icon} size={20} color={category.color} />
        </View>

        <View className="flex-1">
          {/* Name + percentage */}
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className="text-sm font-medium"
              style={{ fontFamily: 'Inter', color: colors.onSurface }}
            >
              {category.name}
            </Text>
            <Text
              className="text-xs font-semibold"
              style={{ fontFamily: 'Inter', color: isOver ? colors.danger : colors.onSurfaceVariant }}
            >
              {pct}% usado
            </Text>
          </View>

          {/* Progress bar */}
          {isEnabled && (
            <View
              className="h-1.5 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: colors.glassBorder }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isOver
                    ? colors.danger
                    : pct >= 100
                      ? colors.success
                      : category.color,
                }}
              />
            </View>
          )}

          {/* Input + actions */}
          <View className="flex-row items-center gap-2">
            <BudgetInput
              value={editValue}
              onChangeText={onEditChange}
              currency={currency}
              onCurrencyChange={onCurrencyChange}
              size="sm"
            />

            <View className="flex-row gap-2 ml-auto">
              {budget && (
                <Pressable
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${colors.danger}33` }}
                  onPress={onRemove}
                >
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              )}

              {budget && (
                <Pressable
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: isEnabled ? `${colors.danger}33` : `${colors.primary}33`,
                  }}
                  onPress={onToggle}
                >
                  {isEnabled ? (
                    <Pause size={16} color="#fff" />
                  ) : (
                    <Play size={16} color={colors.primary} />
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Spent / budget text — show original currency amounts */}
          {budget && (
            <Text className="text-xs mt-2" style={{ fontFamily: 'Inter', color: colors.outline }}>
              Gastado: {currency}{spentInBudgetCurrency.toLocaleString('es-ES', { minimumFractionDigits: 2 })} / {currency}{budget.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
