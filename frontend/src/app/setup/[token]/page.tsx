'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api, API_BASE } from '@/lib/api';

export default function SetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { applySession } = useAuth();

  const [valid, setValid] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/setup/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          setValid(false);
          return;
        }
        const data = await r.json();
        setValid(!!data.valid);
        if (data.name) setName(data.name);
      })
      .catch(() => setValid(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t('password_too_short'));
      return;
    }
    if (password !== confirm) {
      toast.error(t('password_mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const session = await api<any>(`/api/auth/setup/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      applySession(session);
      router.replace(session.role?.default_route || '/admin/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (valid === null) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{t('loading')}</div>;
  }

  if (valid === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">{t('setup_invalid')}</p>
        <Link href="/login" className={buttonVariants({ variant: 'outline' })}>
          {t('setup_back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6">
        <div>
          <h1 className="text-lg font-semibold">{t('setup_title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t('setup_subtitle')}{name && ` — ${name}`}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pw">{t('new_password')}</Label>
          <Input
            id="new-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pw">{t('confirm_password')}</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? '…' : t('save')}
        </Button>
      </form>
    </div>
  );
}
