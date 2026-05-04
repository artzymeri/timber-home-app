import { ScrollView, Text, View, Pressable } from 'react-native';
import { Globe, Sun, Moon, Monitor, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/lib/auth-context';
import { useI18n, type Locale } from '@/lib/i18n';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { mode, setMode } = useTheme();
  const { user, role, capabilities, logout } = useAuth();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('settings_title')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-sm font-semibold text-foreground">{t('language_setting')}</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">{t('language_description')}</Text>
          <View className="mt-3 flex-row gap-2">
            {(['en', 'sq'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLocale(l as Locale)}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 py-3',
                  locale === l ? 'border-brand bg-brand' : 'border-border'
                )}
              >
                <Globe size={14} color={locale === l ? 'white' : '#1c1917'} />
                <Text className={cn('text-sm font-medium', locale === l ? 'text-white' : 'text-foreground')}>
                  {l.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-sm font-semibold text-foreground">{t('theme_label')}</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">{t('theme_description')}</Text>
          <View className="mt-3 flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((m) => {
              const Icon = m === 'light' ? Sun : m === 'dark' ? Moon : Monitor;
              const labelKey =
                m === 'light' ? 'theme_mode_light' : m === 'dark' ? 'theme_mode_dark' : 'theme_mode_system';
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m as ThemeMode)}
                  className={cn(
                    'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 py-3',
                    mode === m ? 'border-brand bg-brand' : 'border-border'
                  )}
                >
                  <Icon size={14} color={mode === m ? 'white' : '#1c1917'} />
                  <Text className={cn('text-sm', mode === m ? 'text-white' : 'text-foreground')}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text className="text-sm font-semibold text-foreground">{t('settings_about')}</Text>
          <View className="mt-3 gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">{t('settings_about_role')}</Text>
              <Badge tone="muted">{role?.role_name ?? user?.role}</Badge>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">{t('settings_about_email')}</Text>
              <Text className="text-sm text-foreground">{user?.email}</Text>
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">{t('settings_about_capabilities')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {capabilities.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">—</Text>
                ) : (
                  capabilities.map((c) => (
                    <Badge key={c} tone="muted" className="rounded-md">
                      <Text className="font-mono">{c}</Text>
                    </Badge>
                  ))
                )}
              </View>
            </View>
          </View>
        </Card>

        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10"
        >
          <LogOut size={16} color="#dc2626" />
          <Text className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('sign_out')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
