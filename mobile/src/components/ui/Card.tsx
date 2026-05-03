import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-card p-4',
        className
      )}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('mb-3', className)}>{children}</View>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('text-base font-semibold text-foreground', className)}>{children}</Text>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>;
}
