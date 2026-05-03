import { TextInput, View, Text } from 'react-native';
import type { TextInputProps } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName, className, ...props }, ref) => {
    return (
      <View className={cn('gap-1.5', containerClassName)}>
        {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor="#a8a29e"
          {...props}
          className={cn(
            'h-11 rounded-xl border border-border bg-card px-3 text-base text-foreground',
            error && 'border-rose-500',
            className
          )}
        />
        {error && <Text className="text-xs text-rose-600">{error}</Text>}
      </View>
    );
  }
);
Input.displayName = 'Input';
