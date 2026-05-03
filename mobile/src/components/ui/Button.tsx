import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand active:opacity-90',
  outline: 'bg-transparent border border-border active:bg-muted',
  ghost: 'bg-transparent active:bg-muted',
  destructive: 'bg-rose-600 active:opacity-90',
};

const variantTextClasses: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-14 px-5',
};

const sizeTextClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
};

export function Button({
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center rounded-xl',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'destructive' ? 'white' : '#1c1917'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {typeof children === 'string' ? (
            <Text className={cn(sizeTextClasses[size], variantTextClasses[variant])}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}
