'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/lib/auth-context';
import { useI18n, Locale } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

const THEME_MODES: Array<{ value: 'light' | 'dark' | 'system'; icon: React.ElementType; labelKey: TranslationKeys }> = [
  { value: 'light', icon: Sun, labelKey: 'theme_mode_light' },
  { value: 'dark', icon: Moon, labelKey: 'theme_mode_dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme_mode_system' },
];

export function SettingsContent() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, role, capabilities } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = (mounted ? theme : 'system') as 'light' | 'dark' | 'system';

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader title={t('settings_title')} description={t('settings_subtitle')} />

        <div className="space-y-6 max-w-3xl">

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('language_setting')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('language_description')}</p>
          </CardHeader>
          <CardContent>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 {t('english')}</SelectItem>
                <SelectItem value="sq">🇦🇱 {t('albanian')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('theme_label')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('theme_description')}</p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {THEME_MODES.map((opt) => {
              const active = currentTheme === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-md border px-3 py-4 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-accent/40'
                  )}
                >
                  <Icon size={18} />
                  <span>{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {user && role && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('settings_about')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('settings_about_role')}</span>
                <Badge variant="secondary">{role.role_name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('settings_about_email')}</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {capabilities && capabilities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">{t('settings_about_capabilities')}</span>
                  <div className="flex flex-wrap gap-1">
                    {capabilities.includes('*') ? (
                      <Badge variant="secondary">*</Badge>
                    ) : (
                      capabilities.map((c) => (
                        <Badge key={c} variant="secondary" className="font-mono text-[10px]">
                          {c}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </PageContainer>
  );
}
