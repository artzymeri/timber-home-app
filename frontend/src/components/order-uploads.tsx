'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { TranslationKeys } from '@/lib/i18n/en';
import { API_BASE } from '@/lib/api';
import { cn } from '@/lib/utils';

export type UploadCategory = 'designer' | 'sales';

interface OrderFile {
  id: number;
  order_id: number;
  category: UploadCategory | string;
  original_name: string;
  stored_path: string;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
}

interface OrderUploadsProps {
  orderId: number | string;
  category: UploadCategory;
  /** Whether the current user has the capability to upload + delete. */
  canEdit: boolean;
  className?: string;
}

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const TITLE_KEY: Record<UploadCategory, TranslationKeys> = {
  designer: 'uploads_designer_title',
  sales: 'uploads_sales_title',
};
const SUBTITLE_KEY: Record<UploadCategory, TranslationKeys> = {
  designer: 'uploads_designer_subtitle',
  sales: 'uploads_sales_subtitle',
};

export function OrderUploads({ orderId, category, canEdit, className }: OrderUploadsProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<OrderFile[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/files`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { files: OrderFile[] };
      setFiles(data.files.filter((f) => f.category === category));
    } catch {
      setFiles([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, category]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/files?category=${category}`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || t('uploads_failed'));
      }
      toast.success(t('uploads_uploaded'));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('uploads_failed'));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/files/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(t('uploads_delete'));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const onPick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!canEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t(TITLE_KEY[category])}</CardTitle>
        <p className="text-xs text-muted-foreground">{t(SUBTITLE_KEY[category])}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={onPick}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-3 py-6 text-sm transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-foreground/20 hover:bg-accent/40',
              uploading && 'pointer-events-none opacity-60'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={onChange}
              accept=".pdf,.skp,image/*,.jpg,.jpeg,.png,.svg,.webp"
            />
            <Upload size={16} className="text-muted-foreground" />
            <p className="font-medium">{uploading ? t('uploads_uploading') : t('uploads_drop_hint')}</p>
            <p className="text-[11px] text-muted-foreground">{t('uploads_drop_types')}</p>
          </div>
        )}

        {files === null ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : files.length === 0 ? (
          <p className="rounded-md border border-dashed bg-card/50 px-3 py-4 text-center text-xs text-muted-foreground">
            {t('uploads_no_files')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2"
              >
                <FileText size={14} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.original_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(f.size_bytes)} ·{' '}
                    {f.uploaded_by_name
                      ? t('uploads_uploaded_by').replace('{name}', f.uploaded_by_name)
                      : t('uploads_uploaded')}
                    {' · '}
                    {new Date(f.created_at).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`${API_BASE}/api/orders/${orderId}/files/${f.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t('uploads_download')}
                >
                  <Download size={13} />
                </a>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(f.id)}
                    title={t('uploads_delete')}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
