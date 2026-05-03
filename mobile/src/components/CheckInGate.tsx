import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { useTodayAttendance } from '@/hooks/useTodayAttendance';

export function CheckInGate({ onChecked }: { onChecked: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { checkIn } = useTodayAttendance(true);

  const onPress = async () => {
    try {
      await checkIn.mutateAsync();
      toast.success(t('checkin_success'));
      onChecked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 items-center justify-center bg-background px-8"
    >
      <BrandLogo size={72} />
      <Text className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
        {t('checkin_greeting').replace('{name}', user?.name?.split(' ')[0] || '')}
      </Text>
      <Text className="mt-2 text-center text-sm text-muted-foreground">{t('checkin_required_body')}</Text>

      <View className="mt-12 w-full">
        <Button onPress={onPress} loading={checkIn.isPending} fullWidth size="lg">
          <Clock size={20} color="white" />
          <Text className="text-lg font-semibold text-background">{t('checkin_button')}</Text>
        </Button>
      </View>
    </View>
  );
}
