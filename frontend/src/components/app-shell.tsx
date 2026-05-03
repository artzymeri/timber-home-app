'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, BarChart3, Package, Truck,
  Users, Clock, Bell, Settings, ClipboardList, CheckSquare,
  Calendar, Car, Briefcase, PanelLeft, ShieldCheck, UserPlus, Workflow,
  LogOut, ChevronUp, Search, Sun, Moon, Monitor,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/en';
import { resolvePageForPath } from '@/lib/pages';
import { cn } from '@/lib/utils';

export type NavSection = 'workspace' | 'account';

export interface NavItem {
  label: TranslationKeys | string;
  href: string;
  translationKey?: boolean;
  /** Page key from frontend/src/lib/pages.ts — controls sidebar visibility per role. */
  pageKey?: string;
  /** @deprecated capability gate. Prefer `pageKey`; kept for nav items without a registered page (e.g. dashboards). */
  requires?: string;
  /** Visual section — sidebar groups items under "WORKSPACE" or "ACCOUNT" */
  section?: NavSection;
  /** Number badge shown next to the item */
  badge?: string | number;
  /** Tone for the badge — `destructive` makes it rose-red for error counts. */
  badgeTone?: 'default' | 'destructive';
  /** Small alert dot for "needs attention" surfaces (e.g. inventory low stock) */
  indicator?: 'warning' | 'info';
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  panelLabel?: string;
}

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  orders: ShoppingCart,
  analytics: BarChart3,
  inventory: Package,
  purchase_orders: ClipboardList,
  fleet: Truck,
  staff: Users,
  roles_title: ShieldCheck,
  users_title: UserPlus,
  stages_title: Workflow,
  attendance: Clock,
  notifications: Bell,
  settings: Settings,
  my_tasks: CheckSquare,
  qa_report: ClipboardList,
  todays_schedule: Calendar,
  vehicle_checkout: Car,
};

const SECTION_LABELS: Record<NavSection, TranslationKeys> = {
  workspace: 'nav_workspace',
  account: 'nav_account',
};

