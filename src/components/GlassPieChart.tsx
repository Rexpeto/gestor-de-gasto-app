import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import type { CategorySummary } from '@/types';

interface GlassPieChartProps {
  data: CategorySummary[];
  totalLabel?: string;
}

export function GlassPieChart({ data, totalLabel }: GlassPieChartProps) {
  const isEmpty = !data || data.length === 0;

  const chartData = (data ?? []).map((item) => ({
    value: item.total,
    color: item.categoryColor,
    text: `${item.percentage.toFixed(0)}%`,
    focused: false,
    label: item.categoryName,
  }));

  const total = data.reduce((sum, d) => sum + d.total, 0);

  const renderCenter = () => (
    <View className="items-center">
      <Text
        style={{ fontFamily: 'Inter', color: '#bacac5', fontSize: 11 }}
      >
        {totalLabel ?? 'Total'}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter',
          color: '#dde4e1',
          fontSize: 18,
          fontWeight: '700',
        }}
      >
        ${total.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
      </Text>
    </View>
  );

  if (isEmpty) {
    return (
      <View className="items-center py-6">
        <Text
          style={{ fontFamily: 'Inter', color: '#bacac5', fontSize: 14 }}
        >
          Sin datos este mes
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      <PieChart
        data={chartData}
        donut
        showText
        textColor="#0e1513"
        textSize={11}
        fontWeight="700"
        radius={90}
        innerRadius={55}
        innerCircleColor="transparent"
        centerLabelComponent={renderCenter}
        focusOnPress
        showValuesAsLabels
        strokeColor="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
      {/* ── Legend ── */}
      <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {chartData.map((item, index) => (
          <View key={index} className="flex-row items-center gap-1.5">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text
              style={{
                fontFamily: 'Inter',
                color: '#bacac5',
                fontSize: 12,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
