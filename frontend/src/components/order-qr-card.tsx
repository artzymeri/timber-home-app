'use client';

import { Download, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { API_BASE } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Renders the order's QR (encoding `qr_token`) plus a download-as-PNG link.
 * The image is served from `/api/orders/:id/qr.png` and depends on the auth
 * cookie — works only for signed-in users with read access.
 */
export function OrderQrCard({ orderId }: { orderId: number }) {
  const { t } = useI18n();
  const src = `${API_BASE}/api/orders/${orderId}/qr.png`;
  const downloadHref = `${src}?download=1`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <QrCode size={14} />
          {t('order_qr_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {/* Square frame so the image always renders consistently. */}
        <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-xl border border-border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={t('order_qr_alt')}
            className="h-full w-full object-contain"
            crossOrigin="use-credentials"
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">{t('order_qr_help')}</p>
        <a
          href={downloadHref}
          download={`order-${orderId}.png`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full gap-2')}
        >
          <Download size={14} />
          {t('order_qr_download')}
        </a>
      </CardContent>
    </Card>
  );
}
