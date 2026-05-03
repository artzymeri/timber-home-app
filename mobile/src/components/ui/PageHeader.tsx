import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <View className={cn('flex-row items-end justify-between gap-3 pb-1', className)}>
      <View className="flex-1">
        {typeof title === 'string' ? (
          <Text className="text-2xl font-bold tracking-tight text-foreground">{title}</Text>
        ) : (
          title
        )}
        {description && <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>}
      </View>
      {actions}
    </View>
  );
}
