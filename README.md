# KIYU Frontend

Multi-tenant Queue Management SaaS frontend. Next.js 16 App Router, one codebase
serving five distinct application contexts by hostname.

## Quick start

```bash
npm install
cp .env.example .env.local   # then edit if your API origin differs
npm run dev
```

Backend must be running at `http://api.kiyu.test` (see `C:\laragon\www\kiyu`).

## Local hosts

Add these to your hosts file (`C:\Windows\System32\drivers\etc\hosts`):

```text
127.0.0.1 kiyu.test
127.0.0.1 app.kiyu.test
127.0.0.1 portal.kiyu.test
127.0.0.1 api.kiyu.test
127.0.0.1 demo.kiyu.test      # example tenant — any *.{PUBLIC_HOST} works
```

Laragon auto-resolves `*.test`, so a hosts entry is usually unnecessary.
Tenant hosts are dynamic: `{tenant}.kiyu.test` — the subdomain IS the tenant slug.

## Application contexts

| Host | Context | Auth | Roles | Internal route base |
|---|---|---|---|---|
| `kiyu.test` | Public website | none | visitors | `/ctx/public` |
| `app.kiyu.test` | App Console | login + signup | `tenant_admin` | `/ctx/app` |
| `portal.kiyu.test` | Platform Portal | login only | `platform_admin` | `/ctx/portal` |
| `{tenant}.kiyu.test` | Tenant Workspace | shared tabbed login | `facility_admin`, `operator`, `staff` | `/ctx/tenant` |
| `{tenant}.kiyu.test/customer` | Customer Portal | login + conditional register | `customer` | `/ctx/customer` |
| `{tenant}.kiyu.test/kiosk` | Kiosk device | device credential | — | `/ctx/devices` |
| `{tenant}.kiyu.test/display` | Display signage | device credential | — | `/ctx/devices` |

## Architecture

```
proxy.ts                      Host routing + tenant validation (Next.js 16 Proxy)
app/ctx/<context>/            One route tree per application context
app/api/session/              BFF auth route handlers (token -> HttpOnly cookie)
app/api/proxy/[context]/      BFF data proxy (cookie -> Authorization header)
lib/api/transport.ts          Shared server-side HTTP transport
lib/api/app.ts                Typed App-context endpoint client
lib/api/browser-client.ts     Client API helper -> /api/proxy/*
lib/auth/*                    Per-context session services
lib/host-routing/             Host resolution + tenant lookup
config/environment.ts         Centralized env + cookie names
```

### Why the BFF layer

Bearer tokens are never placed in `localStorage` or exposed to browser JS.
Auth route handlers (`/api/session/*`) receive the backend token, store it in an
`HttpOnly`, `SameSite=Lax` cookie scoped per context (`kiyu_app`, `kiyu_tenant`,
`kiyu_customer`, `kiyu_portal`), and return only the user payload. Data requests
go through `/api/proxy/<context>/<path>` where the cookie is read server-side and
converted into the `Authorization` header.

This keeps Customer and workforce sessions isolated even though they share a
tenant hostname: they use different cookie names and different API contexts.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npx vitest run      # unit tests
```

## Known backend limitations

- **Portal has no tenant impersonation** — by design, not implemented.
- **Tenant workspace has no billing/entitlements endpoint** — billing stays in the
  App Console (`tenant_admin`).
- **App Console has no device endpoints** — kiosk/display pairing belongs to
  `facility_admin` in the Tenant Workspace.
- **No realtime channel** — queue monitor refreshes via polling only.

See `FRONTEND_IMPLEMENTATION_PLAN.md` for the full capability map and phasing.