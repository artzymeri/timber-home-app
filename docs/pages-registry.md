# Pages Registry

The page registry is the **single source of truth** for which application pages
exist and which roles can see them in the sidebar. It replaces the older
"capability flag → sidebar nav" linkage with an explicit page-level toggle the
admin manages from the role wizard.

## Why this exists

Earlier the sidebar derived from capability flags (`orders.read`,
`users.manage`, …). That conflated two questions:

1. **Can the user perform this action?** (API-level gate)
2. **Should this nav item show in the sidebar?** (UI visibility)

A role might have `orders.read` for a client tracker integration but not need
the Orders page in their sidebar. Pages cleanly separate the two concerns.

- **Pages** drive sidebar visibility + the default landing page after sign-in.
- **Capabilities** still gate API actions (`checkCapability` in middleware).
- Page checkboxes in the role wizard auto-derive the matching capabilities so
  admins don't have to maintain both lists by hand.

## How a page is defined

There are two registry files that **must stay in sync**:

- [frontend/src/lib/pages.ts](../frontend/src/lib/pages.ts) — drives the wizard
  UI, sidebar filter, and the `hasPage()` helper.
- [backend/src/lib/pages.ts](../backend/src/lib/pages.ts) — validates
  `allowed_pages` payloads on `POST/PATCH /api/roles` and derives capabilities
  via `pagesToCapabilities()`.

Each `PageDef` has:

```ts
{
  key: 'admin.orders',           // stable id stored in role.allowed_pages
  path: '/admin/orders',         // route the page lives at
  area: 'admin',                 // 'admin' | 'office' | 'factory' | 'field'
  labelKey: 'orders',            // i18n key (frontend only)
  capabilities: ['orders.read'], // optional API caps to auto-grant when this page is enabled
}
```

## Adding a new page

When you create a new page in `frontend/src/app/<area>/<page>/page.tsx`:

1. **Append a `PageDef`** to both `frontend/src/lib/pages.ts` and
   `backend/src/lib/pages.ts`. Pick a unique key in the `<area>.<slug>` shape.
2. **If the page needs an i18n label that doesn't exist yet**, add it to
   `frontend/src/lib/i18n/{en,sq}.ts` and reference it via `labelKey`.
3. **Add the matching `<NavItem>`** to the area's layout file
   (`frontend/src/app/<area>/layout.tsx`) with `pageKey: '<key>'`.
4. **List any required API capabilities** under `capabilities`. The backend
   will OR these into the role's `permissions` whenever an admin enables this
   page in the wizard.

That's it. Existing roles will **not** auto-receive the new page — admins must
explicitly enable it from the role wizard. The Admin role uses the `'*'`
wildcard, so it sees every page (including future ones) automatically.

## How the role wizard treats pages

The wizard's "Pages" step renders one checkbox per `PageDef`, grouped by area.
Each checked page can be marked with a star (`Star` icon) to designate it as
the default landing page after sign-in:

- The starred page's `path` is saved as `role.default_route`.
- The list of checked page keys is saved as `role.allowed_pages`.
- The backend auto-merges any `capabilities` from those pages into
  `role.permissions` so the API gates align.

A role must have at least one page checked AND one starred to save.

## Wildcard

The literal string `'*'` in `role.allowed_pages` means "all pages, including
future ones". It's reserved for the seeded `Admin` role and is rejected by
`POST/PATCH /api/roles` on any other role to prevent escalation.

## Backwards-compatibility note

`NavItem.requires` (capability gate) is still supported in the AppShell as a
fallback for nav items without a registered page key. New nav items should use
`pageKey` instead — `requires` is marked `@deprecated`.
