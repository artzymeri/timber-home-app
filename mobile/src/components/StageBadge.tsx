import { View, Text } from 'react-native';
import { useI18n } from '@/lib/i18n';
import { stageDisplayName, type Stage, type StageColor } from '@/lib/stages';
import { cn } from '@/lib/utils';

const colorStyle: Record<StageColor, { bg: string; text: string }> = {
  stone: { bg: 'bg-stone-100 dark:bg-stone-500/15', text: 'text-stone-700 dark:text-stone-300' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300' },
};

export function StageBadge({ stage, className }: { stage?: Stage | null; className?: string }) {
  const { t } = useI18n();
  if (!stage) return null;
  const c = colorStyle[stage.color] || colorStyle.stone;
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', c.bg, className)}>
      <Text className={cn('text-xs font-medium', c.text)}>{stageDisplayName(stage, t)}</Text>
    </View>
  );
}
