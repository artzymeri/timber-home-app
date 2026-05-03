# WoodFlow Frontend — CLAUDE.md

## Project Overview
WoodFlow is a custom furniture manufacturing ERP and MES system. This is the **Next.js frontend** (App Router, TypeScript, shadcn/ui, Tailwind CSS).

## Tech Stack
- **Framework:** Next.js (App Router) with TypeScript
- **UI:** shadcn/ui + Tailwind CSS v4
- **Font:** Geist Sans (mapped to `--font-sans`)
- **Theme:** Light mode only. Minimalist, clean industrial aesthetic. Stone color palette.
- **Data Fetching:** SWR
- **Auth:** Cookie-based JWT, context in `src/lib/auth-context.tsx`

## Architecture

### Routing (Role-Based)
| Role | Base Path | Layout |
|------|-----------|--------|
| Admin | `/admin/*` | Persistent sidebar |
| Sales/Designer | `/office/*` | Standard |
| Cutter/Painter | `/factory/*` | Mobile-first, bottom nav |
| Installer | `/field/*` | Mobile-first, bottom nav |
| Public (Client) | `/client/*` | No auth required |

### Key Directories
```
src/
├── app/            # Next.js App Router pages
├── components/ui/  # shadcn/ui components
├── lib/
│   ├── auth-context.tsx   # Auth provider + role-based redirect
│   ├── i18n/              # Internationalization system
│   │   ├── index.tsx      # I18nProvider + useI18n hook
│   │   ├── en.ts          # English translations
│   │   └── sq.ts          # Albanian translations
│   └── utils.ts           # Tailwind merge utils
└── hooks/          # Custom hooks
```

## ⚠️ CRITICAL: Internationalization (i18n) Rules

**EVERY piece of user-facing text MUST be localized in BOTH English and Albanian.**

When making ANY UI change:
1. **Never hardcode strings** in JSX. Always use `t('key_name')` from the `useI18n()` hook.
2. **Add new keys** to BOTH `src/lib/i18n/en.ts` AND `src/lib/i18n/sq.ts`.
3. **Import the hook:** `import { useI18n } from '@/lib/i18n';`
4. **Use in component:** `const { t } = useI18n();`
5. **Type safety:** Keys are typed via `TranslationKeys` from `@/lib/i18n/en.ts`.

### Example — Adding new text:
```tsx
// 1. Add to en.ts:
export const en = { ..., my_new_label: 'My New Label' };

// 2. Add to sq.ts:
export const sq = { ..., my_new_label: 'Etiketa Ime e Re' };

// 3. Use in component:
const { t } = useI18n();
return <h1>{t('my_new_label')}</h1>;
```

### Supported Locales
- `en` — English (default)
- `sq` — Albanian (Shqip)

Language preference is stored in `localStorage` under key `woodflow-locale`.

## Backend API
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000`)
- Auth endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- All API calls use `credentials: 'include'` for cookie-based auth

## Design Principles
- Light mode only
- Stone color palette (`stone-50`, `stone-100`, etc.)
- Mobile-first for factory/field views
- Desktop-first for admin views
- shadcn/ui components exclusively (Card, Badge, Button, Input, etc.)
- No custom CSS — Tailwind utilities only

## Order Lifecycle Stages
```
ESTIMATE → MEASUREMENT → DESIGN_APPROVAL → CUTTING → CNC → FINISHING → PACKING → INSTALLATION → COMPLETED
```

## Running
```bash
npm run dev  # Starts Next.js dev server
```

## Environment Variables
- `NEXT_PUBLIC_API_URL` — Backend API URL (in `.env.local`)
