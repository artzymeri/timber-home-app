import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'muted' | 'success' | 'warning' | 'info' | 'destructive';

const toneClasses: Record<Tone, string> = {
  default: 'bg-foreground',
  muted: 'bg-muted',
  success: 'bg-emerald-100 dark:bg-emerald-500/15',
  warning: 'bg-amber-100 dark:bg-amber-500/15',
  info: 'bg-blue-100 dark:bg-blue-500/15',
  destructive: 'bg-rose-100 dark:bg-rose-500/15',
};

const toneTextClasses: Record<Tone, string> = {
  default: 'text-background',
  muted: 'text-foreground',
  success: 'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  info: 'text-blue-700 dark:text-blue-300',
  destructive: 'text-rose-700 dark:text-rose-300',
};

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', toneClasses[tone], className)}>
      <Text className={cn('text-xs font-medium', toneTextClasses[tone])}>{children}</Text>
    </View>
  );
}
