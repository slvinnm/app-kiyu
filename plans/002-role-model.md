# Plan 002: Adopt the six-role model from the API

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 44df395..HEAD -- types/auth.ts lib/auth lib/navigation.tsx lib/admin/roles.ts "app/(dashboard)" components/app-sidebar.tsx components/admin/users`
> If anything changed, diff the "Current state" excerpts against live code
> before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-verification-baseline.md
- **Category**: bug / security
- **Planned at**: commit `44df395`, 2026-11-24

## Why this matters

The frontend's role vocabulary is a *different* vocabulary from the backend's.
The API emits `platform_admin`, `tenant_admin`, `facility_admin`, `operator`,
`staff`, `client` (`backend/app/Enums/UserRole.php`). The frontend defines
`["admin", "receptionist", "staff", "client"]` (`types/auth.ts:5`).

`normalizeRole()` returns `null` for any value outside that union, and
`requireRole()` redirects to `/unauthorized` on `null` (`lib/auth/guard.ts:58-62`).
Verified consequence:

| API role | Frontend today | Result |
|---|---|---|
| `tenant_admin` | `null` | **locked out of everything** |
| `facility_admin` | `null` | **locked out of everything** |
| `operator` | `null` | **locked out of everything** |
| `platform_admin` | `null` | locked out (correct — no platform UI yet) |
| `staff` | `staff` | works |
| `client` | `client` | works |

So every real administrator and front-desk operator is redirected to the
access-denied page. This plan replaces the frontend's invented roles with the
API's six-role model, keeps a single centralized capability map (PRD §3.3),
and makes the workspace routes role-correct.

After this plan: a `tenant_admin` lands on the admin console, a `facility_admin`
on the admin console with a reduced navigation, an `operator` on the reception
desk, `staff` on the station workspace, `client` on the customer portal, and
`platform_admin` on `/unauthorized` (no platform UI exists yet — see
`plans/README.md`).

## Current state

- `types/auth.ts` — the role union and all derived types.
  ```ts
  export const USER_ROLES = ["admin", "receptionist", "staff", "client"] as const
  export type UserRole = (typeof USER_ROLES)[number]
  export function normalizeRole(role: unknown): UserRole | null { /* ... */ }
  ```
  Also `AuthUser.facility_id` (may already be stale — plan 004 fixes the
  payload shape; this plan must not depend on it).
- `lib/auth/guard.ts:50-64` — `requireRole(roles: UserRole[])` normalizes the
  API role and redirects on mismatch. Reads the API, not the cookie. Keep that
  behavior; only the type changes.
- `lib/auth/redirect.ts` — `ROLE_DASHBOARDS` maps role → dashboard path.
  Currently `admin`, `receptionist`, `staff`, `client`.
- `lib/auth/route-access.ts:9` — `GATED_PREFIXES = ["/admin", "/receptionist", "/staff", "/client"]`.
- `lib/navigation.tsx` — `navigation: Record<UserRole, NavItem[]>` with keys
  `admin`, `receptionist`, `staff`, `client`; plus `roleLabels` and
  `roleDashboardPaths` maps. Uses Indonesian clinical labels (`Poli`,
  `Station`, `Kunjungan`, `Referral`) — those specific labels are plan 005's
  job; this plan only changes the *role keys* and wires navigation to a
  capability map. Do not rewrite copy here.
- `lib/admin/roles.ts:1-10` — `STAFF_ROLE_OPTIONS` with clinical values
  (`nurse`, `doctor`, `pharmacist`, `lab`, `billing`, `patient`) plus
  `normalizeStaffRole`/`staffRoleLabel`. The backend only accepts
  `UserRole::tenantValues()` in `UserController::store`
  (`Rule::in(...)`), so any of the extra values 422s.
- `components/app-sidebar.tsx:21-27` — builds nav from `normalizeRole(session.user.role)`.
- Workspace layouts and the pages that gate themselves:
  - `app/(dashboard)/admin/layout.tsx:11` → `requireRole(["admin"])`
  - `app/(dashboard)/admin/users/page.tsx:27` → `requireRole(["admin"])`
  - `app/(dashboard)/admin/visits/page.tsx:32` → `requireRole(["admin"])`
  - `app/(dashboard)/receptionist/layout.tsx:6` → `requireRole(["admin", "receptionist"])`
  - `app/(dashboard)/receptionist/dashboard/page.tsx:34`, `queue/page.tsx:6`,
    `registration/page.tsx:26` → same pair
  - `app/(dashboard)/staff/layout.tsx:6` → `requireRole(["admin", "staff"])`
  - `app/(dashboard)/client/layout.tsx:6` → `requireRole(["client"])`

Backend authorization matrix (from `backend/routes/api.php`, verified via
`php artisan route:list --json`) — this is what the frontend capability map
must mirror:

| Capability | Allowed roles |
|---|---|
| Departments/stations/workflows read | tenant_admin, facility_admin, operator, staff |
| Departments/stations/workflows write | tenant_admin, facility_admin |
| Users & invitations | tenant_admin, facility_admin |
| Audit logs | tenant_admin |
| Billing / subscription | tenant_admin |
| Facilities list & update | tenant_admin, facility_admin |
| Facilities create | tenant_admin |
| Kiosk/display devices | tenant_admin, facility_admin |
| Customers, queue sessions, tickets | any tenant role (client is scoped to self) |
| Reception queue | tenant_admin, facility_admin, operator |
| Ticket actions | tenant_admin, facility_admin, operator, staff |
| Service transfers | tenant_admin, facility_admin, staff |
| Reports summary | tenant_admin, operator (+ `basic_reports` feature) |
| Reports export | tenant_admin (+ `advanced_reports` feature) |
| Platform | platform_admin (separate guard, no tenant UI) |

Repo conventions: cap `requireRole` imports from `@/lib/auth/guard`; server
components are `async`; Indonesian UI copy with English identifiers; comments
explain *why*.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests     | `npm test`          | all pass |
| Lint      | `npm run lint`      | exit 0, 0 errors |

## Scope

**In scope**:

- `types/auth.ts`
- `lib/auth/guard.ts` (type imports only)
- `lib/auth/redirect.ts`
- `lib/auth/route-access.ts`
- `lib/navigation.tsx`
- `lib/admin/roles.ts`
- `components/app-sidebar.tsx`
- `app/(dashboard)/admin/layout.tsx`
- `app/(dashboard)/admin/users/page.tsx`
- `app/(dashboard)/admin/visits/page.tsx`
- `app/(dashboard)/receptionist/layout.tsx`
- `app/(dashboard)/receptionist/dashboard/page.tsx`
- `app/(dashboard)/receptionist/queue/page.tsx`
- `app/(dashboard)/receptionist/registration/page.tsx`
- `app/(dashboard)/staff/layout.tsx`
- `app/(dashboard)/client/layout.tsx`
- `components/admin/users/user-form-dialog.tsx` (role select only)
- `components/admin/users/user-manager.tsx` (role label only)
- `lib/auth/roles.test.ts` (create)

**Out of scope** (do NOT touch):

- `types/reception.ts`, `types/client.ts`, any `Patient*`/`Visit` type — plan 003
  and 005 own those.
- Any `lib/api/*` file — plan 003 rewrites the endpoints.
- Navigation *copy* (Indonesian labels like `Poli`, `Station`) — plan 005.
  Only the role keys and their capability gating belong here.
- The database or any file under `C:\laragon\www\kiyu` — read-only, never edited.
- Building a `/platform` UI. `platform_admin` gets `/unauthorized`; that is
  correct until a platform plan exists.

## Git workflow

- Branch: `advisor/002-role-model`
- Conventional commits (`fix(auth): ...`, `refactor(auth): ...`).
- Do NOT push or open a PR.

## Steps

### Step 1: Replace the role union and add the capability map

In `types/auth.ts`, replace `USER_ROLES` with the six API values and add a
capability map **in the same file** (single source of truth, PRD §3.3):

```ts
export const USER_ROLES = [
  "platform_admin",
  "tenant_admin",
  "facility_admin",
  "operator",
  "staff",
  "client",
] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Roles that use the tenant console (everything except the platform operator). */
export const TENANT_ROLES = [
  "tenant_admin",
  "facility_admin",
  "operator",
  "staff",
  "client",
] as const satisfies readonly UserRole[]

