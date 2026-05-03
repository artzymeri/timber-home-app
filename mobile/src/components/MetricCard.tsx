import { Text, View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  /** Either a numeric value (animated count-up) or a pre-formatted string. */
  value: number | string;
  /** Optional formatter when `value` is numeric. Default: integer with thousands separators. */
  format?: (n: number) => string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: 'default' | 'success' | 'warning' | 'brand';
  /** Stagger index for entrance animation. */
  index?: number;
}

const toneRing: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'bg-muted',
  success: 'bg-emerald-100 dark:bg-emerald-500/15',
  warning: 'bg-amber-100 dark:bg-amber-500/15',
  brand: 'bg-sky-100 dark:bg-sky-500/15',
};

const toneIconColor: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: '#1c1917',
  success: '#059669',
  warning: '#d97706',
  brand: '#0284c7',
};

export function MetricCard({
  label,
  value,
  format,
  hint,
  icon: Icon,
  href,
  tone = 'default',
  index = 0,
}: MetricCardProps) {
  const router = useRouter();

  const content = (
    <Animated.View
      entering={FadeInDown.duration(450).delay(index * 90)}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
        {Icon && (
          <View className={cn('h-8 w-8 items-center justify-center rounded-full', toneRing[tone])}>
            <Icon size={16} color={toneIconColor[tone]} />
          </View>
        )}
      </View>
      <View className="mt-2">
        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            format={format}
            className="text-2xl font-bold tabular-nums text-foreground"
          />
        ) : (
          <Text className="text-2xl font-bold tabular-nums text-foreground">{value}</Text>
        )}
      </View>
      {hint && <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>{hint}</Text>}
    </Animated.View>
  );

  if (href) {
    return (
      <Pressable onPress={() => router.push(href as any)} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }
  return content;
}
