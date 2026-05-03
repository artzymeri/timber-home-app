'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, applySession } = useAuth();
  const mustChange = !!user?.must_change_password;

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error(t('password_too_short'));
      return;
    }
    if (newPw !== confirm) {
      toast.error(t('password_mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const session = await api<any>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: mustChange ? undefined : currentPw,
          new_password: newPw,
        }),
      });
      applySession(session);
      toast.success(t('saved'));
      router.replace(session.role?.default_route || '/admin/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6">
        <div>
          <h1 className="text-lg font-semibold">{t('change_password_title')}</h1>
          {mustChange && (
            <p className="text-xs text-muted-foreground mt-1">{t('change_password_subtitle')}</p>
          )}
        </div>
        {!mustChange && (
          <div className="space-y-2">
            <Label htmlFor="cur-pw">{t('current_password')}</Label>
            <Input
              id="cur-pw"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="new-pw">{t('new_password')}</Label>
          <Input
            id="new-pw"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
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
