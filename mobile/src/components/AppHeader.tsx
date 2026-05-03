import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Settings, LogOut, Sun, Moon, Monitor, Globe, QrCode } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useI18n, type Locale } from '@/lib/i18n';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Sheet, type SheetRef } from '@/components/ui/Sheet';
import { BrandLogo } from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
}

export function AppHeader({ title, showBack }: AppHeaderProps) {
  const { user, role, logout, hasPage } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { mode, setMode, resolved } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accountSheet = useRef<SheetRef>(null);
  // Foreground icon color flipped per theme so icons stay readable on the
  // header (bg-card) and inside the account sheet (bg-card / bg-muted in dark).
  const iconColor = resolved === 'dark' ? '#fafaf9' : '#1c1917';

  const settingsTarget = (() => {
    if (hasPage('admin.settings')) return '/admin/settings';
    if (hasPage('office.settings')) return '/office/settings';
    if (hasPage('factory.settings')) return '/factory/settings';
    if (hasPage('field.settings')) return '/field/settings';
    return null;
  })();

  const notifTarget = hasPage('admin.notifications') ? '/admin/notifications' : null;

  return (
    <>
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-border bg-card"
      >
        <View className="h-14 flex-row items-center gap-2 px-3">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
            >
              <ChevronLeft size={22} color={iconColor} />
            </Pressable>
          ) : (
            <BrandLogo size={28} />
          )}
          <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
            {title}
          </Text>
          {notifTarget && (
            <Pressable
              onPress={() => router.push(notifTarget as any)}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
            >
              <Bell size={20} color={iconColor} />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push('/scanner' as any)}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <QrCode size={20} color={iconColor} />
          </Pressable>
          <Pressable onPress={() => accountSheet.current?.open()} className="ml-1">
            <Avatar name={user?.name} size={32} />
          </Pressable>
        </View>
      </View>

      <Sheet ref={accountSheet} snapPoints={['60%', '85%']}>
        <View className="flex-row items-center gap-3 pb-4">
          <Avatar name={user?.name} size={48} />
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{user?.name}</Text>
            <Text className="text-sm text-muted-foreground">{role?.role_name ?? user?.role}</Text>
          </View>
        </View>

        <View className="border-t border-border pt-4">
          <Text className="pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('theme')}
          </Text>
          <View className="flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((m) => {
              const Icon = m === 'light' ? Sun : m === 'dark' ? Moon : Monitor;
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m as ThemeMode)}
                  className={cn(
                    'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2',
                    active ? 'border-brand bg-brand' : 'border-border bg-card'
                  )}
                >
                  <Icon size={14} color={active ? 'white' : iconColor} />
                  <Text className={cn('text-xs', active ? 'text-background' : 'text-foreground')}>
                    {t(`theme_mode_${m}` as const)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4 border-t border-border pt-4">
          <Text className="pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('language')}
          </Text>
          <View className="flex-row gap-2">
            {(['en', 'sq'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLocale(l as Locale)}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2',
                  locale === l ? 'border-brand bg-brand' : 'border-border bg-card'
                )}
              >
                <Globe size={14} color={locale === l ? 'white' : iconColor} />
                <Text className={cn('text-xs', locale === l ? 'text-background' : 'text-foreground')}>
                  {l.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-6 gap-2">
          {settingsTarget && (
            <Pressable
              onPress={() => {
                accountSheet.current?.close();
                router.push(settingsTarget as any);
              }}
              className="flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-muted"
            >
              <Settings size={18} color={iconColor} />
              <Text className="text-base text-foreground">{t('settings')}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={async () => {
              accountSheet.current?.close();
              await logout();
              router.replace('/(auth)/login');
            }}
            className="flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-rose-50 dark:active:bg-rose-500/10"
          >
            <LogOut size={18} color="#dc2626" />
            <Text className="text-base text-rose-600">{t('sign_out')}</Text>
          </Pressable>
        </View>
      </Sheet>
    </>
  );
}
