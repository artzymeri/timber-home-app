import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

type ToastTone = 'default' | 'success' | 'error';
interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<ToastEntry | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const idRef = useRef(0);

  const show = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      idRef.current += 1;
      const next = { id: idRef.current, message, tone };
      setEntry(next);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          setEntry((cur) => (cur?.id === next.id ? null : cur));
        });
      }, 2400);
    },
    [opacity]
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {entry && (
        <Animated.View
          pointerEvents="none"
          style={{ opacity, top: insets.top + 8 }}
          className="absolute left-4 right-4 z-50 items-center"
        >
          <View
            className={cn(
              'rounded-full px-4 py-2.5 shadow-lg',
              entry.tone === 'success' && 'bg-emerald-600',
              entry.tone === 'error' && 'bg-rose-600',
              entry.tone === 'default' && 'bg-foreground'
            )}
          >
            <Text className="text-sm font-medium text-white">{entry.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
