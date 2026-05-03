import { Dimensions, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/lib/theme';

interface MonthlyPoint {
  month: string;
  revenue: number;
}

export function RevenueChart({ data, title }: { data: MonthlyPoint[]; title: string }) {
  const { resolved } = useTheme();
  const width = Dimensions.get('window').width - 64; // page padding 16 each side + card padding

  const chartData = data.map((p, i) => ({
    value: Number(p.revenue) || 0,
    label: p.month?.slice(5) ?? String(i + 1),
    labelTextStyle: {
      color: resolved === 'dark' ? '#a8a29e' : '#78716c',
      fontSize: 10,
    },
  }));

  const max = Math.max(1, ...chartData.map((p) => p.value));

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(200)}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="mt-3 -ml-2">
        <LineChart
          areaChart
          curved
          data={chartData}
          width={width - 16}
          height={160}
          maxValue={max * 1.15}
          noOfSections={3}
          startFillColor="#0ea5e9"
          startOpacity={0.35}
          endFillColor="#0ea5e9"
          endOpacity={0.02}
          color="#0ea5e9"
          thickness={2.5}
          dataPointsColor="#0ea5e9"
          dataPointsRadius={3}
          yAxisColor="transparent"
          xAxisColor={resolved === 'dark' ? '#292524' : '#e7e5e4'}
          rulesColor={resolved === 'dark' ? '#1c1917' : '#f5f5f4'}
          rulesType="solid"
          yAxisTextStyle={{
            color: resolved === 'dark' ? '#78716c' : '#a8a29e',
            fontSize: 10,
          }}
          formatYLabel={(v) => `€${Math.round(Number(v) / 1000)}k`}
          spacing={Math.max(28, (width - 64) / Math.max(1, chartData.length))}
          initialSpacing={12}
          endSpacing={12}
          isAnimated
          animationDuration={900}
        />
      </View>
    </Animated.View>
  );
}
