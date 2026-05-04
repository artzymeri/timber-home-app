import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Workflow } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { api } from '@/lib/api';
import { stageDisplayName, type StageNode } from '@/lib/stages';
import { resolveIcon } from '@/lib/icon-resolver';

function StageRow({
  node,
  depth,
  t,
  iconColor,
}: {
  node: StageNode;
  depth: number;
  t: any;
  iconColor: string;
}) {
  const Icon = resolveIcon(node.icon);
  return (
    <View>
      <View
        style={{ paddingLeft: 8 + depth * 16 }}
        className="flex-row items-center gap-2 border-b border-border py-3 pr-3"
      >
        <View className="h-7 w-7 items-center justify-center rounded-md bg-muted">
          <Icon size={14} color={iconColor} />
        </View>
        <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
          {stageDisplayName(node, t)}
        </Text>
        {node.is_initial && <Badge tone="info">{t('stages_initial')}</Badge>}
        {node.is_terminal && <Badge tone="success">{t('stages_terminal')}</Badge>}
        {node.is_system && <Badge tone="muted">{t('system')}</Badge>}
      </View>
      {node.children?.map((c) => (
        <StageRow key={c.id} node={c} depth={depth + 1} t={t} iconColor={iconColor} />
      ))}
    </View>
  );
}

export default function AdminStagesPage() {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const iconColor = resolved === 'dark' ? '#fafaf9' : '#1c1917';
  const q = useQuery({
    queryKey: ['stages'],
    queryFn: () => api<{ stages: StageNode[] }>('/api/stages'),
  });
  const tree = q.data?.stages ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('stages_title')} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tree.length === 0 ? (
          <EmptyState title={t('no_results')} icon={Workflow} />
        ) : (
          <View className="rounded-2xl border border-border bg-card">
            {tree.map((n) => (
              <StageRow key={n.id} node={n} depth={0} t={t} iconColor={iconColor} />
            ))}
          </View>
        )}
        <Text className="mt-3 px-2 text-xs text-muted-foreground">
          {t('mobile_stages_readonly_note')}
        </Text>
      </ScrollView>
    </View>
  );
}
