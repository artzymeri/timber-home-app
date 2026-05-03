'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Copy, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import { RoleCard, RoleCardData } from '@/components/role-card';
import { PageContainer } from '@/components/page-container';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

type Method = 'temp_password' | 'invite_link';

interface InviteResponse {
  user: { id: number; name: string; email: string };
  method: Method;
  temp_password?: string;
  setup_url?: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<RoleCardData[]>([]);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<Method>('temp_password');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);

  useEffect(() => {
    api<{ roles: RoleCardData[] }>('/api/roles')
      .then(({ roles }) => setRoles(roles))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  const stepKeys: TranslationKeys[] = ['users_pick_role', 'users_account_details', 'users_method', 'users_review'];
  const stepDescKeys: TranslationKeys[] = [
    'users_pick_role_help',
    'users_account_details',
    'users_method',
    'users_review',
  ];
  const steps = stepKeys.map((k, i) => ({ label: t(k), description: t(stepDescKeys[i]) }));

  const canAdvance =
    step === 0 ? roleId !== null :
    step === 1 ? name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim()) :
    true;

  const stepProgressLabel = t('wizard_step')
    .replace('{current}', String(step + 1))
    .replace('{total}', String(steps.length));

  const submit = async () => {
    if (roleId === null) return;
    setSubmitting(true);
    try {
      const res = await api<InviteResponse>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role_id: roleId,
          method,
        }),
      });
      setResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('users_copied'));
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const selectedRole = roles.find((r) => r.id === roleId);

  if (result) {
    return (
      <PageContainer size="default">
        <div className="space-y-6 max-w-xl">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              aria-label="Back"
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            >
              <ChevronLeft size={16} />
            </Link>
            <h2 className="text-xl font-bold tracking-tight">{t('users_credentials_title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.method === 'temp_password'
              ? t('users_credentials_temp_intro')
              : t('users_credentials_invite_intro')}
          </p>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('name')}</p>
                <p className="text-sm font-medium">{result.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('email')}</p>
                <p className="text-sm font-medium truncate">{result.user.email}</p>
              </div>
            </div>
            {result.temp_password && (
              <div>
                <p className="text-xs text-muted-foreground">{t('users_temp_password_label')}</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-2 py-1.5 text-sm font-mono break-all">
                    {result.temp_password}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copy(result.temp_password!)}>
                    <Copy size={12} />
                    <span>{t('users_copy')}</span>
                  </Button>
                </div>
              </div>
            )}
            {result.setup_url && (
              <div>
                <p className="text-xs text-muted-foreground">{t('users_setup_url_label')}</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-2 py-1.5 text-xs font-mono break-all">
                    {result.setup_url}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copy(result.setup_url!)}>
                    <Copy size={12} />
                    <span>{t('users_copy')}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/users/new')}>
              {t('users_invite')}
            </Button>
            <Button onClick={() => router.push('/admin/users')}>{t('users_done')}</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            aria-label="Back"
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <ChevronLeft size={16} />
          </Link>
          <h2 className="text-xl font-bold tracking-tight">{t('users_invite')}</h2>
        </div>

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
                  <h3 className="text-base font-semibold">{t('users_pick_role')}</h3>
                  <p className="text-sm text-muted-foreground">{t('users_pick_role_help')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roles.map((r) => (
                    <RoleCard
                      key={r.id}
                      role={r}
                      selected={r.id === roleId}
                      onClick={() => setRoleId(r.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-1 mb-5">
                  <h3 className="text-base font-semibold">{t('users_account_details')}</h3>
                  <p className="text-sm text-muted-foreground">{t('users_subtitle')}</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">{t('users_full_name')}</Label>
                    <Input
                      id="user-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">{t('users_email')}</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
                {selectedRole && (
                  <div className="mt-5 rounded-md border bg-muted/30 p-3 text-xs">
                    <span className="text-muted-foreground">{t('users_role')}: </span>
                    <span className="font-medium">{selectedRole.role_name}</span>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1 mb-5">
                  <h3 className="text-base font-semibold">{t('users_method')}</h3>
                  <p className="text-sm text-muted-foreground">{t('users_method')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { value: 'temp_password' as const, icon: KeyRound, title: t('users_method_temp'), desc: t('users_method_temp_desc') },
                    { value: 'invite_link' as const, icon: Mail, title: t('users_method_invite'), desc: t('users_method_invite_desc') },
                  ]).map(({ value, icon: Icon, title, desc }) => {
                    const active = method === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMethod(value)}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                          active ? 'border-primary ring-2 ring-primary/20' : 'hover:bg-accent/40'
                        )}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon size={18} />
                        </div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-1 mb-5">
                  <h3 className="text-base font-semibold">{t('users_review')}</h3>
                  <p className="text-sm text-muted-foreground">{t('role_review_caption')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('users_full_name')}</p>
                    <p className="text-sm font-medium mt-0.5">{name}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('users_email')}</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{email}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('users_role')}</p>
                    <p className="text-sm font-medium mt-0.5">{selectedRole?.role_name ?? '—'}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{t('users_method')}</p>
                    <p className="text-sm font-medium mt-0.5">
                      {method === 'temp_password' ? t('users_method_temp') : t('users_method_invite')}
                    </p>
                  </div>
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
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance}>
                {t('wizard_next')}
              </Button>
            )}
            {step === steps.length - 1 && (
              <Button type="button" onClick={submit} disabled={submitting}>
                {submitting ? '…' : t('wizard_create')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
