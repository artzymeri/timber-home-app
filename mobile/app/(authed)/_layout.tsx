import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { CheckInGate } from '@/components/CheckInGate';
import { RoleNavigator } from '@/components/RoleNavigator';
import { useTodayAttendance } from '@/hooks/useTodayAttendance';
import { registerForPushAsync } from '@/lib/push';

export default function AuthedLayout() {
  const { user, loading, hasCapability } = useAuth();
  const router = useRouter();
  const isAdmin = hasCapability('*');
  const att = useTodayAttendance(!!user && !isAdmin);
  const [pushRegistered, setPushRegistered] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/(auth)/login');
  }, [loading, user, router]);

  // Register the device for push once after sign-in.
  useEffect(() => {
    if (!user || pushRegistered) return;
    registerForPushAsync()
      .catch(() => {})
      .finally(() => setPushRegistered(true));
  }, [user, pushRegistered]);

  if (loading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  // Daily check-in gate for non-admins. Loading state shows a tiny spinner so
  // we don't flash the whole app before checking.
  if (!isAdmin) {
    if (att.loading) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator />
        </View>
      );
    }
    if (!att.attendance) {
      return <CheckInGate onChecked={() => att.refetch()} />;
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <Slot />
      </View>
      <RoleNavigator />
    </View>
  );
}
