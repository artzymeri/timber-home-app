import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'info';

const toneRing: Record<Tone, string> = {
  default: 'bg-muted',
  success: 'bg-emerald-100 dark:bg-emerald-500/15',
  warning: 'bg-amber-100 dark:bg-amber-500/15',
  info: 'bg-blue-100 dark:bg-blue-500/15',
};

const toneIcon: Record<Tone, string> = {
  default: '#78716c',
  success: '#059669',
  warning: '#d97706',
  info: '#2563eb',
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, tone = 'default', className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8', className)}>
      <View className={cn('h-12 w-12 items-center justify-center rounded-full', toneRing[tone])}>
        <Icon size={20} color={toneIcon[tone]} />
      </View>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {description && <Text className="text-center text-sm text-muted-foreground">{description}</Text>}
    </View>
  );
}
