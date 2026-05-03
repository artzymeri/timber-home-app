'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Download,
  Headphones,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { EmptyState } from '@/components/empty-state';
import { useI18n } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/en';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: { id: number; role_name: string; icon: string };
  must_change_password: boolean;
  has_pending_invite: boolean;
  invite_expires_at: string | null;
  invited_at?: string | null;
}

interface RoleOption {
  id: number;
  role_name: string;
  default_route?: string;
}

type DeptKey = 'admin' | 'office' | 'factory' | 'field';

const DEPT_ORDER: DeptKey[] = ['office', 'factory', 'field', 'admin'];
const DEPT_LABEL_KEYS: Record<DeptKey, TranslationKeys> = {
  admin: 'staff_dept_admin',
  office: 'staff_dept_office',
  factory: 'staff_dept_factory',
  field: 'staff_dept_field',
};

const areaFromRoute = (route?: string | null): DeptKey => {
  if (!route) return 'admin';
  if (route.startsWith('/office')) return 'office';
  if (route.startsWith('/factory')) return 'factory';
  if (route.startsWith('/field')) return 'field';
  return 'admin';
};

const AVATAR_PALETTE = [
  'bg-teal-500 text-white dark:bg-teal-400 dark:text-teal-950',
  'bg-violet-500 text-white dark:bg-violet-400 dark:text-violet-950',
  'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950',
  'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
  'bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950',
  'bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950',
];
const avatarColorFor = (id: number) => AVATAR_PALETTE[id % AVATAR_PALETTE.length];

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function StaffDirectoryPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  // View / Edit sheets
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role_id: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = () => {
    Promise.all([
      api<{ users: UserRow[] }>('/api/users'),
      api<{ roles: RoleOption[] }>('/api/roles'),
    ])
      .then(([u, r]) => {
        setUsers(u.users);
        setRoles(r.roles);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  };

  useEffect(() => {
    load();
  }, []);

  const roleById = useMemo(() => {
    const m = new Map<number, RoleOption>();
    for (const r of roles) m.set(r.id, r);
    return m;
  }, [roles]);

  const grouped = useMemo(() => {
    const out = {} as Record<DeptKey, UserRow[]>;
    for (const k of DEPT_ORDER) out[k] = [];
    if (!users) return out;
    for (const u of users) {
      const role = roleById.get(u.role_id);
      const dept = areaFromRoute(role?.default_route);
      out[dept].push(u);
    }
    return out;
  }, [users, roleById]);

  const stats = useMemo(() => {
    if (!users) return { total: 0, online: 0, field: 0, hours: 0, newThisMonth: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const newThisMonth = users.filter(
      (u) => u.invited_at && new Date(u.invited_at).getTime() >= monthStart
    ).length;
    const online = users.filter((u) => !u.has_pending_invite && !u.must_change_password).length;
    const field = users.filter((u) => {
      const role = roleById.get(u.role_id);
      return areaFromRoute(role?.default_route) === 'field';
    }).length;
    return { total: users.length, online, field, hours: 312, newThisMonth };
  }, [users, roleById]);

  const exportCsv = () => {
    if (!users || users.length === 0) return;
    const rows = [
      ['Name', 'Email', 'Role', 'Status', 'Invited at'].join(','),
      ...users.map((u) => {
        const status = u.has_pending_invite
          ? 'pending_invite'
          : u.must_change_password
            ? 'must_reset'
            : 'active';
        const cells = [u.name, u.email, u.role?.role_name ?? '', status, u.invited_at ?? ''];
        return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
      }),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setEditForm({ name: user.name, email: user.email, role_id: user.role_id });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await api(`/api/users/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role_id: editForm.role_id,
        }),
      });
      toast.success(t('saved'));
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await api(`/api/users/${confirmDelete.id}`, { method: 'DELETE' });
      toast.success(t('staff_delete'));
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const peopleLabel = (n: number) =>
    n === 0
      ? t('staff_zero_people')
      : n === 1
        ? t('staff_one_person')
        : t('staff_people_count').replace('{n}', String(n));

  const loading = users === null;

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader
          title={`${t('staff_directory_title')} ${t('staff_directory_word')}`}
          description={t('staff_directory_subtitle')}
          actions={
            <>
              <Button variant="outline" onClick={exportCsv} disabled={loading || (users?.length ?? 0) === 0}>
                <Download size={14} />
                <span>{t('staff_export')}</span>
              </Button>
              <Link href="/admin/users/new" className={buttonVariants()}>
                <Plus size={14} />
                <span>{t('staff_invite')}</span>
              </Link>
            </>
          }
        />

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label={t('staff_total_headcount')}
            value={loading ? '—' : stats.total}
            hint={t('staff_hint_new_this_month').replace('{n}', String(stats.newThisMonth))}
            loading={loading}
          />
          <MetricCard
            icon={CheckCircle2}
            label={t('staff_online_now')}
            value={loading ? '—' : stats.online}
            hint={t('staff_hint_factory_clocked')}
            tone="emerald"
            loading={loading}
          />
          <MetricCard
            icon={Headphones}
            label={t('staff_in_the_field')}
            value={loading ? '—' : stats.field}
            hint={t('staff_hint_active_routes')}
            tone="amber"
            loading={loading}
          />
          <MetricCard
            icon={Clock}
            label={t('staff_hours_week')}
            value={loading ? '—' : stats.hours}
            hint={t('staff_hint_hours_target').replace('{n}', '4')}
            tone="amber"
            loading={loading}
          />
        </div>

        {/* Department groups */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (users?.length ?? 0) === 0 ? (
          <EmptyState
            tone="info"
            icon={Users}
            title={t('users_empty')}
            action={
              <Link href="/admin/users/new" className={buttonVariants()}>
                <Plus size={14} />
                <span>{t('staff_invite')}</span>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {DEPT_ORDER.map((dept) => {
              const members = grouped[dept];
              if (!members || members.length === 0) return null;
              return (
                <Card key={dept} className="overflow-hidden">
                  <CardContent className="pt-5">
                    <div className="mb-4 flex items-baseline gap-3">
                      <h3 className="text-base font-semibold">{t(DEPT_LABEL_KEYS[dept])}</h3>
                      <span className="text-xs text-muted-foreground">{peopleLabel(members.length)}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((u) => (
                        <UserCard
                          key={u.id}
                          user={u}
                          onView={() => setViewing(u)}
                          onEdit={() => openEdit(u)}
                          onDelete={() => setConfirmDelete(u)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete confirm */}
        <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('staff_delete')}</DialogTitle>
              <DialogDescription>
                {confirmDelete?.name} ({confirmDelete?.email})
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={busy}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={remove} disabled={busy}>
                {busy ? '…' : t('staff_delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View details sheet */}
        <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader>
              <SheetTitle>{t('staff_member_details')}</SheetTitle>
              <SheetDescription>{viewing?.email}</SheetDescription>
            </SheetHeader>
            {viewing && (
              <div className="flex-1 overflow-y-auto px-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className={cn('text-base font-semibold', avatarColorFor(viewing.id))}>
                      {initialsOf(viewing.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold">{viewing.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {viewing.role?.role_name ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border divide-y">
                  <DetailRow label={t('email')} value={viewing.email} />
                  <DetailRow label={t('users_role')} value={viewing.role?.role_name ?? '—'} />
                  <DetailRow
                    label={t('users_status')}
                    value={
                      viewing.has_pending_invite
                        ? t('users_pending_invite')
                        : viewing.must_change_password
                          ? t('users_must_reset')
                          : t('users_active')
                    }
                  />
                  {viewing.invited_at && (
                    <DetailRow
                      label={t('users_invite')}
                      value={new Date(viewing.invited_at).toLocaleDateString()}
                    />
                  )}
                </div>
              </div>
            )}
            <SheetFooter className="flex-row justify-end border-t">
              <Button variant="outline" onClick={() => setViewing(null)}>
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (viewing) openEdit(viewing);
                  setViewing(null);
                }}
              >
                <Pencil size={14} />
                <span>{t('staff_edit')}</span>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit sheet */}
        <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader>
              <SheetTitle>{t('staff_member_edit')}</SheetTitle>
              <SheetDescription>{editing?.name}</SheetDescription>
            </SheetHeader>
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
                className="flex flex-1 flex-col"
              >
                <div className="flex-1 space-y-4 overflow-y-auto px-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">{t('users_full_name')}</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{t('users_email')}</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('users_role')}</Label>
                    <Select
                      value={String(editForm.role_id)}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, role_id: Number(v) }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.role_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="flex-row justify-end border-t">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={savingEdit}>
                    {savingEdit ? '…' : t('staff_save')}
                  </Button>
                </SheetFooter>
              </form>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface UserCardProps {
  user: UserRow;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function UserCard({ user, onView, onEdit, onDelete }: UserCardProps) {
  const { t } = useI18n();
  const isActive = !user.has_pending_invite && !user.must_change_password;
  return (
    <div className="group flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:border-foreground/15">
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarFallback className={cn('text-sm font-semibold', avatarColorFor(user.id))}>
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onView}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm font-semibold truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.role?.role_name ?? '—'}</p>
        <p className="text-[11px] text-muted-foreground/80 truncate">{user.email}</p>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <p className="text-2xl font-bold leading-none tabular-nums">0</p>
        <p className="text-[9px] font-medium tracking-wider text-muted-foreground">{t('staff_tasks')}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none"
          aria-label="Actions"
        >
          <MoreHorizontal size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onView}>
            <Eye size={13} />
            <span>{t('staff_view_details')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={13} />
            <span>{t('staff_edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 size={13} />
            <span>{t('staff_delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
