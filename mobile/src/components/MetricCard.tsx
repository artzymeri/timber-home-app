import { Text, View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient as SvgLinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'brand' | 'info';

interface MetricCardProps {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: Tone;
  index?: number;
}

interface ToneStyles {
  plate: string;
  iconColor: string | { light: string; dark: string };
  /** Hex used for the radial glow + diagonal sweep + top accent line. */
  glow: string;
  /** Slightly different hue for the secondary corner gradient. */
  glowAccent: string;
}

const TONE: Record<Tone, ToneStyles> = {
  default: {
    plate: 'bg-stone-200 dark:bg-stone-700',
    iconColor: { light: '#1e293b', dark: '#e2e8f0' },
    glow: '#94a3b8',
    glowAccent: '#0ea5e9',
  },
  brand: {
    plate: 'bg-sky-100 dark:bg-sky-500/20',
    iconColor: '#0284c7',
    glow: '#0ea5e9',
    glowAccent: '#06b6d4',
  },
  info: {
    plate: 'bg-violet-100 dark:bg-violet-500/20',
    iconColor: '#7c3aed',
    glow: '#a855f7',
    glowAccent: '#6366f1',
  },
  success: {
    plate: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: '#059669',
    glow: '#10b981',
    glowAccent: '#22d3ee',
  },
  warning: {
    plate: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: '#d97706',
    glow: '#f59e0b',
    glowAccent: '#f43f5e',
  },
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
  const { resolved } = useTheme();
  const t = TONE[tone];
  const iconColor =
    typeof t.iconColor === 'string' ? t.iconColor : t.iconColor[resolved === 'dark' ? 'dark' : 'light'];
  const dark = resolved === 'dark';

  const card = (
    <Animated.View
      entering={FadeInDown.duration(450).delay(index * 90)}
      className="relative h-[148px] overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* Layered background:
          1. Top-right radial glow (primary tone)
          2. Bottom-left subtle accent (secondary tone)
          3. Diagonal LinearGradient sheen tying it together
          4. Hairline top-edge gradient accent */}
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        preserveAspectRatio="none"
        viewBox="0 0 200 148"
      >
        <Defs>
          <RadialGradient id={`glow-${tone}`} cx="100%" cy="0%" rx="70%" ry="80%">
            <Stop offset="0%" stopColor={t.glow} stopOpacity={dark ? 0.35 : 0.28} />
            <Stop offset="55%" stopColor={t.glow} stopOpacity={dark ? 0.08 : 0.07} />
            <Stop offset="100%" stopColor={t.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`accent-${tone}`} cx="0%" cy="100%" rx="50%" ry="60%">
            <Stop offset="0%" stopColor={t.glowAccent} stopOpacity={dark ? 0.18 : 0.14} />
            <Stop offset="100%" stopColor={t.glowAccent} stopOpacity={0} />
          </RadialGradient>
          <SvgLinearGradient id={`top-line-${tone}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={t.glow} stopOpacity={0} />
            <Stop offset="50%" stopColor={t.glow} stopOpacity={dark ? 0.6 : 0.45} />
            <Stop offset="100%" stopColor={t.glow} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="148" fill={`url(#accent-${tone})`} />
        <Rect x="0" y="0" width="200" height="148" fill={`url(#glow-${tone})`} />
        <Rect x="0" y="0" width="200" height="1" fill={`url(#top-line-${tone})`} />
      </Svg>

      {/* Diagonal sheen overlay — adds depth across the whole surface. */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Foreground content */}
      <View className="relative p-4">
        {/* Header: icon plate + optional drill-in arrow */}
        <View className="flex-row items-start justify-between">
          <View className={cn('h-10 w-10 items-center justify-center rounded-xl', t.plate)}>
            {Icon ? <Icon size={18} color={iconColor} /> : null}
          </View>
          {href ? (
            <View className="opacity-50">
              <ArrowUpRight size={14} color="#78716c" />
            </View>
          ) : (
            <View className="h-3.5" />
          )}
        </View>

        {/* Value — always at the same vertical position */}
        <View className="mt-3">
          {typeof value === 'number' ? (
            <AnimatedNumber
              value={value}
              format={format}
              className="text-[26px] font-bold tabular-nums text-foreground"
            />
          ) : (
            <Text className="text-[26px] font-bold tabular-nums text-foreground" numberOfLines={1}>
              {value}
            </Text>
          )}
        </View>

        {/* Label + hint — fixed-height slot so all cards line up. */}
        <View className="mt-1 h-9 justify-end">
          <Text
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text className="text-[11px] text-muted-foreground/80" numberOfLines={1}>
            {hint ?? ' '}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  if (href) {
    return (
      <Pressable onPress={() => router.push(href as any)} className="active:opacity-80">
        {card}
      </Pressable>
    );
  }
  return card;
}
