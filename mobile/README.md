# Timber Home — Mobile (Expo)

Companion iOS/Android app to the WoodFlow web app. Talks to the same Express API at `backend/`.

## Setup

```bash
cd mobile
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL to your backend
npx expo start             # scan QR with Expo Go (or press i / a)
```

## Auth

Mobile uses **Bearer-token auth** instead of the web's HttpOnly cookie. On login, the backend returns `{ token, user, role, capabilities, allowed_pages }`. The token is stored in `expo-secure-store` (key: `tt_token`) and sent as `Authorization: Bearer <jwt>` on every request.

The web continues to work via HttpOnly cookies — no regression.

## Push notifications

After login, the app registers an Expo push token and POSTs it to `/api/auth/devices`. The backend's `sendPush(userId, …)` helper fans out to every registered device for that user.

In dev with Expo Go, push tokens are issued by Expo's servers. For standalone builds, you'll need APNs / FCM credentials in EAS (see `eas.json`).

## Mirrored registries

The mobile app duplicates these from the web frontend:

- `src/lib/pages.ts`
- `src/lib/capabilities.ts`
- `src/lib/i18n/{en,sq}.ts`

When you add a key on the web, copy it here. A future PR will collapse these into a shared workspace package.
