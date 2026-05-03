import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vars } from 'nativewind';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { paletteFor } from '@/lib/theme-vars';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function NavigationGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isPublicRoute =
      inAuthGroup || segments[0] === undefined; // index handles its own redirect

    if (!user && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  return null;
}

function ThemedStatusBar() {
  const { resolved } = useTheme();
  return <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Injects the active theme's CSS variables on a root view so `bg-background`,
 * `text-foreground`, etc. resolve correctly across every screen. The same
 * pattern is used inside <Sheet> for the gorhom portal which escapes this
 * tree. Without this, theme switches only re-paint inside the sheet.
 */
function ThemedRoot({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();
  return <View style={[{ flex: 1 }, vars(paletteFor(resolved))]}>{children}</View>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <BottomSheetModalProvider>
                  <ToastProvider>
                    <ThemedStatusBar />
                    <NavigationGate />
                    <ThemedRoot>
                      <Stack screenOptions={{ headerShown: false }} />
                    </ThemedRoot>
                  </ToastProvider>
                </BottomSheetModalProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
