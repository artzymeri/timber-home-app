import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ChangePasswordScreen() {
  const { user, refresh } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (next.length < 8) {
      toast.error(t('change_password_too_short'));
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: user?.must_change_password ? undefined : current,
          new_password: next,
        }),
      });
      await refresh();
      toast.success(t('change_password_done'));
      router.replace('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}
      className="bg-background"
    >
      <View className="px-6">
        <Text className="text-2xl font-bold tracking-tight text-foreground">{t('change_password_title')}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{t('change_password_subtitle')}</Text>

        <View className="mt-6 gap-4">
          {!user?.must_change_password && (
            <Input
              label={t('change_password_current')}
              secureTextEntry
              value={current}
              onChangeText={setCurrent}
            />
          )}
          <Input label={t('change_password_new')} secureTextEntry value={next} onChangeText={setNext} />
          <Button onPress={onSubmit} loading={submitting} fullWidth size="lg">
            {t('save')}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
