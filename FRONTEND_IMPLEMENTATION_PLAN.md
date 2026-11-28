# KIYU Frontend Implementation Plan

**Generated:** 2026-11-28  
**Based on:** PRD Part 1 & Part 2, backend API contract verification

---

## 1. Existing Frontend Stack

| Item | Version/Details |
|------|-----------------|
| Next.js | 16.4.6 (App Router) |
| React | 19.3.1 |
| TypeScript | 5.x (strict mode) |
| Tailwind CSS | v4 (with @tailwindcss/postcss) |
| shadcn/ui | Initialized, style: `base-vega`, baseColor: `mist` |
| Package Manager | npm (lockfile present) |
| Icons | lucide-react 1.83.0 |
| Theming | next-themes 0.4.6 |
| Form/Validation | None yet (need to add) |
| Data Fetching | None yet (need to add TanStack Query or SWR) |
| Testing | Vitest (config issue: needs `root: "."`) |

**Existing shadcn components installed:**
- button, input, separator, skeleton, tooltip
- breadcrumb, collapsible, dropdown-menu, avatar
- sheet, sidebar (with nav-main, nav-projects, nav-user, team-switcher)

**Template assets to retain:**
- `components/ui/*` — shadcn primitives
- `components/theme-provider.tsx` — theme support
- `components/app-sidebar.tsx` — pattern for sidebar shells (will adapt per context)
- `hooks/use-mobile.ts` — responsive utility
- `lib/utils.ts` — cn() utility
- `app/globals.css` — design tokens (OKLCH, CSS variables)
- `app/layout.tsx` — root layout with ThemeProvider, TooltipProvider

**Template content to remove/replace:**
- `app/page.tsx` — demo landing page
- `app/dashboard/page.tsx` — demo dashboard with placeholder cards
- `components/app-sidebar.tsx` data — demo teams, nav items (replace with real navigation configs)

---

## 2. Backend API Context & Endpoint Map (Verified)

| Context | Prefix | Origin | Allowed Roles | Token Ability |
|---------|--------|--------|---------------|---------------|
| Public | `/api/public` | `kiyu.test` | none | — |
| Customer | `/api/customer` | `{tenant}.kiyu.test` | `customer` | `ctx:customer` |
| App | `/api/app` | `app.kiyu.test` | `tenant_admin` | `ctx:app` |
| Tenant | `/api/tenant` | `{tenant}.kiyu.test` | `facility_admin`, `operator`, `staff` | `ctx:tenant` |
| Portal | `/api/portal` | `portal.kiyu.test` | `platform_admin` | `ctx:portal` |

**Key verified endpoints per context:**

**Public:**
- `GET /api/public/tenants/{slug}` → tenant public info (200/403/404)

**App (tenant_admin):**
- Auth: `POST /signup`, `POST /login`, `GET /me`, `POST /logout`
- Dashboard: `GET /dashboard`
- Facilities: CRUD + list
- Users: CRUD + facility assignments
- Invitations: CRUD (returns one-time token)
- Departments/Stations/Workflows: CRUD (facility-scoped via `facility_id`)
- Monitoring: queue-monitor, queue-sessions, customers, audit-logs
- Reports: 12 report endpoints (each feature-gated)
- Billing: subscription, entitlements, plans, payments, add-ons

**Tenant (facility_admin/operator/staff):**
- Auth: `POST /login`, `POST /invitations/accept`, `GET /me`, `POST /logout`
- Intake: manual, online (facility_admin/operator)
- Reception: queue, call-next, complete-registration, recall/skip/no-show
- Queue: call-next (all roles), tickets (all), service-transfers (staff only)
- Queue-sessions: list, statistics, detail, priority, cancel
- Customers: CRUD
- Departments/Stations/Workflows: read (all), write (facility_admin)
- Devices: kiosk/display CRUD + pairing codes (facility_admin)
- Reports: same 12 as App (role + feature gated)
- WhatsApp: send (facility_admin/operator, feature-gated)

