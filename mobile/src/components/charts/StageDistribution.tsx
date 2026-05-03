import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

interface StageRow {
  stage_name: string;
  count: number;
}

const PALETTE = ['#0ea5e9', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

export function StageDistribution({ data, title }: { data: StageRow[]; title: string }) {
  const total = data.reduce((s, r) => s + Number(r.count || 0), 0) || 1;
  const sorted = [...data].sort((a, b) => Number(b.count) - Number(a.count));

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(300)}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="mt-3 gap-2.5">
        {sorted.map((row, i) => {
          const pct = (Number(row.count) / total) * 100;
          const color = PALETTE[i % PALETTE.length];
          return (
            <View key={row.stage_name + i}>
              <View className="flex-row items-center justify-between pb-1">
                <Text className="flex-1 text-xs font-medium text-foreground" numberOfLines={1}>
                  {row.stage_name}
                </Text>
                <Text className="text-xs tabular-nums text-muted-foreground">
                  {row.count} · {pct.toFixed(0)}%
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-muted">
                <Animated.View
                  entering={FadeInRight.duration(700).delay(350 + i * 70)}
                  style={{ width: `${Math.max(2, pct)}%`, height: '100%' }}
                >
                  <View
                    style={{ flex: 1, backgroundColor: color, borderRadius: 999 }}
                  />
                </Animated.View>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
