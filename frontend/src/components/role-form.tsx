'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Stepper } from '@/components/ui/stepper';
import { IconPicker } from '@/components/icon-picker';
import { resolveIcon } from '@/lib/icon-resolver';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  AREA_LABEL_KEYS,
  PAGE_AREAS,
  PAGE_BY_KEY,
  PAGES,
  type PageArea,
  type PageDef,
} from '@/lib/pages';
import { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

export interface RoleFormInitial {
  id?: number;
  role_name: string;
  description?: string | null;
  icon: string;
  default_route: string;
  permissions: string[];
  allowed_pages?: string[];
  is_system?: boolean;
}

interface RoleFormProps {
  initial?: RoleFormInitial;
  mode: 'create' | 'edit';
}

export function RoleForm({ initial, mode }: RoleFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isSystem = !!initial?.is_system;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(initial?.role_name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [icon, setIcon] = useState(initial?.icon || 'UserCircle');
  const [allowedPages, setAllowedPages] = useState<string[]>(initial?.allowed_pages || []);
  // Default page: the one matching the existing default_route (if any).
  const initialDefaultPageKey = useMemo(() => {
    if (!initial?.default_route) return null;
    const match = PAGES.find((p) => p.path === initial.default_route);
    return match?.key ?? null;
  }, [initial?.default_route]);
  const [defaultPageKey, setDefaultPageKey] = useState<string | null>(initialDefaultPageKey);

  const Selected = resolveIcon(icon);

  const stepKeys: TranslationKeys[] = ['role_name', 'role_icon', 'role_pages', 'role_review'];
  const stepDescriptionKeys: TranslationKeys[] = [
    'role_description',
    'role_icon_pick',
    'role_pages_help',
    'role_review_caption',
  ];
  const steps = stepKeys.map((k, i) => ({ label: t(k), description: t(stepDescriptionKeys[i]) }));

  const canAdvance =
    step === 0 ? name.trim().length > 0 :
    step === 2 ? allowedPages.length > 0 && defaultPageKey !== null && allowedPages.includes(defaultPageKey) :
    true;

  const stepProgressLabel = t('wizard_step')
    .replace('{current}', String(step + 1))
    .replace('{total}', String(steps.length));

  const togglePage = (key: string, on: boolean) => {
    setAllowedPages((prev) => {
      if (on) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((k) => k !== key);
    });
    // If we just turned off the starred page, clear the star.
    if (!on && defaultPageKey === key) setDefaultPageKey(null);
  };

  const setDefault = (key: string) => {
    // Setting a default also enables the page.
    setAllowedPages((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setDefaultPageKey(key);
  };

  const submit = async () => {
    if (!defaultPageKey) {
      toast.error(t('role_pages_must_default'));
      return;
    }
    const defaultPage = PAGE_BY_KEY[defaultPageKey];
    if (!defaultPage) {
      toast.error(t('role_pages_must_default'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        role_name: name.trim(),
        description: description.trim() || null,
        icon,
        default_route: defaultPage.path,
        allowed_pages: allowedPages,
        // Capabilities are auto-derived server-side from allowed_pages on POST/PATCH.
        permissions: initial?.permissions ?? [],
      };
      if (mode === 'create') {
        await api('/api/roles', { method: 'POST', body: JSON.stringify(payload) });
      } else if (initial?.id) {
        await api(`/api/roles/${initial.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      toast.success(mode === 'create' ? t('roles_create') : t('wizard_save'));
      router.push('/admin/roles');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  // Group pages by area for the matrix render
  const pagesByArea = useMemo(() => {
    const out = {} as Record<PageArea, PageDef[]>;
    for (const a of PAGE_AREAS) out[a] = [];
    for (const p of PAGES) out[p.area].push(p);
    return out;
  }, []);

  return (
    <div className="space-y-6">
      {isSystem && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t('roles_system_locked')}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="hidden lg:block rounded-lg border bg-card p-3">
            <Stepper steps={steps} current={step} orientation="vertical" onStepClick={(i) => setStep(i)} />
          </div>
          <div className="lg:hidden">
            <Stepper steps={steps} current={step} />
          </div>
        </aside>

        <div className="rounded-lg border bg-card p-6 min-w-0">
          {step === 0 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('role_name')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_description_placeholder')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role-name">{t('role_name')}</Label>
                  <Input
                    id="role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('role_name_placeholder')}
                    disabled={isSystem}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2 sm:row-span-2">
                  <Label htmlFor="role-desc">{t('role_description')}</Label>
                  <Textarea
                    id="role-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('role_description_placeholder')}
                    rows={5}
                    maxLength={255}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('role_icon')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_icon_pick')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>{t('role_icon')}</Label>
                  <IconPicker value={icon} onChange={setIcon} />
                </div>
                <div className="rounded-md border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">{t('roles_create')}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Selected size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{name || t('role_name')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{icon}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('role_pages')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_pages_help')}</p>
              </div>
              <div className="space-y-5">
                {PAGE_AREAS.map((area) => {
                  const list = pagesByArea[area];
                  if (list.length === 0) return null;
                  return (
                    <div key={area} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(AREA_LABEL_KEYS[area])}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {list.map((page) => {
                          const checked = allowedPages.includes(page.key);
                          const isDefault = defaultPageKey === page.key;
                          return (
                            <div
                              key={page.key}
                              className={cn(
                                'flex items-start gap-3 rounded-md border p-3 transition-colors',
                                checked ? 'border-primary/40 bg-primary/5' : 'hover:bg-accent/40'
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => togglePage(page.key, v === true)}
                                aria-label={t(page.labelKey)}
                              />
                              <div className="flex-1 min-w-0">
                                <Label className="text-sm font-medium cursor-pointer">
                                  {t(page.labelKey)}
                                </Label>
                                <p className="mt-0.5 text-[11px] text-muted-foreground font-mono truncate">
                                  {page.path}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDefault(page.key)}
                                title={t('role_pages_set_default')}
                                aria-label={t('role_pages_set_default')}
                                className={cn(
                                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                                  isDefault
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'text-muted-foreground hover:bg-accent hover:text-amber-600 dark:hover:text-amber-300'
                                )}
                              >
                                <Star size={14} className={cn(isDefault && 'fill-amber-500')} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(!defaultPageKey || !allowedPages.includes(defaultPageKey)) && allowedPages.length > 0 && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  {t('role_pages_must_default')}
                </p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('role_review')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_review_caption')}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Selected size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    {description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('role_pages_default')}</p>
                    <p className="mt-0.5 text-sm font-mono">
                      {defaultPageKey ? PAGE_BY_KEY[defaultPageKey]?.path : '—'}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('role_pages')}</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {allowedPages.length}{' '}
                      <span className="text-muted-foreground">/ {PAGES.length}</span>
                    </p>
                  </div>
                </div>
                {allowedPages.length > 0 && (
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">{t('role_pages')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allowedPages.map((key) => {
                        const p = PAGE_BY_KEY[key];
                        if (!p) return null;
                        const isDefault = defaultPageKey === key;
                        return (
                          <span
                            key={key}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
                              isDefault && 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                            )}
                          >
                            {isDefault && <Star size={10} className="fill-amber-500" />}
                            {t(p.labelKey)}
                            <span className="text-muted-foreground">· {p.area}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">{stepProgressLabel}</span>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="outline" type="button" onClick={() => setStep(step - 1)} disabled={submitting}>
              {t('wizard_back')}
            </Button>
          )}
          {step < steps.length - 1 && (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance || submitting}>
              {t('wizard_next')}
            </Button>
          )}
          {step === steps.length - 1 && (
            <Button type="button" onClick={submit} disabled={submitting || allowedPages.length === 0 || !defaultPageKey}>
              {submitting ? '…' : mode === 'create' ? t('wizard_create') : t('wizard_save')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
