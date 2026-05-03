import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { resolveIcon } from '@/lib/icon-resolver';

interface RoleDetail {
  id: number;
  role_name: string;
  icon: string;
  description?: string | null;
  is_system: boolean;
  permissions: string[];
  allowed_pages?: string[];
  default_route: string;
}

export default function RoleDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['role', id],
    queryFn: () => api<{ role: RoleDetail }>(`/api/roles/${id}`),
  });
  const role = q.data?.role;
  const Icon = resolveIcon(role?.icon);

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={role?.role_name ?? '...'} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {role && (
          <>
            <Card>
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Icon size={20} color="#1c1917" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">{role.role_name}</Text>
                  {role.description && (
                    <Text className="text-sm text-muted-foreground">{role.description}</Text>
                  )}
                </View>
                {role.is_system && <Badge tone="muted">{t('system')}</Badge>}
              </View>
            </Card>

            <Card>
              <CardTitle>{t('role_pages')}</CardTitle>
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {role.allowed_pages?.includes('*') ? (
                  <Badge tone="default">All pages</Badge>
                ) : (
                  (role.allowed_pages ?? []).map((p) => (
                    <Badge key={p} tone="muted">{p}</Badge>
                  ))
                )}
              </View>
            </Card>

            <Card>
              <CardTitle>{t('role_caps')}</CardTitle>
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {role.permissions?.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">—</Text>
                ) : (
                  role.permissions.map((c) => (
                    <Badge key={c} tone="muted">{c}</Badge>
                  ))
                )}
              </View>
            </Card>

            <Text className="px-2 text-xs text-muted-foreground">
              {t('mobile_role_wizard_desktop_only')}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