export function AppShell({ children, navItems }: AppShellProps) {
  const { user, role, allowedPages, logout, hasCapability, hasPage } = useAuth();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Route-level access guard. Sidebar filtering only hides links — typing the
  // URL or following a stale bookmark must also be blocked. We compute access
  // synchronously during render so the unauthorized page never paints, and
  // *also* fire the redirect from an effect to actually leave the route.
  // Note: real authorization still lives on the API (capability checks); this
  // is the client-side UX layer.
  const matchedPage = useMemo(() => resolvePageForPath(pathname), [pathname]);
  const accessDenied = !!user && !!matchedPage && !hasPage(matchedPage.key);

  useEffect(() => {
    if (accessDenied) {
      router.replace(role?.default_route || '/login');
    }
  }, [accessDenied, role, router]);

  // First allowed settings page across areas — used by the user-dropdown link
  // so an office worker doesn't get bounced to /admin/settings.
  const settingsHref = useMemo(() => {
    const candidates = ['admin.settings', 'office.settings', 'factory.settings', 'field.settings'] as const;
    for (const key of candidates) {
      if (hasPage(key)) {
        const path = ({
          'admin.settings': '/admin/settings',
          'office.settings': '/office/settings',
          'factory.settings': '/factory/settings',
          'field.settings': '/field/settings',
        } as const)[key];
        return path;
      }
    }
    return role?.default_route || '/admin/settings';
  }, [allowedPages, hasPage, role]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Cmd/Ctrl+K focuses the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const allowedItems = useMemo(
    () =>
      navItems.filter((item) => {
        // Page-based gate takes precedence over the legacy capability gate.
        if (item.pageKey) return hasPage(item.pageKey);
        if (item.requires) return hasCapability(item.requires);
        return true;
      }),
    [navItems, hasCapability, hasPage]
  );

  const groupedItems = useMemo(() => {
    const workspace = allowedItems.filter(
      (item) => (item.section ?? 'workspace') === 'workspace' && item.label !== 'settings'
    );
    const account = allowedItems.filter(
      (item) => item.section === 'account' || item.label === 'settings' || item.label === 'notifications'
    );
    return { workspace, account };
  }, [allowedItems]);

  // Breadcrumb: "Area / Page" derived from the URL.
  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const area = segments[0] || '';
    const areaLabel = area
      ? area.charAt(0).toUpperCase() + area.slice(1)
      : '';
    const currentNavItem = allowedItems.find((item) => isActive(item.href));
    const pageLabel = currentNavItem
      ? currentNavItem.translationKey !== false
        ? t(currentNavItem.label as TranslationKeys)
        : currentNavItem.label
      : '';
    return { area: areaLabel, page: pageLabel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allowedItems, t]);

  const renderNavItem = (item: NavItem) => {
    const Icon = iconMap[item.label] || Briefcase;
    const label = item.translationKey !== false ? t(item.label as TranslationKeys) : item.label;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? String(label) : undefined}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
          collapsed ? 'justify-center w-9 h-9 mx-auto' : 'px-3 py-2',
          active
            ? 'bg-brand text-white'
            : 'text-foreground/70 hover:bg-sidebar-accent hover:text-foreground'
        )}
      >
        <Icon size={16} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate flex-1">{label}</span>
            {item.indicator && (
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold',
                  item.indicator === 'warning' && 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                  item.indicator === 'info' && 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                )}
              >
                !
              </span>
            )}
            {item.badge != null && item.badge !== 0 && item.badge !== '' && (
              <span
                className={cn(
                  'ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums',
                  item.badgeTone === 'destructive'
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : active
                    ? 'bg-background/15 text-background'
                    : 'bg-foreground/10 text-foreground/80'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[64px]' : 'w-[260px]',
          'md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-16 items-center', collapsed ? 'justify-center px-2' : 'px-4')}>
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size={32} className="shrink-0" />
            {!collapsed && (
              <span className="text-base font-semibold tracking-tight truncate">{t('app_name')}</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto py-2 space-y-5', collapsed ? 'px-2' : 'px-3')}>
          {groupedItems.workspace.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(SECTION_LABELS.workspace)}
                </p>
              )}
              {groupedItems.workspace.map(renderNavItem)}
            </div>
          )}

          {groupedItems.account.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(SECTION_LABELS.account)}
                </p>
              )}
              {groupedItems.account.map(renderNavItem)}
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className={cn('border-t border-sidebar-border', collapsed ? 'px-2' : 'px-3', 'py-3')}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'w-full flex items-center gap-3 rounded-md px-2 py-2 transition-colors outline-none hover:bg-sidebar-accent',
                collapsed && 'justify-center px-0'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{role?.role_name ?? user?.role}</p>
                  </div>
                  <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <div className="px-1 py-1">
                <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('language')}
                </p>
                <div className="flex gap-1">
                  {(['light', 'dark', 'system'] as const).map((mode) => {
                    const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
                    const active = mounted && theme === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTheme(mode)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors',
                          active
                            ? 'border-brand bg-brand text-white'
                            : 'border-border hover:bg-accent'
                        )}
                      >
                        <Icon size={11} />
                        <span className="capitalize">{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(settingsHref)}>
                <Settings size={14} className="mr-2" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                <LogOut size={14} className="mr-2" />
                {t('sign_out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-sidebar-border bg-background px-4 md:px-6">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <span className="h-5 w-px bg-border" aria-hidden />

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
            {breadcrumb.area && (
              <>
                <span className="text-muted-foreground hidden sm:inline">{breadcrumb.area}</span>
                <span className="text-muted-foreground hidden sm:inline">/</span>
              </>
            )}
            <span className="font-medium truncate">{breadcrumb.page}</span>
          </nav>

          {/* Search */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search_placeholder')}
                className="h-9 w-72 rounded-md bg-card pl-8 pr-12 text-sm"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none">
                <Bell size={16} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-semibold">{t('notifications')}</p>
                  <button className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                    {t('mark_all_read')}
                  </button>
                </div>
                <DropdownMenuSeparator />
                {(
                  [
                    { titleKey: 'notif_low_stock', msgKey: 'notif_low_stock_msg', type: 'warning', read: false, time: '5m' },
                    { titleKey: 'notif_stage_advanced', msgKey: 'notif_stage_advanced_msg', type: 'info', read: false, time: '15m' },
                    { titleKey: 'notif_qa_report', msgKey: 'notif_qa_report_msg', type: 'error', read: false, time: '1h' },
                    { titleKey: 'notif_quote_approved', msgKey: 'notif_quote_approved_msg', type: 'success', read: true, time: '2h' },
                    { titleKey: 'notif_vehicle_service', msgKey: 'notif_vehicle_service_msg', type: 'warning', read: true, time: '3h' },
                  ] as const
                ).map((n, i) => (
                  <div key={i} className={cn('border-b px-3 py-2.5 last:border-0', !n.read && 'bg-accent/40')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            n.type === 'warning' && 'text-amber-600 dark:text-amber-300',
                            n.type === 'error' && 'text-rose-600 dark:text-rose-300',
                            n.type === 'success' && 'text-emerald-600 dark:text-emerald-300',
                            n.type === 'info' && 'text-blue-600 dark:text-blue-300'
                          )}
                        >
                          {t(n.titleKey)}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t(n.msgKey)}</p>
                      </div>
                      <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {accessDenied ? null : children}
        </main>
      </div>
    </div>
  );
}