export type TenantRole = (typeof TENANT_ROLES)[number]

/**
 * Capabilities mirror the backend authorization matrix in
 * `backend/routes/api.php`. Route guards read this map; the API remains the
 * only authority, this only decides what to render.
 */
export const CAPABILITIES = {
  "admin.access": ["tenant_admin", "facility_admin"],
  "config.write": ["tenant_admin", "facility_admin"],
  "users.manage": ["tenant_admin", "facility_admin"],
  "facilities.create": ["tenant_admin"],
  "billing.manage": ["tenant_admin"],
  "audit.read": ["tenant_admin"],
  "devices.manage": ["tenant_admin", "facility_admin"],
  "reception.operate": ["tenant_admin", "facility_admin", "operator"],
  "tickets.operate": ["tenant_admin", "facility_admin", "operator", "staff"],
  "transfers.create": ["tenant_admin", "facility_admin", "staff"],
  "reports.summary": ["tenant_admin", "operator"],
  "reports.export": ["tenant_admin"],
  "portal.use": ["client"],
} as const satisfies Record<string, readonly TenantRole[]>

export type Capability = keyof typeof CAPABILITIES

export function hasCapability(role: UserRole | null, capability: Capability): boolean {
  return role !== null && (CAPABILITIES[capability] as readonly UserRole[]).includes(role)
}
```

Keep `normalizeRole` unchanged in behavior — it already trims/lowercases and
returns `null` for unknown values, which is now exactly right because the union
includes all six API values (`platform_admin` normalizes, and is then denied by
every tenant guard).

**Verify**: `npm run typecheck` → 0 errors so far is *not* expected (call
sites still use old role strings). Continue to Step 2 before running it.

### Step 2: Update workspace guards and redirects

- `lib/auth/guard.ts`: no logic change. Change the signature to accept
  `readonly UserRole[]` so `as const` arrays pass.
- `lib/auth/redirect.ts`: map all tenant roles:
  ```ts
  const ROLE_DASHBOARDS: Record<UserRole, string> = {
    platform_admin: "/unauthorized",
    tenant_admin: "/admin/dashboard",
    facility_admin: "/admin/dashboard",
    operator: "/receptionist/dashboard",
    staff: "/staff/dashboard",
    client: "/client/dashboard",
  }
  ```
  Keep `getRoleRedirect` returning `/unauthorized` for `null`.
- `lib/auth/route-access.ts`: `GATED_PREFIXES` stays `["/admin", "/receptionist", "/staff", "/client"]` — the paths are unchanged; only their role guards change.
- Guard call sites, exact replacements:
  - `admin/layout.tsx`, `admin/users/page.tsx`, `admin/visits/page.tsx`:
    `requireRole(["admin"])` → `requireRole(["tenant_admin", "facility_admin"])`
  - `receptionist/layout.tsx`, `receptionist/dashboard/page.tsx`,
    `receptionist/queue/page.tsx`, `receptionist/registration/page.tsx`:
    `requireRole(["admin", "receptionist"])` →
    `requireRole(["tenant_admin", "facility_admin", "operator"])`
  - `staff/layout.tsx`: `requireRole(["admin", "staff"])` →
    `requireRole(["tenant_admin", "facility_admin", "operator", "staff"])`
  - `client/layout.tsx`: unchanged (`["client"]`).

**Verify**: `npm run typecheck` → errors only in `lib/navigation.tsx`,
`lib/admin/roles.ts`, `components/app-sidebar.tsx`, `components/admin/users/*`
(they still key on old roles). Continue.

### Step 3: Rebuild the navigation table on the new roles

In `lib/navigation.tsx`:

- Change `navigation` to `Record<UserRole, NavItem[]>`. Reuse the existing
  `admin` tree for `tenant_admin`; give `facility_admin` the same tree minus
  `billing` (billing is `tenant_admin`-only per the matrix); give `operator`
  the current `receptionist` tree; keep `staff` and `client` as they are;
  `platform_admin: []`.
  Export the shared trees as consts and compose them so the tree is not
  duplicated:
  ```ts
  const adminNav = [ /* current admin tree */ ] satisfies NavItem[]
  const facilityAdminNav = adminNav.filter(/* drop the Billing item */)
  ```
  Filtering by title is brittle; instead split the billing item out of the
  literal and concatenate it only for `tenant_admin`.
- `roleLabels` / `roleDashboardPaths`: extend to all six roles
  (labels in Indonesian: `Platform`, `Admin Tenant`, `Admin Fasilitas`,
  `Operator`, `Staff`, `Klien`).
- `getNavigation` keeps `normalizeRole` + empty array on `null`.

**Verify**: `npm run typecheck` → only `lib/admin/roles.ts` and
`components/admin/users/*` remain.

### Step 4: Replace `STAFF_ROLE_OPTIONS` with the API role options

In `lib/admin/roles.ts`, replace the clinical list with the roles the backend
actually accepts for a tenant user. `UserController::store` validates against
`UserRole::tenantValues()` = tenant_admin, facility_admin, operator, staff,
client. A facility admin must not be able to grant `tenant_admin` (PRD §3.2),
so the form offers a restricted set:

```ts
/**
 * Roles an administrator may assign from the user form.
 *
 * Mirrors `UserRole::tenantValues()` minus `tenant_admin`: the canonical owner
 * is not created or re-roled through user management (PRD §3.2).
 */
