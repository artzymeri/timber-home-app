import { ScrollView, Text, View } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { useI18n } from '@/lib/i18n';

export default function NewRolePage() {
  const { t } = useI18n();
  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('roles_create')} showBack />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="rounded-2xl border border-dashed border-border p-6">
          <Text className="text-base font-semibold text-foreground">{t('roles_create')}</Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            {t('mobile_role_wizard_desktop_only')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
