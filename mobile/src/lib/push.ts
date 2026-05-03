import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const { status: req } = await Notifications.requestPermissionsAsync();
    status = req;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenResponse.data;

  try {
    await api('/api/auth/devices', {
      method: 'POST',
      body: JSON.stringify({
        expo_push_token: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
    });
  } catch (err) {
    console.warn('[push] register failed', err);
  }

  return token;
}

export async function unregisterPushToken(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await api(`/api/auth/devices/${encodeURIComponent(token)}`, { method: 'DELETE' });
  } catch {}
}
