import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { QrCode } from 'lucide-react-native';
import { Card, CardTitle } from '@/components/ui/Card';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

/**
 * Renders the order's QR token as an inline SVG so other workers can scan it
 * straight off the screen without us downloading the PNG. We fetch the token
 * once via the order detail payload (passed in as a prop) — no extra request.
 */
export function OrderQrCard({ token }: { token: string | undefined }) {
  const { t } = useI18n();

  if (!token) return null;
  return (
    <Card>
      <CardTitle>
        <View className="flex-row items-center gap-2">
          <QrCode size={14} color="#1c1917" />
          <Text className="text-base font-semibold text-foreground">{t('order_qr_title')}</Text>
        </View>
      </CardTitle>
      <View className="mt-3 items-center">
        <View className="rounded-xl bg-white p-3">
          <QRCodeSVG value={token} size={180} />
        </View>
        <Text className="mt-3 text-center text-xs text-muted-foreground">
          {t('order_qr_help')}
        </Text>
      </View>
    </Card>
  );
}
