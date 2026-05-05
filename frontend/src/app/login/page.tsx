'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Eye, FileText, Share2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BrandLogo } from '@/components/brand-logo';
import { AuroraButton, LoginShader } from '@/components/login-shader';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — dark, with interactive shader wallpaper */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0b1116] text-stone-50 px-12 py-10">
        <LoginShader />

        {/* Top: logo + brand name */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-50/[0.06] ring-1 ring-stone-50/10 p-1">
            <BrandLogo size={22} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">{t('app_name')}</span>
        </div>

        {/* Middle: tagline + description */}
        <div className="relative max-w-md space-y-7">
          <h1 className="text-6xl xl:text-7xl font-bold leading-[1.02] tracking-tight">
            <span className="block">{t('login_tagline_pre').split(' ')[0]}</span>
            <span className="block">{t('login_tagline_pre').split(' ').slice(1).join(' ')}</span>
            <span className="block text-[#7ec8d0]">{t('login_tagline_highlight')}</span>
            <span className="block">{t('login_tagline_post')}</span>
          </h1>
          <p className="max-w-sm text-[15px] leading-relaxed text-stone-300/80">
            {t('login_brand_description')}
          </p>
        </div>

        {/* Bottom: feature list */}
        <div className="relative space-y-0">
          <FeatureRow icon={<FileText size={16} />} label={t('login_feature_pipeline')} />
          <FeatureRow icon={<Eye size={16} />} label={t('login_feature_roles')} />
          <FeatureRow icon={<Share2 size={16} />} label={t('login_feature_tracker')} />

          <div className="mt-6 flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#7ec8d0] opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7ec8d0]" />
              </span>
              {t('login_system_online')}
            </span>
            <span>{t('app_name')} · 2026</span>
          </div>
        </div>
      </aside>

      {/* Form panel — cream */}
      <main className="relative flex flex-col bg-background px-6 py-8 sm:px-12">
        {/* Top-right link */}
        <div className="flex justify-end text-sm">
          <span className="text-muted-foreground mr-2">{t('login_new_here')}</span>
          <Link href="#" className="font-medium text-foreground hover:underline">
            {t('login_request_access')}
          </Link>
        </div>

        {/* Mobile brand */}
        <div className="lg:hidden mt-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border p-1">
            <BrandLogo size={22} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">{t('app_name')}</span>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-7">
            <div className="space-y-2">
              <h2 className="text-5xl font-bold tracking-tight">{t('sign_in')}</h2>
              <p className="text-sm text-muted-foreground">{t('login_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl bg-card px-4 text-[15px] md:text-[15px]"
              />
              <Input
                id="password"
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 rounded-xl bg-card px-4 text-[15px] md:text-[15px]"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    className="data-checked:bg-[#7ec8d0] data-checked:border-[#7ec8d0] data-checked:text-stone-950"
                  />
                  {t('login_remember_me')}
                </label>
                <Link href="#" className="text-sm font-medium text-foreground hover:underline">
                  {t('login_forgot_password')}
                </Link>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}

              <AuroraButton type="submit" disabled={loading}>
                {loading ? t('signing_in') : t('sign_in')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </AuroraButton>
            </form>

            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <span>{t('login_demo_credentials')}</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showDemo ? 'rotate-90' : ''}`}
              />
            </button>
            {showDemo && (
              <p className="-mt-4 px-4 text-xs font-mono text-muted-foreground">
                {t('login_demo_help')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 {t('app_name')}
        </div>
      </main>
    </div>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-stone-50/10 py-4 first:border-t-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-50/[0.04] ring-1 ring-stone-50/10 text-[#7ec8d0]">
        {icon}
      </span>
      <span className="text-sm text-stone-200">{label}</span>
    </div>
  );
}
