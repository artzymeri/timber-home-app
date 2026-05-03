'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { IconPicker } from '@/components/icon-picker';
import { resolveIcon } from '@/lib/icon-resolver';
import {
  STAGE_COLORS,
  STAGE_COLOR_LABEL_KEYS,
  colorClasses,
  flattenAll,
  stageDisplayName,
  type Stage,
  type StageColor,
  type StageNode,
} from '@/lib/stages';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

interface StageFormProps {
  initial?: Stage & { user_count?: number };
  mode: 'create' | 'edit';
  tree: StageNode[];
}

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

export function StageForm({ initial, mode, tree }: StageFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isSystem = !!initial?.is_system;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');
  const [codeTouched, setCodeTouched] = useState(!!initial?.code);
  const [description, setDescription] = useState(initial?.description || '');
  const [parentId, setParentId] = useState<string>(initial?.parent_id ? String(initial.parent_id) : 'none');
  const [icon, setIcon] = useState(initial?.icon || 'Circle');
  const [color, setColor] = useState<StageColor>(initial?.color || 'stone');
  const [isInitial, setIsInitial] = useState(!!initial?.is_initial);
  const [isTerminal, setIsTerminal] = useState(!!initial?.is_terminal);

  useEffect(() => {
    if (!codeTouched) setCode(slugify(name));
  }, [name, codeTouched]);

  const Selected = resolveIcon(icon);
  const c = colorClasses(color);

  // For the parent select: exclude self and descendants when editing.
  const allFlat = flattenAll(tree);
  const excluded = new Set<number>();
  if (initial?.id) {
    excluded.add(initial.id);
    const collectDescendants = (nodes: StageNode[]) => {
      nodes.forEach((n) => {
        if (n.id === initial.id) {
          const visit = (m: StageNode) => {
            excluded.add(m.id);
            m.children.forEach(visit);
          };
          n.children.forEach(visit);
        } else {
          collectDescendants(n.children);
        }
      });
    };
    collectDescendants(tree);
  }
  const parentOptions = allFlat.filter((s) => !excluded.has(s.id) && !s.is_terminal);

  const stepKeys: TranslationKeys[] = ['stage_name', 'stage_icon', 'stage_parent', 'stage_color', 'stage_review'];
  const stepDescKeys: TranslationKeys[] = [
    'stage_description',
    'stage_icon',
    'stage_parent_help',
    'stage_color',
    'stage_review',
  ];
  const steps = stepKeys.map((k, i) => ({ label: t(k), description: t(stepDescKeys[i]) }));

  const stepProgressLabel = t('wizard_step')
    .replace('{current}', String(step + 1))
    .replace('{total}', String(steps.length));

  const canAdvance =
    step === 0 ? name.trim().length > 0 && code.trim().length > 0 :
    true;

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || null,
        parent_id: parentId === 'none' ? null : Number(parentId),
        icon,
        color,
        is_initial: isInitial,
        is_terminal: isTerminal,
      };
      if (mode === 'create') {
        await api('/api/stages', { method: 'POST', body: JSON.stringify(payload) });
      } else if (initial?.id) {
        await api(`/api/stages/${initial.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      toast.success(mode === 'create' ? t('stages_create') : t('wizard_save'));
      router.push('/admin/stages');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isSystem && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t('stages_system_locked')}
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
                <h3 className="text-base font-semibold">{t('stage_name')}</h3>
                <p className="text-sm text-muted-foreground">{t('stage_code_help')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stage-name">{t('stage_name')}</Label>
                  <Input
                    id="stage-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('stage_name_placeholder')}
                    disabled={isSystem}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-code">{t('stage_code')}</Label>
                  <Input
                    id="stage-code"
                    value={code}
                    onChange={(e) => {
                      setCode(slugify(e.target.value));
                      setCodeTouched(true);
                    }}
                    disabled={isSystem}
                    maxLength={64}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="stage-desc">{t('stage_description')}</Label>
                  <Textarea
                    id="stage-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={255}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('stage_icon')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_icon_pick')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>{t('stage_icon')}</Label>
                  <IconPicker value={icon} onChange={setIcon} />
                </div>
                <div className={cn('rounded-md border p-4', c.bg, c.border)}>
                  <p className="text-xs text-muted-foreground mb-3">{t('stage_review')}</p>
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-md', c.chip)}>
                      <Selected size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{name || t('stage_name')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{code || icon}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('stage_parent')}</h3>
                <p className="text-sm text-muted-foreground">{t('stage_parent_help')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('stage_parent')}</Label>
                  <Select
                    value={parentId}
                    onValueChange={(v) => setParentId(v as string)}
                    disabled={isSystem}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('stages_no_parent')}</SelectItem>
                      {parentOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {stageDisplayName(s, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>{t('attendance_type')}</Label>
                  <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40 transition-colors">
                    <Checkbox
                      checked={isInitial}
                      onCheckedChange={(v) => setIsInitial(v === true)}
                      disabled={isSystem || isTerminal}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t('stage_is_initial')}</p>
                      <p className="text-xs text-muted-foreground">{t('stage_is_initial_help')}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40 transition-colors">
                    <Checkbox
                      checked={isTerminal}
                      onCheckedChange={(v) => setIsTerminal(v === true)}
                      disabled={isSystem || isInitial}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t('stage_is_terminal')}</p>
                      <p className="text-xs text-muted-foreground">{t('stage_is_terminal_help')}</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('stage_color')}</h3>
                <p className="text-sm text-muted-foreground">{t('stage_color')}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {STAGE_COLORS.map((value) => {
                  const cc = colorClasses(value);
                  const active = color === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setColor(value)}
                      className={cn(
                        'flex items-center gap-3 rounded-md border px-3 py-3 text-sm transition-colors',
                        cc.bg,
                        cc.text,
                        cc.border,
                        active && 'ring-2',
                        active && cc.ring
                      )}
                    >
                      <span className={cn('h-4 w-4 rounded-full', cc.chip)} />
                      <span className="font-medium">{t(STAGE_COLOR_LABEL_KEYS[value])}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-1 mb-5">
                <h3 className="text-base font-semibold">{t('stage_review')}</h3>
                <p className="text-sm text-muted-foreground">{t('role_review_caption')}</p>
              </div>
              <div className="space-y-3">
                <div className={cn('flex items-center gap-3 rounded-md border p-4', c.bg, c.border)}>
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-md', c.chip)}>
                    <Selected size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{code}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('stage_parent')}</p>
                    <p className="text-sm mt-0.5">
                      {parentId === 'none'
                        ? t('stages_no_parent')
                        : parentOptions.find((p) => p.id === Number(parentId))?.name || '—'}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('stage_color')}</p>
                    <p className="text-sm mt-0.5">{t(STAGE_COLOR_LABEL_KEYS[color])}</p>
                  </div>
                </div>
                {(isInitial || isTerminal) && (
                  <div className="flex flex-wrap gap-2">
                    {isInitial && (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {t('stage_is_initial')}
                      </span>
                    )}
                    {isTerminal && (
                      <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-700 dark:border-stone-500/30 dark:bg-stone-500/10 dark:text-stone-300">
                        {t('stage_is_terminal')}
                      </span>
                    )}
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
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? '…' : mode === 'create' ? t('wizard_create') : t('wizard_save')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
