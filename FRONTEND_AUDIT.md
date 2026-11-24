# FRONTEND_AUDIT — KIYU Frontend

PRD Gate 0 deliverable. Audited 2026-11-24 against `KIYU_Frontend_PRD_v1.md`,
commit `44df395` (branch `refactoring`). Backend inspected read-only; no code
changed in this pass.

Combines PRD §15 items 1, 4, 5, and 6 (audit, route map, role matrix, design
decisions) — one file instead of four, because the route map and role matrix
are short tables and splitting them would duplicate context.

---

## 1. Stack

| Concern | Reality |
|---|---|
| Framework | Next.js 16.4.6, App Router, React 19.2.8 |
| Language | TypeScript 5, `strict: true` |
| Styling | Tailwind v4 (`@theme inline` tokens in `app/globals.css`), `tw-animate-css` |
| Components | shadcn/ui, style `base-mira`, built on **`@base-ui/react`** (not Radix). `class-variance-authority`. `cn` package (official shadcn clsx+tw-merge replacement) |
| Icons | `lucide-react` |
| Tables | `@tanstack/react-table` v9 (new feature-flag API: `tableFeatures`) |
| Forms | Native server actions + `useActionState`; `zod` in `lib/actions/auth.ts` only |
| Realtime | `laravel-echo` + `pusher-js` → Laravel Reverb |
| Toasts | `sonner` |
| State | No global client store. Server components fetch; client hooks poll + subscribe |
| Tests | **None.** No runner, no test script, no CI |
| ~Size | 210 source files, ~28,400 lines (excluding `node_modules`, `.next`, `skills`) |

Commands: `npm run dev` (via `dotenvx`), `build`, `start`, `lint`, `format`,
`typecheck`. Baseline: `tsc --noEmit` exit 0; `eslint` exit **1** (15 errors, all
in vendored `.agents/skills/**` JS).

## 2. Architecture as built

```
app/
  layout.tsx, page.tsx, redirect/, login/, signup/, unauthorized/
  (dashboard)/
    layout.tsx            # Shell: sidebar + header, verifies session
    admin/                # tenant_admin | facility_admin  (today: "admin")
      layout.tsx          # requireRole(["admin"])
      dashboard, users, departments, stations, workflows(/[id]), facilities,
      kiosk-devices, display-devices, clients, visits, referrals, queue,
      reports, audit-logs, billing
    receptionist/         # operator (today: "admin"|"receptionist")
      dashboard, registration, queue, clients
    staff/                # staff
      dashboard, queue
    client/               # client
      dashboard, visits, booking, profile
  client/onboarding/      # outside dashboard shell: links auth user → customer
  kiosk/                  # device-authenticated, HttpOnly device cookie
  display/, display/[code]/
  track/[token]/          # public queue-session tracking
  api/
    backend/[...path]/    # browser → API, attaches session bearer token
    device/[...path]/     # kiosk|display → API, attaches device credential
    device/pair/          # pairing code exchange
lib/
  auth/      session-core (HMAC signed cookie), session, guard (requireRole),
             verify (API /auth/me), origin (CSRF), redirect, route-access
  api/       per-audience clients: admin(-server), clients(-server),
             reception(-server), staff(-server), kiosk, display,
             visit-tracking, client (browser proxy), server (server fetch)
  device/    session (signed device cookie), client (pairing)
  navigation.tsx, admin/roles.ts, reception/format.ts, table-params.ts
types/       auth, admin, client, reception, staff, kiosk, visit-tracking
components/  admin/*, receptionist/*, staff/*, client/*, kiosk/*, display/*,
             visit-tracking/*, realtime/live-refresh, ui/*
```

Auth model: login posts to the API, stores the Sanctum token + user snapshot in
an HMAC-signed `HttpOnly` cookie (`__Host-` prefixed in production). The proxy
only checks cookie presence; each workspace layout calls `requireRole()`, which
re-reads `/auth/me` so a demoted user is ejected immediately. Both API proxies
re-attach the token/credential server-side; browser JS never sees either.

## 3. Domain areas present vs PRD

| PRD area | Status |
|---|---|
| `kiyu.id` marketing site | **Absent** |
| `app.kiyu.id` customer portal (org, facilities, users, devices, subscription) | Partly present under `/admin/*` inside the tenant app |
| `app.kiyu.id/platform` | **Absent** (backend has `/platform/*` routes only) |
| `{slug}.kiyu.id` tenant app | Present as one host app, no host-based tenant resolution |
| Kiosk | Present: `/kiosk`, device pairing, idle reset |
| Display | Present: `/display`, `/display/[code]`, Reverb `public.facility.{id}` |
| Public tracking | Present: `/track/[token]` |
| Onboarding / plan / payment | **Absent** |
| Invitation acceptance | **Absent** (backend endpoint exists) |

