import { useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useI18n, type TranslationKeys } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { PAGES, type PageDef } from '@/lib/pages';
import { iconForPage } from '@/lib/icon-resolver';
import { Sheet, type SheetRef } from '@/components/ui/Sheet';
import { useMachineryErrorCount } from '@/hooks/useMachineryErrorCount';
import { cn } from '@/lib/utils';

// Priority order for which pages get the prime tab spots, per area. The first
// matching pages (in this order) become the bottom tabs; everything else moves
// into the More sheet.
const PRIORITY: string[] = [
  'admin.dashboard',
  'admin.orders',
  'admin.users',
  'admin.notifications',
  'office.dashboard',
  'office.orders',
  'factory.tasks',
  'factory.qa_report',
  'field.schedule',
  'field.fleet_checkout',
];

const MAX_PRIME_TABS = 4; // 4 primary tabs + 1 More tab = 5 total (FB-style)

interface PrimeAndOverflow {
  prime: PageDef[];
  overflow: PageDef[];
}

function partitionPages(allowed: string[]): PrimeAndOverflow {
  const allow = new Set(allowed);
  const isAllowed = (k: string) => allow.has('*') || allow.has(k);
  const allowedPages = PAGES.filter((p) => isAllowed(p.key));

  // settings + notifications are accessible from the header avatar, not the
  // bottom tabs — exclude them from the navigator.
  const reservedKeys = new Set(
    allowedPages
      .filter((p) => p.key.endsWith('.settings') || p.key.endsWith('.notifications'))
      .map((p) => p.key)
  );
  const navPages = allowedPages.filter((p) => !reservedKeys.has(p.key));

  // Dedupe by labelKey so admins (who have wildcard allowed_pages) don't see
  // both admin.dashboard and office.dashboard as separate tabs. The PRIORITY
  // order decides which area wins per concept.
  const byKey = new Map(navPages.map((p) => [p.key, p]));
  const seenLabels = new Set<string>();
  const prime: PageDef[] = [];

  const addIfNew = (p: PageDef) => {
    if (seenLabels.has(p.labelKey)) {
      byKey.delete(p.key);
      return false;
    }
    if (prime.length < MAX_PRIME_TABS) {
      prime.push(p);
      seenLabels.add(p.labelKey);
      byKey.delete(p.key);
      return true;
    }
    return false;
  };

  for (const key of PRIORITY) {
    const p = byKey.get(key);
    if (p) addIfNew(p);
  }
  // Backfill remaining allowed pages if priority list didn't fill MAX_PRIME_TABS.
  for (const p of Array.from(byKey.values())) {
    if (prime.length >= MAX_PRIME_TABS) break;
    addIfNew(p);
  }

  // Overflow: dedupe by labelKey too — keep the first occurrence of each label.
  const overflow: PageDef[] = [];
  for (const p of byKey.values()) {
    if (seenLabels.has(p.labelKey)) continue;
    overflow.push(p);
    seenLabels.add(p.labelKey);
  }

  return { prime, overflow };
}

export function RoleNavigator() {
  const { allowedPages } = useAuth();
  const { t } = useI18n();
  const { resolved } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const moreSheet = useRef<SheetRef>(null);
  // Foreground icon color in the More sheet — flips with theme so the icon
  // doesn't disappear into the matching dark muted background.
  const sheetIconColor = resolved === 'dark' ? '#fafaf9' : '#1c1917';

  const { prime, overflow } = useMemo(() => partitionPages(allowedPages), [allowedPages]);

  // Lookup of badge counts per page key. Easy to extend if other pages want
  // their own badges later. The More tab itself stays badgeless to avoid
  // double-noise — users see the count on the page row inside the sheet.
  const { count: machineryErrors } = useMachineryErrorCount();
  const pageBadges: Record<string, number> = {};
  if (machineryErrors > 0) pageBadges['admin.machinery'] = machineryErrors;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const renderBadge = (count: number) => (
    <View
      style={{ position: 'absolute', top: 2, right: '22%', minWidth: 16, height: 16 }}
      className="items-center justify-center rounded-full bg-rose-500 px-1"
    >
      <Text className="text-[9px] font-bold leading-none text-white">{count > 99 ? '99+' : count}</Text>
    </View>
  );

  const renderTab = (page: PageDef) => {
    const Icon = iconForPage(page.key);
    const active = isActive(page.path);
    const badge = pageBadges[page.key] ?? 0;
    return (
      <Pressable
        key={page.key}
        onPress={() => router.push(page.path as any)}
        className="flex-1 items-center justify-center gap-1 py-2"
      >
        <View>
          <Icon size={22} color={active ? '#0ea5e9' : '#78716c'} />
          {badge > 0 && renderBadge(badge)}
        </View>
        <Text
          className={cn('text-[10px] font-medium', active ? 'text-brand' : 'text-muted-foreground')}
          numberOfLines={1}
        >
          {t(page.labelKey as TranslationKeys)}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <View
        style={{ paddingBottom: insets.bottom }}
        className="border-t border-border bg-card"
      >
        <View className="flex-row items-stretch px-1">
          {prime.map(renderTab)}
          {overflow.length > 0 && (
            <Pressable
              onPress={() => moreSheet.current?.open()}
              className="flex-1 items-center justify-center gap-1 py-2"
            >
              <MoreHorizontal size={22} color="#78716c" />
              <Text className="text-[10px] font-medium text-muted-foreground">{t('more')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Sheet ref={moreSheet} snapPoints={['60%', '90%']} scrollable>
        <Text className="mb-3 text-lg font-semibold text-foreground">{t('more')}</Text>
        {overflow.map((p) => {
          const Icon = iconForPage(p.key);
          const badge = pageBadges[p.key] ?? 0;
          return (
            <Pressable
              key={p.key}
              onPress={() => {
                moreSheet.current?.close();
                router.push(p.path as any);
              }}
              className="flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-muted"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon size={18} color={sheetIconColor} />
              </View>
              <Text className="flex-1 text-base font-medium text-foreground">
                {t(p.labelKey as TranslationKeys)}
              </Text>
              {badge > 0 && (
                <View className="min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </Sheet>
    </>
  );
}
