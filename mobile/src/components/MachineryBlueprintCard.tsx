import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import {
  AlertTriangle,
  Cog,
  Hammer,
  Layers,
  Paintbrush,
  Scissors,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { useI18n, type TranslationKeys } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface Machine {
  id: number;
  name: string;
  type: string;
  serial_number: string;
  location: string | null;
  status: 'operational' | 'idle' | 'maintenance' | 'error';
  error_message: string | null;
  last_service_at: string | null;
}

const TYPE_ICON: Record<string, LucideIcon> = {
  'CNC Router': Cog,
  'Panel Saw': Scissors,
  Edgebander: Layers,
  Sander: Hammer,
  'Drill Press': Wrench,
  'Finishing Booth': Paintbrush,
};

const STATUS_DOT_COLOR: Record<Machine['status'], string> = {
  operational: '#10b981',
  idle: '#94a3b8',
  maintenance: '#f59e0b',
  error: '#f43f5e',
};

const STATUS_LABEL: Record<Machine['status'], TranslationKeys> = {
  operational: 'machinery_status_operational',
  idle: 'machinery_status_idle',
  maintenance: 'machinery_status_maintenance',
  error: 'machinery_status_error',
};

const STATUS_PILL: Record<Machine['status'], string> = {
  operational: 'bg-emerald-100 dark:bg-emerald-500/15',
  idle: 'bg-muted',
  maintenance: 'bg-amber-100 dark:bg-amber-500/15',
  error: 'bg-rose-100 dark:bg-rose-500/15',
};

const STATUS_PILL_TEXT: Record<Machine['status'], string> = {
  operational: 'text-emerald-700 dark:text-emerald-300',
  idle: 'text-muted-foreground',
  maintenance: 'text-amber-700 dark:text-amber-300',
  error: 'text-rose-700 dark:text-rose-300',
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
};

// Pulsing halo wrapper around the error status dot.
function StatusDot({ color, pulse }: { color: string; pulse: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withTiming(1.6, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    }
  }, [pulse, scale]);
  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      {pulse && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: color,
              opacity: 0.4,
            },
            haloStyle,
          ]}
        />
      )}
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function MachineryBlueprintCard({ machine }: { machine: Machine }) {
  const { t } = useI18n();
  const Icon = TYPE_ICON[machine.type] || Settings;
  const isError = machine.status === 'error';

  return (
    <View
      className={cn(
        'rounded-2xl border bg-card p-4',
        isError ? 'border-rose-300 dark:border-rose-500/40' : 'border-border'
      )}
    >
      {/* Header: type + status */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Icon size={13} color="#78716c" />
          <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {machine.type}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <StatusDot color={STATUS_DOT_COLOR[machine.status]} pulse={isError} />
          <View className={cn('rounded-full px-2 py-0.5', STATUS_PILL[machine.status])}>
            <Text className={cn('text-[10px] font-semibold uppercase tracking-wider', STATUS_PILL_TEXT[machine.status])}>
              {t(STATUS_LABEL[machine.status])}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View className="mt-3">
        <Text className="text-base font-semibold text-foreground">{machine.name}</Text>
        <Text className="mt-0.5 font-mono text-xs text-muted-foreground">SN · {machine.serial_number}</Text>
        {machine.location && (
          <Text className="mt-0.5 text-xs text-muted-foreground">{machine.location}</Text>
        )}
      </View>

      {/* Footer: last service */}
      <View className="mt-4 flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t('machinery_last_service')}
        </Text>
        <Text className="text-xs tabular-nums text-foreground/80">
          {formatDate(machine.last_service_at)}
        </Text>
      </View>

      {/* Error ribbon */}
      {isError && machine.error_message && (
        <View className="mt-3 flex-row items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 dark:border-rose-500/30 dark:bg-rose-500/5">
          <AlertTriangle size={14} color="#e11d48" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-xs leading-5 text-rose-700 dark:text-rose-300">
            {machine.error_message}
          </Text>
        </View>
      )}
    </View>
  );
}