export const ASSIGNABLE_ROLE_OPTIONS = [
  { value: "facility_admin", label: "Admin Fasilitas" },
  { value: "operator", label: "Operator" },
  { value: "staff", label: "Staff" },
  { value: "client", label: "Klien" },
] as const
```

Replace `staffRoleLabel(role)` with a lookup over **all** six API roles
(display must render `tenant_admin` even if it is not assignable), keeping the
existing `?? role` fallback. Delete `normalizeStaffRole` and the
`pharmacy`/`pharmacist` special case — those roles do not exist.

Update the two consumers:
- `components/admin/users/user-form-dialog.tsx`: `STAFF_ROLE_OPTIONS` →
  `ASSIGNABLE_ROLE_OPTIONS`; default `useState("receptionist")` →
  `useState("operator")`; drop `normalizeStaffRole(...)` around the initial
  value (use `user?.role ?? "operator"`).
- `components/admin/users/user-manager.tsx`: import path stays; the label
  function name may stay `staffRoleLabel`.

**Verify**: `npm run typecheck` → exit 0. `npm run lint` → 0 errors.

### Step 5: Lock the mapping with tests

Create `lib/auth/roles.test.ts`:

- Every API enum value normalizes to itself (table above) — this is the
  regression test for the lockout.
- `normalizeRole("ADMIN")`, `normalizeRole("")`, `normalizeRole(null)`,
  `normalizeRole(42)` → `null`.
- `getRoleRedirect` returns the table in Step 2 for every role and
  `/unauthorized` for `null`/garbage.
- `hasCapability("operator", "reception.operate")` → `true`;
  `hasCapability("staff", "reception.operate")` → `false`;
  `hasCapability("facility_admin", "billing.manage")` → `false`;
  `hasCapability("tenant_admin", "billing.manage")` → `true`.
- `ASSIGNABLE_ROLE_OPTIONS.map(o => o.value)` contains no `tenant_admin` and
  no `platform_admin`.

**Verify**: `npm test` → all pass, including the new file.

## Test plan

- New: `lib/auth/roles.test.ts` (normalization totality, redirect table,
  capability matrix, assignable-role restriction).
- Pattern: follow `lib/auth/session-core.test.ts` from plan 001 (dynamic
  import after env, descriptive `it` names).
- Verification: `npm test` → exit 0; `npm run typecheck` → exit 0.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0 with the new role tests passing
- [ ] `npm run lint` exits 0
- [ ] `grep -rn '"admin"\|"receptionist"' types/auth.ts lib/auth lib/navigation.tsx lib/admin/roles.ts` returns no matches
- [ ] `grep -rn "nurse\|doctor\|pharmacist\|patient" lib/admin/roles.ts` returns no matches
- [ ] No file outside the in-scope list is modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The backend enum at `C:\laragon\www\kiyu\app\Enums\UserRole.php` does not
  contain exactly the six values listed here.
- `backend/routes/api.php` role middleware disagrees with the capability matrix
  in "Current state" (re-read it and report the difference).
- A guard call site no longer matches its excerpt (drifted).
- Making the navigation table role-complete requires touching `lib/api/*`
  (it should not).
- A test reveals `normalizeRole` mutates or throws on non-string input.

## Maintenance notes

- The capability map and the backend route middleware must be kept in sync by
  review. When a backend route changes its `role:` middleware, update
  `CAPABILITIES` in the same PR.
- Plan 004 changes `AuthUser.facility_id` → `facility_ids`; it must also
  revisit `components/app-sidebar.tsx`, which reads `session.user.role`.
- Plan 005 removes the remaining clinical *copy* from the navigation; do not
  re-add labels here.
- A future `/platform` area must use a **separate** guard and shell
  (PRD §4.2C), never a tenant workspace with a wider role array.