**Customer:**
- Auth: `POST /register` (conditional), `POST /login`, `GET /me`, `POST /logout`
- Profile: GET/POST/PUT `/profile`
- Queue-sessions: list, detail
- Bookings: `POST /bookings` (facility derived from department)

**Portal (platform_admin):**
- Auth: `POST /login`, `GET /me`, `POST /logout`
- Dashboard, Tenants (CRUD + suspend/reactivate), Subscriptions, Payments
- Plans (CRUD + prices + entitlements), Add-ons (CRUD + prices + entitlements + eligibilities)
- Reports: revenue, growth, subscriptions
- Features: list, release toggle
- Audit-logs, Settings

**Device (tenant origin, no user auth):**
- `POST /devices/kiosk/pair`, `POST /devices/display/pair` → device credentials
- `POST /intake/kiosk` (requires `X-Kiosk-Token`)
- `GET /public/queue` (signage), `GET /public/departments/active` (kiosk)
- `GET /public/tracking/{token}`, `GET /intake/online-lookup`, `POST /intake/online-checkin`

---

## 3. Authentication / Session Strategy

**Per-context isolation (mandatory):**
- Four separate auth contexts: `app`, `tenant`, `customer`, `portal`
- Each has its own token ability (`ctx:app`, `ctx:tenant`, `ctx:customer`, `ctx:portal`)
- Tokens must NOT be shared across contexts
- Customer and Tenant share hostname (`{tenant}.kiyu.test`) but are DIFFERENT auth contexts

**Token storage:**
- DO NOT store bearer tokens in localStorage
- Use HttpOnly, Secure (prod), SameSite=Lax cookies via server-side BFF/proxy
- Separate cookie names per context: `kiyu_app`, `kiyu_tenant`, `kiyu_customer`, `kiyu_portal`
- Host-only cookies (no broad `.kiyu.test`)

**Login flows:**
- **App Console (`app.kiyu.test`)**: `/login` → `/api/app/auth/login` → load `/me` → redirect to `/app/dashboard`
- **App Signup**: `/signup` → `/api/app/auth/signup` → success state → redirect to `/login` (NO token returned)
- **Tenant Workspace (`{tenant}.kiyu.test`)**: `/login` with Staff/Admin tab → `/api/tenant/auth/login` → load `/me` → resolve facilities → redirect per role
- **Customer Portal (`{tenant}.kiyu.test`)**: `/login` with Customer tab → `/api/customer/auth/login` → load `/me` → redirect to `/customer`
- **Customer Registration**: Only when tenant `allow_public_registration` = true (from public tenant endpoint)
- **Platform Portal (`portal.kiyu.test`)**: `/login` → `/api/portal/auth/login` → load `/me` → redirect to `/portal/dashboard`

