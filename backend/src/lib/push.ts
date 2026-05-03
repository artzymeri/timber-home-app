import DeviceToken from '../models/DeviceToken';

const EXPO_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Fan-out a push notification to every device registered for `userId`.
 * Failures are logged but never throw — push is best-effort.
 */
export async function sendPush(userId: number, message: PushMessage): Promise<void> {
  const devices = await DeviceToken.findAll({ where: { user_id: userId } });
  if (devices.length === 0) return;

  const payload = devices.map((d) => ({
    to: d.expo_push_token,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data || {},
  }));

  try {
    const res = await fetch(EXPO_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[push] Expo returned non-ok', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[push] Failed to send', err);
  }
}
