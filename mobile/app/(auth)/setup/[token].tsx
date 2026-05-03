import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, setToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SetupScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { applySession } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [valid, setValid] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ valid: boolean; name?: string }>(`/api/auth/setup/${token}`)
      .then((d) => {
        setValid(d.valid);
        if (d.name) setName(d.name);
      })
      .catch(() => setValid(false));
  }, [token]);

  const claim = async () => {
    if (pwd.length < 8) {
      toast.error(t('setup_password_min'));
      return;
    }
    setSubmitting(true);
    try {
      const session = await api<any>(`/api/auth/setup/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password: pwd }),
      });
      if (session.token) await setToken(session.token);
      applySession(session);
      router.replace('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (valid === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!valid) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-xl font-semibold text-foreground">{t('setup_invalid_title')}</Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">{t('setup_invalid_body')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}
      className="bg-background"
    >
      <View className="px-6">
        <Text className="text-2xl font-bold tracking-tight text-foreground">{t('setup_title')}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {name ? `${t('setup_subtitle')} (${name})` : t('setup_subtitle')}
        </Text>

        <View className="mt-6 gap-4">
          <Input label={t('setup_password_label')} secureTextEntry value={pwd} onChangeText={setPwd} />
          <Button onPress={claim} loading={submitting} fullWidth size="lg">
            {t('setup_finish')}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
