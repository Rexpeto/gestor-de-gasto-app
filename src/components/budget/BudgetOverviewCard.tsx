import { useThemeColors } from '@/store/theme-store';
import { PiggyBank } from 'lucide-react-native/icons';
import { View, Text } from 'react-native';

import { GlassCard } from '@/components/settings/GlassCard';

interface BudgetOverviewCardProps {
  totalBudgeted: number;
  totalSpent: number;
  overspentPct: number;
  isOverBudget: boolean;
}

export function BudgetOverviewCard({
  totalBudgeted,
  totalSpent,
  overspentPct,
  isOverBudget,
}: BudgetOverviewCardProps) {
  const colors = useThemeColors();

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-3">
        <PiggyBank size={20} color={colors.primary} />
        <Text
          className="text-base font-semibold"
          style={{ fontFamily: 'Inter', color: colors.onSurface }}
        >
          Presupuesto mensual
        </Text>
      </View>

      {/* Total amount */}
      <View className="flex-row items-baseline gap-1 mb-2">
        <Text
          className="text-3xl font-bold"
          style={{ fontFamily: 'Inter', color: colors.primary }}
        >
          ${totalBudgeted.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </Text>
        <Text className="text-xs" style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant }}>
          / mes
        </Text>
      </View>

      {/* Progress bar */}
      {totalBudgeted > 0 && (
        <>
          <View
            className="h-2 rounded-full overflow-hidden mt-3"
            style={{ backgroundColor: colors.glassBorder }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(overspentPct, 100)}%`,
                backgroundColor: isOverBudget ? colors.danger : colors.primary,
              }}
            />
          </View>

          {/* Stats row */}
          <View className="flex-row justify-between mt-2">
            <Text
              className="text-xs font-medium"
              style={{
                fontFamily: 'Inter',
                color: isOverBudget ? colors.danger : colors.onSurfaceVariant,
              }}
            >
              Gastado: ${totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
            <Text
              className="text-xs font-medium"
              style={{
                fontFamily: 'Inter',
                color: isOverBudget ? colors.danger : colors.onSurfaceVariant,
              }}
            >
              {overspentPct}%
            </Text>
          </View>

          {/* Over budget warning */}
          {isOverBudget && (
            <View
              className="mt-3 rounded-xl p-3"
              style={{
                backgroundColor: `${colors.danger}4D`,
                borderWidth: 1,
                borderColor: `${colors.danger}4d`,
              }}
            >
              <Text className="text-xs font-medium" style={{ fontFamily: 'Inter', color: colors.danger }}>
                ⚠ Has superado tu presupuesto mensual
              </Text>
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
}
