import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ChevronLeft, QrCode } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function ScannerScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { hasPage } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [resolving, setResolving] = useState(false);
  // One-shot guard so the camera doesn't fire repeatedly while we navigate.
  const handledRef = useRef(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // Pick the area-prefix the user is allowed in. Admin → /admin, otherwise the
  // first allowed orders surface; falls back to /admin (route guard will redirect).
  const orderAreaPrefix = (() => {
    if (hasPage('admin.orders')) return '/admin/orders';
    if (hasPage('office.orders')) return '/office/orders';
    return '/admin/orders';
  })();

  const onScan = async (result: BarcodeScanningResult) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setResolving(true);
    try {
      const token = (result.data || '').trim();
      if (!token) throw new Error(t('scanner_invalid_qr'));
      const { order_id } = await api<{ order_id: number }>(
        `/api/orders/by-qr/${encodeURIComponent(token)}`
      );
      // Replace so the back button leaves the scanner and goes to the previous
      // screen rather than re-opening it.
      router.replace(`${orderAreaPrefix}/${order_id}` as any);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('scanner_invalid_qr'));
      // Re-arm so a quick second attempt works without leaving the screen.
      setTimeout(() => {
        handledRef.current = false;
      }, 1200);
    } finally {
      setResolving(false);
    }
  };

  // The scanner is only mounted as the active route — pause when we navigate away.
  const active = pathname === '/scanner';

  return (
    <View className="flex-1 bg-black">
      {permission?.granted && active ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={resolving || handledRef.current ? undefined : onScan}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {!permission ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <QrCode size={48} color="white" />
              <Text className="mt-4 text-center text-base font-semibold text-white">
                {t('scanner_permission_title')}
              </Text>
              <Text className="mt-1 text-center text-sm text-white/70">
                {t('scanner_permission_body')}
              </Text>
              {permission.canAskAgain && (
                <View className="mt-6 w-full">
                  <Button onPress={requestPermission} fullWidth size="lg">
                    {t('scanner_permission_grant')}
                  </Button>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Top bar: dark gradient + back button. Always shown. */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 flex-row items-center px-3 pb-3"
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40 active:bg-black/60"
        >
          <ChevronLeft size={22} color="white" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold text-white">{t('scanner_title')}</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Scan-frame overlay for visual guidance. */}
      {permission?.granted && (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View
            style={{
              width: 240,
              height: 240,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: '#0ea5e9',
              backgroundColor: 'transparent',
            }}
          />
          <Text className="mt-6 text-center text-sm text-white/85">
            {resolving ? t('scanner_resolving') : t('scanner_hint')}
          </Text>
        </View>
      )}
    </View>
  );
}