## 4. Route map (current → PRD target)

| Current | PRD target | Action |
|---|---|---|
| `/` (redirect by role) | stays | keep |
| `/login`, `/signup` | `/login`, `/register` | rename `/signup` when tenant host resolution lands |
| `/admin/dashboard` | portal `/dashboard` | keep for now |
| `/admin/clients` | `/customers` | rename in a separate plan |
| `/admin/visits` | `/queue-sessions` | rename in a separate plan |
| `/admin/referrals` | service transfers | rename in a separate plan |
| `/admin/stations` | `/service-points` | rename |
| `/admin/departments` | `/departments` | match |
| `/admin/workflows` | `/workflows` | match |
| `/admin/users` | `/users` | match |
| `/admin/facilities` | `/facilities` | match |
| `/admin/kiosk-devices`, `/admin/display-devices` | `/devices/kiosks`, `/devices/displays` | rename |
| `/admin/billing` | portal `/subscription`, `/billing` | split |
| `/receptionist/*` | operator routes | rename when roles land |
| `/staff/*` | staff routes | match |
| `/client/*` | portal `/account`, `/tickets` | rename |
| `/kiosk`, `/display`, `/track/[token]` | match | keep |
| — | `/platform/*`, `/onboarding/*`, `/invitations/accept` | **missing** |

Page-path renames are deliberately excluded from plans 001–005: they change
bookmarks and are a product decision (PRD §4.2 "adapt naming to existing
conventions").

## 5. Role matrix (as built → as required)

| API role | Frontend union today | Workspace today | Required |
|---|---|---|---|
| `tenant_admin` | ✗ absent | locked out | admin console, all facilities, billing, audit |
| `facility_admin` | ✗ absent | locked out | admin console, assigned facilities, no billing/create-facility |
| `operator` | ✗ absent | locked out | reception desk |
| `staff` | ✓ | `/staff` | station workspace |
| `client` | ✓ | `/client` | portal, own data |
| `platform_admin` | ✗ absent | locked out | `/platform` (not built) |
| `admin` | ✓ | `/admin` | **not a backend role** |
| `receptionist` | ✓ | `/receptionist` | **not a backend role** |

Detail and remediation: plan `plans/002-role-model.md`.

## 6. Design system decisions

- Keep the existing shadcn `base-mira` + `@base-ui/react` stack. PRD §9.1: no
  second component library.
- Reuse `components/ui/*` as-is: `data-table.tsx` (server pagination +
  URL-state via `use-table-query`), `sidebar.tsx`, `sheet.tsx` for detail
  panels, `alert` for page-level errors, `spinner`/`skeleton` for loading.
- Page composition convention: `AdminPageHeader` + `Alert` on error + manager
  component. New pages must follow it.
- Accessibility baseline already present: semantic `main`, labels bound to
  inputs, `AlertDialog` for destructive actions, focus styles from the theme.
  Gaps: status is conveyed by `Badge` colour + text (acceptable), but tables
  lack `caption`/`scope` review.
- Localization: `id-ID` formatting and `Asia/Jakarta` dates are hardcoded in
  `lib/reception/format.ts`, `lib/admin/date.ts`, and five display/kiosk
  components. PRD §9.7 says the default locale/timezone must follow product
  configuration. Deferred: no tenant timezone field exists on the backend.
- Every data page reviewed handles loading and error; **empty** states are
  inconsistent (some tables render an empty table body).

## 7. Risk register

| # | Risk | Severity | Plan |
|---|---|---|---|
| R1 | Backend roles normalize to `null` → all admins/operators locked out | Critical | 002 |
| R2 | ~60 calls to deleted endpoints (`/clients`, `/visits`, `/referrals`, `/clinical/*`) | Critical | 003 |
| R3 | Session claims (`facility_id`, `department_id`) never sent by the API | High | 004 |
| R4 | Public signup posts no tenant locator → always 404 | High | 004 follow-up (blocked on host resolution) |
| R5 | Dashboard live-refresh listens on non-existent channel names | Medium | 004 |
| R6 | Clinical vocabulary; station types the API rejects (422 on create) | Medium | 005 |
| R7 | No tests, no CI; lint red out of the box | Medium | 001 |
| R8 | Multi-facility tenants 403 on facility-scoped routes (backend gap) | High | **backend task** — `FRONTEND_API_GAPS.md` G-1 |
| R9 | No host-based tenant resolution → cannot distinguish `kiyu.id` / `app.` / `{slug}.` | High | unplanned; needs product decision |

## 8. Not audited

- Runtime behavior of the kiosk/display pairing against a live API.
- Reverb end-to-end delivery (only the channel-name contract was compared).
- Payment/subscription flows (no frontend implementation exists).
- Backend internals beyond routes, middleware, controllers touched by the
  contract map.
