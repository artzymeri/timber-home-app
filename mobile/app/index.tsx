import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user?.must_change_password) router.replace('/(auth)/change-password');
  }, [user, loading, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.must_change_password) return <Redirect href="/(auth)/change-password" />;

  // Send the user into the (authed) group; the layout there builds the navigator.
  // Default route falls back to /admin/dashboard.
  const target = role?.default_route || '/admin/dashboard';
  return <Redirect href={target as any} />;
}