**Session handling:**
- 401 → redirect to correct context login with return path
- 403 → show permission denied (don't retry)
- Logout → revoke backend token + clear only matching context cookie

---

## 4. Host Routing Strategy

**Local development hosts (via hosts file / Laragon):**
```
kiyu.test           → Public Website
app.kiyu.test       → App Console (tenant_admin)
portal.kiyu.test    → Platform Portal (platform_admin)
api.kiyu.test       → Laravel API
{tenant}.kiyu.test  → Tenant Workspace + Customer Portal + Devices
```

**Implementation approach for Next.js 16 (App Router):**
- Use Next.js Middleware (`middleware.ts`) for host-based routing
- Middleware reads `request.headers.get('host')` and rewrites to internal route groups
- Internal route groups (not exposed in URL):
  - `(public)` → `kiyu.test/*`
  - `(app-console)` → `app.kiyu.test/app/*`
  - `(portal)` → `portal.kiyu.test/portal/*`
  - `(tenant-workspace)` → `{tenant}.kiyu.test/facility|operator|staff/*`
  - `(customer-portal)` → `{tenant}.kiyu.test/customer/*`
  - `(devices)` → `{tenant}.kiyu.test/kiosk`, `{tenant}.kiyu.test/display`

**Tenant resolution:**
- Extract tenant slug from subdomain (e.g., `clinic-a.kiyu.test` → `clinic-a`)
- Validate via `GET /api/public/tenants/{slug}` (returns 200/403/404)
- Store validated tenant info in request headers for downstream use
- Unknown/inactive tenants → 404 page, never leak other tenant data

**Environment config (`.env.local`):**
```env
NEXT_PUBLIC_API_BASE_URL=http://api.kiyu.test/api
NEXT_PUBLIC_APP_HOST=app.kiyu.test
NEXT_PUBLIC_PORTAL_HOST=portal.kiyu.test
NEXT_PUBLIC_PUBLIC_HOST=kiyu.test
# Tenant hosts are dynamic: {tenant}.kiyu.test
```

---

## 5. Proposed Folder Structure (Adapted to Actual Project)

```
src/
├── app/
│   ├── (public)/                    # kiyu.test - marketing pages
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home
│   │   ├── features/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   └── loading.tsx / error.tsx
│   │
│   ├── (app-console)/               # app.kiyu.test/app/*
│   │   ├── layout.tsx               # App shell with sidebar
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── facilities/
│   │   │   ├── page.tsx             # List
│   │   │   ├── new/page.tsx         # Create
│   │   │   └── [facilityId]/
│   │   │       ├── page.tsx         # Detail (Overview tab)
│   │   │       ├── departments/
│   │   │       ├── stations/
│   │   │       ├── workflows/
│   │   │       └── team/
│   │   ├── team/
│   │   │   ├── page.tsx             # Users list
│   │   │   ├── invitations/page.tsx
│   │   │   └── [userId]/page.tsx
│   │   ├── monitoring/
│   │   ├── reports/
│   │   ├── billing/
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── (portal)/                    # portal.kiyu.test/portal/*
│   │   ├── layout.tsx               # Portal shell
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── tenants/
│   │   ├── subscriptions/
│   │   ├── payments/
│   │   ├── plans/
│   │   ├── addons/
│   │   ├── features/
│   │   ├── reports/
│   │   ├── audit-logs/
│   │   ├── settings/
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── (tenant-workspace)/          # {tenant}.kiyu.test/facility|operator|staff/*
│   │   ├── layout.tsx               # Tenant shell (facility switcher in header)
│   │   ├── login/page.tsx           # Shared Staff/Admin + Customer tabs
│   │   ├── invitation/accept/page.tsx
│   │   ├── facility/                # facility_admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── reception/page.tsx
│   │   │   ├── queue-monitor/page.tsx
│   │   │   ├── queue-acquisitions/
│   │   │   ├── tickets/
│   │   │   ├── queue-sessions/
│   │   │   ├── customers/
│   │   │   ├── departments/
│   │   │   ├── stations/
│   │   │   ├── workflows/
│   │   │   ├── devices/
│   │   │   └── reports/
│   │   ├── operator/                # operator
│   │   │   ├── reception/page.tsx
│   │   │   ├── queue-monitor/page.tsx
│   │   │   ├── queue-acquisitions/
│   │   │   ├── tickets/
│   │   │   ├── customers/
│   │   │   └── reports/
│   │   ├── staff/                   # staff
│   │   │   └── page.tsx             # Service Workstation (primary)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── (customer-portal)/           # {tenant}.kiyu.test/customer/*
│   │   ├── layout.tsx               # Mobile shell with bottom nav
│   │   ├── page.tsx                 # Home
│   │   ├── book/page.tsx            # Book Visit
│   │   ├── queue/page.tsx           # My Queue
│   │   ├── queue/[sessionId]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── (devices)/                   # {tenant}.kiyu.test/kiosk|display
│   │   ├── kiosk/
│   │   │   ├── page.tsx             # Pairing / Intake
│   │   │   └── loading.tsx
│   │   └── display/
│   │       ├── page.tsx             # Signage
│   │       └── loading.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx                   # Root (providers only)
│   ├── not-found.tsx
│   └── middleware.ts                # Host routing + auth guards
│
├── components/
│   ├── ui/                          # shadcn-managed only
│   ├── shared/                      # Cross-context compositions
│   │   ├── skeletons/               # Page-specific skeleton components
│   │   ├── forms/                   # Reusable form fields
│   │   ├── feedback/                # Toast, Alert, EmptyState, ErrorState
│   │   └── data-display/            # Table, Badge, StatCard, etc.
│   ├── layouts/                     # Shell parts (Sidebar, Header, Footer)
│   │   ├── app-shell.tsx
│   │   ├── portal-shell.tsx
│   │   ├── tenant-shell.tsx
│   │   ├── customer-shell.tsx
│   │   ├── kiosk-shell.tsx
│   │   └── display-shell.tsx
│   └── navigation/                  # Navigation configs per role
│
├── modules/                         # Feature modules (added as implemented)
│   ├── auth/
│   ├── public-site/
│   ├── dashboard/
│   ├── facilities/
│   ├── users/
│   ├── departments/
│   ├── stations/
│   ├── workflows/
│   ├── reception/
│   ├── queues/
│   ├── tickets/
│   ├── customers/
│   ├── devices/
│   ├── reports/
│   ├── billing/
│   └── platform/
│
├── contexts/                        # Auth/session contexts per app
│   ├── public/
│   ├── app/
│   ├── tenant/
│   ├── customer/
│   └── portal/
│
├── lib/
│   ├── api/
│   │   ├── transport.ts             # Shared fetch wrapper
│   │   ├── public.ts                # Public API client
│   │   ├── app.ts                   # App API client
│   │   ├── app-server.ts            # Server-side App client
│   │   ├── tenant.ts                # Tenant API client
│   │   ├── tenant-server.ts
│   │   ├── customer.ts              # Customer API client
│   │   ├── customer-server.ts
│   │   ├── portal.ts                # Portal API client
│   │   └── portal-server.ts
│   ├── auth/
│   │   ├── app-auth.ts
│   │   ├── tenant-auth.ts
│   │   ├── customer-auth.ts
│   │   └── portal-auth.ts
│   ├── host-routing/
│   │   ├── resolve-host.ts          # Host → context + tenant slug
│   │   └── tenant-lookup.ts         # Validate tenant via public API
│   ├── tenant/
│   ├── permissions/
│   ├── validation/
│   └── utilities/
│
├── config/
│   ├── navigation/
│   │   ├── app.navigation.tsx       # tenant_admin nav
│   │   ├── portal.navigation.tsx    # platform_admin nav
│   │   ├── facility-admin.navigation.tsx
│   │   ├── operator.navigation.tsx
│   │   ├── staff.navigation.tsx
│   │   └── customer.navigation.tsx
│   ├── routes/
│   └── environment.ts               # Centralized env config
│
└── types/
    ├── api/                         # API request/response types per context
    │   ├── public.ts
    │   ├── app.ts
    │   ├── tenant.ts
    │   ├── customer.ts
    │   └── portal.ts
    └── domain/                      # Domain types (User, Facility, Ticket, etc.)
```

---

## 6. shadcn Components to Install

**Phase 1 (Foundation):**
```bash
# Layout & Navigation
pnpm dlx shadcn@latest add sidebar breadcrumb separator scroll-area

# Forms & Input
pnpm dlx shadcn@latest add form input textarea select checkbox radio switch label

# Data Display
pnpm dlx shadcn@latest add table card badge avatar skeleton

# Feedback
pnpm dlx shadcn@latest add toast alert dialog sheet dropdown-menu tooltip

# Navigation & Menus
pnpm dlx shadcn@latest add tabs navigation-menu pagination

# Overlays
pnpm dlx shadcn@latest add popover hover-card context-menu
```

**Phase 2 (Operational UI):**
```bash
# Advanced
pnpm dlx shadcn@latest add data-table calendar date-picker command
pnpm dlx shadcn@latest add progress slider toggle toggle-group
```

**Do NOT install** (not needed / use existing):
- Another component library
- Custom Button, Input, Select, Dialog, etc. — shadcn provides all

---

## 7. API Gaps, Ambiguities & Risks

| # | Gap / Risk | Impact | Mitigation |
|---|------------|--------|------------|
| 1 | No backend endpoint for "current user's accessible facilities" list in Tenant context — `/me` returns `facilities` array but Tenant workspace needs facility switcher data | Facility switcher for multi-facility users | Use `/api/tenant/auth/me` response `facilities` field; if missing, call `/api/tenant/departments?facility_id=` to infer |
| 2 | Customer registration requires `allow_public_registration` — where is this exposed? | Customer signup visibility | Check `/api/public/tenants/{slug}` response for this field; if absent, add to backend or use tenant settings endpoint |
| 3 | No Portal "support access" / tenant impersonation endpoint | Portal Admin cannot debug tenant issues | Document as out of scope; backend doesn't support it |
| 4 | Tenant workspace has no billing/entitlements endpoint | Facility Admin can't see subscription limits | App Console owns billing; Tenant workspace reads from App context if needed (cross-context call not allowed per PRD) |
| 5 | App context has no device endpoints | Tenant Admin can't manage devices in App Console | By design — device mgmt is Tenant `facility_admin` only |
| 6 | Kiosk/Display pairing returns device credential "shown once" — storage strategy? | Device credential persistence | Store in secure HttpOnly cookie per device; never expose in localStorage |
| 7 | No realtime/WebSocket for queue updates | Queue monitor polling only | Use backend-supported refresh; don't invent WebSocket |
| 8 | `vitest.config.ts` requires `root: "."` on Windows | Tests fail with absolute path | Fix config before adding tests |

---

## 8. Implementation Phases (Per PRD)

### Phase 1 — Foundation (Week 1-2)
- [ ] Fix vitest config (`root: "."`)
- [ ] Create `middleware.ts` with host routing + tenant resolution
- [ ] Build API transport layer (`lib/api/transport.ts`) with context-aware fetch
- [ ] Create 5 typed API clients (public, app, tenant, customer, portal) + server variants
- [ ] Build 4 auth services (app, tenant, customer, portal) with cookie-based sessions
- [ ] Define all TypeScript API types from backend contract
- [ ] Create route groups `(public)`, `(app-console)`, `(portal)`, `(tenant-workspace)`, `(customer-portal)`, `(devices)`
- [ ] Build application shells for each context (sidebar, header, bottom nav)
- [ ] Install required shadcn components (Phase 1 list)
- [ ] Create skeleton components for each shell type
- [ ] Add route-level `loading.tsx` and `error.tsx` for each route group
- [ ] Centralized env config (`config/environment.ts`)
- [ ] Navigation configs per role (`config/navigation/*.tsx`)
- [ ] Run typecheck, lint, build — all clean

### Phase 2 — Authentication & Context Routing (Week 2-3)
- [ ] Public Website: marketing pages, CTAs to `app.kiyu.test/signup` and `/login`
- [ ] App Console: `/login`, `/signup` (signup→success→redirect to login)
- [ ] Tenant Workspace: `/login` with Staff/Admin + Customer tabs
- [ ] Customer registration conditional on `allow_public_registration`
- [ ] Platform Portal: `/login` only
- [ ] Post-login routing per role (tenant_admin → `/app/dashboard`, facility_admin → `/facility/dashboard`, operator → `/operator/reception`, staff → `/staff`, customer → `/customer`, platform_admin → `/portal/dashboard`)
- [ ] Facility selection logic (auto-select single, prompt multi)
- [ ] Session expiry / 401 handling → correct context login
- [ ] 403 handling → permission denied state
- [ ] Logout per context (revoke backend + clear cookie)

### Phase 3 — Management Interfaces (Week 3-5)
- [ ] App Console: Dashboard, Facilities CRUD, Facility Detail (Overview, Departments, Stations, Workflows, Team)
- [ ] App Console: Team & Invitations (users, facility assignments, invitations)
- [ ] App Console: Monitoring (queue, sessions, customers, audit)
- [ ] App Console: Reports (entitlement-gated)
- [ ] App Console: Billing (subscription, plans, payments, add-ons, entitlements)
- [ ] Platform Portal: Dashboard, Tenants CRUD, Subscriptions, Payments, Plans, Add-ons, Features, Reports, Audit, Settings
- [ ] Facility Admin: Dashboard, Reception, Queue Monitor, Queue Acquisitions, Tickets, Queue Sessions, Customers
- [ ] Facility Admin: Departments, Stations, Workflows, Devices, Reports
- [ ] Entitlement-aware navigation (read from `/billing/entitlements` or `/features`)

### Phase 4 — Operational Interfaces (Week 5-7)
- [ ] Operator: Reception (primary), Queue Monitor, Queue Acquisitions, Tickets, Customers, Reports
- [ ] Staff: Service Workstation (current ticket, next waiting, large actions: Call Next, Start, Hold, Resume, Complete, Skip, No-show, Transfer)
- [ ] Ticket lifecycle actions with pending states, backend validation
- [ ] Operational empty/loading/error states

### Phase 5 — Customer & Device Interfaces (Week 7-8)
- [ ] Customer: Home, Book Visit (department selection), My Queue, Profile
- [ ] Mobile-first bottom navigation, no sidebar
- [ ] Kiosk: Pairing flow, intake flow (departments, touch targets), device states
- [ ] Display: Pairing flow, signage (queue numbers, waiting), reconnection handling

### Phase 6 — Stabilization (Week 8-9)
- [ ] E2E tests for auth flows, role routing, facility switching
- [ ] Responsive + accessibility review
- [ ] Security review (host routing, cookies, context isolation)
- [ ] Typecheck, lint, build, tests all pass
- [ ] Remove demo content, mock data
- [ ] Document env vars, local host setup, known backend limitations

---

## 9. Immediate Next Steps

1. **Fix vitest config** — set `root: "."` in `vitest.config.ts`
2. **Create `middleware.ts`** — host routing + tenant resolution (foundation for all contexts)
3. **Build API transport + types** — shared fetch wrapper, 5 context clients, TypeScript types
4. **Create route groups** — restructure `app/` directory per proposed structure
5. **Install shadcn components** — Phase 1 list
6. **Build application shells** — one per context with skeleton loading

---

## 10. Verification Checklist (Definition of Done)

- [ ] All 4 web contexts route correctly by hostname
- [ ] Public Website: no auth pages, CTAs work
- [ ] App Console: Login + Signup (signup→login redirect)
- [ ] Tenant Workspace: Tabbed Staff/Admin + Customer auth
- [ ] Customer registration conditional on backend setting
- [ ] Platform Portal: Login only
- [ ] Each role gets correct layout + navigation
- [ ] Staff → Service Workstation (no admin sidebar)
- [ ] Customer → Mobile-first + bottom nav
- [ ] Kiosk/Display → Full-screen device UX
- [ ] All workflows hit correct backend context + respect permissions
- [ ] Every page transition shows skeleton
- [ ] shadcn/ui primary, CLI-installed components only
- [ ] TypeScript strict, lint clean, build passes
- [ ] No critical security/routing/isolation issues
- [ ] Documentation: env vars, local setup, backend gaps