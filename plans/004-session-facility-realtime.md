# Plan 004: Fix session claims, facility context, and realtime channels

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 44df395..HEAD -- lib/auth lib/api types app/(dashboard) components/realtime lib/echo.ts`
> If anything changed, diff the "Current state" excerpts against live code
> before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/002-role-model.md, plans/003-api-alignment.md
- **Category**: bug
- **Planned at**: commit `44df395`, 2026-11-24

## Why this matters

Three separate mismatches, all of which silently produce blank or frozen UI:

1. **The session claims do not match the `/auth/me` payload.** The backend's
   `AuthController::userPayload()` returns
   `{ id, name, email, role, tenant_id, facility_ids: number[], station_id, profile }`.
   It does **not** return `facility_id` or `department_id`. The frontend reads
   `user.facility_id` in 5 places and `user.department_id` in 6 — always
   `null`. Result: the reception and staff queues receive `facilityId={null}`,
   the department picker gets no default, the ticket-queue page loads
   department-less, and there is no facility switcher at all (PRD §4.3 requires
   one for users with multiple assignments).

2. **`facility.id` is only half-applied.** Even the one field the backend
   *does* send (`facility_ids`) is unused. The frontend has no way to pass a
   chosen facility to the API. The backend's facility selector header is
   `X-Facility-Id` (`ResolveFacility.php`), but no frontend proxy adds it.

3. **Realtime channels are misnamed, so dashboards never refresh.**
   `components/realtime/live-refresh.tsx:31-32` subscribes to `department.{id}`
   and `station.{id}`. The backend broadcasts private channels named
   `tenant.{tenantId}.department.{departmentId}` and
   `tenant.{tenantId}.station.{stationId}` (`backend/app/Events/QueueUpdated.php:35-45`,
   `routes/channels.php`). The reception/staff hooks correctly use
   `public.facility.{id}`; only the server-rendered dashboards are broken.

After this plan: the session carries the backend's real fields, a user with
one facility is auto-selected, a user with several sees a selector that sends
`X-Facility-Id`, and every live surface listens on a channel that exists.

> **Backend caveat (read before starting).** `ResolveFacility` is registered but
> not applied to any route, so in a tenant with **two or more** active
> facilities every facility-scoped call still returns 403 at
> `Controller::facility()` regardless of headers. This plan builds the correct
> client side; it cannot make those routes work until the backend applies the
> middleware. Record that in your report — do not paper over it. Single-facility
> tenants (the seeded default) work end to end.

## Current state

- `lib/auth/verify.ts:10-51` — `VerifiedUser` and `toVerifiedUser()`:
  ```ts
  export type VerifiedUser = {
    id: number; name: string; email: string; role: string
    tenant_id?: number | null
    facility_id?: number | null      // backend never sends this
    department_id?: number | null    // backend never sends this
    station_id?: number | null
  }
  ```
  Mapping at `:47-50` reads `data.facility_id`, `data.department_id`.
- `types/auth.ts` — `AuthUser` mirrors the same wrong shape (`:32-36`), and
  `toSessionUser()` (`:46-57`) copies it.
- `lib/actions/auth.ts` — `createSession(credentials.token, toSessionUser(credentials.user))`
  stores the claims snapshot in the signed cookie.
- `lib/auth/guard.ts:76-91` — `fallbackToCookieUser()` rebuilds the same shape
  from the cookie when the API is unreachable.
- Consumers reading the missing fields:
  - `app/(dashboard)/receptionist/queue/page.tsx:12-13` — `user.department_id`, `user.facility_id`
  - `app/(dashboard)/receptionist/dashboard/page.tsx:37` — `user.department_id`
  - `app/(dashboard)/receptionist/registration/page.tsx:41` — `user.department_id`
  - `components/staff/queue-page.tsx:16-18` — `session.user.station_id`, `department_id`, `facility_id`
  - `components/staff/staff-dashboard.tsx:129` — `session.user.department_id`
  - `components/admin/users/user-form-dialog.tsx:68` — `user?.department_id`
- `lib/api/client.ts:9-14` — the browser proxy fetch. No custom headers.
- `app/api/backend/[...path]/route.ts:36-52` — the server proxy. Sets `Accept`,
  `Authorization`; **does not** forward any facility header.
- `lib/echo.ts:46-49` — `publicFacilityChannel(id)` = `public.facility.${id}`.
- `components/realtime/live-refresh.tsx:29-33`:
  ```ts
  const channels: string[] = []
  if (departmentId) channels.push(`department.${departmentId}`)
  if (stationId) channels.push(`station.${stationId}`)
  ```
- `hooks/use-reception-queue.ts:148`, `hooks/use-staff-queue.ts:141` — already
  use `publicFacilityChannel(...)`. Correct; leave them.

Repo conventions: context belongs in a small server helper + a client
provider, mirroring `components/providers/theme-provider.tsx`. Preserve the
"API is authoritative, cookie is a claim" doctrine in `lib/auth/guard.ts`'s
comments.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests     | `npm test`          | all pass |
| Lint      | `npm run lint`      | exit 0, 0 errors |

## Scope

**In scope**:

- `lib/auth/verify.ts`, `lib/auth/guard.ts`, `lib/auth/session.ts`,
  `lib/auth/session-core.ts` (shape only)
- `types/auth.ts`
- `lib/actions/auth.ts`
- `lib/api/client.ts`, `lib/api/server.ts`
- `app/api/backend/[...path]/route.ts`
- `lib/echo.ts`, `components/realtime/live-refresh.tsx`
- `components/app-sidebar.tsx` (read the new shape)
- `components/facility-switcher.tsx` (create)
- `components/providers/facility-provider.tsx` (create)
- `app/(dashboard)/layout.tsx` (mount the provider/switcher)
- The six consumers listed above
- `lib/auth/verify.test.ts` (create), `lib/facility/context.test.ts` (create)

**Out of scope** (do NOT touch):

- `C:\laragon\www\kiyu` — read-only. Do not add `facility` middleware or any
  backend route.
- `hooks/use-reception-queue.ts` / `hooks/use-staff-queue.ts` channel names —
  they are already correct.
- The `public-display`/`use-public-queue.ts` path — it uses the device
  credential and is unaffected.
- Role/capability logic — plan 002 owns it.
- Page URLs and Indonesian copy — plan 005.

## Git workflow

- Branch: `advisor/004-context-and-realtime`
- Commit per concern (session shape / facility selector / realtime channel).
- Conventional commits. Do NOT push or open a PR.

## Steps

### Step 1: Make `VerifiedUser` match the real payload

1. `lib/auth/verify.ts`: replace the type and mapper with the backend shape:
   ```ts
   export type VerifiedUser = {
     id: number
     name: string
     email: string
     role: string
     tenant_id: number | null
     facility_ids: number[]
     station_id: number | null
     profile?: unknown
   }
   ```
   In `toVerifiedUser`, read `data.facility_ids` as `number[]` (default `[]`),
   `tenant_id`/`station_id` via the existing `optionalNumber` helper. Do **not**
   read `department_id`/`facility_id`. Add a comment stating the backend field
   name is `facility_ids` and that the frontend must not invent singular
   aliases.
2. `types/auth.ts`: apply the same change to `AuthUser` and `toSessionUser`
   (drop `facility_id`/`department_id`, add `facility_ids: number[]`).
3. `lib/auth/guard.ts`: update `fallbackToCookieUser()` to the new shape.
4. Update every consumer in "Current state":
   - Reception/staff pages: `facility_id` → the selected facility id from the
     new context (Step 3); `department_id` → derive from the selected facility's
     department **only if** the page already had a department concept. The
     backend's station/user model has no `department_id` on the user; a staff
     user's working station is `station_id`, and a station carries
     `department_id`. So: use `station?.department_id` from the station options
     fetch, not from the session. If a page cannot derive it without an extra
     fetch, pass `null` and show the department picker instead of guessing.

**Verify**: `npm run typecheck` → 0 errors; `grep -rn "user.facility_id\|user.department_id" app components lib` → no matches.

### Step 2: Carry the facility choice through both API paths

1. Create `lib/facility/context.ts` (server-safe, no `server-only`):
   ```ts
   export const FACILITY_HEADER = "X-Facility-Id"

   /** Validates a raw value against the user's reachable facilities. */
   export function resolveFacilityId(raw: unknown, facilityIds: readonly number[]): number | null {
     const parsed = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN
     return Number.isInteger(parsed) && facilityIds.includes(parsed) ? parsed : null
   }

   /** Reads the stored selection from a cookie value. */
   export function chooseFacility(facilityIds: readonly number[], stored: unknown): number | null {
     if (facilityIds.length === 0) return null
     if (facilityIds.length === 1) return facilityIds[0]   // auto-select only when unambiguous
     return resolveFacilityId(stored, facilityIds)         // never fall back to the first of many
   }
   ```
   The "never silently pick the first of several" rule is PRD §2.4 — encode it in
   the comment.
2. `lib/api/client.ts`: add the header when a selection exists. Read it from a
   module-level setter that the provider populates:
   ```ts
   let activeFacilityId: number | null = null
   export function setActiveFacilityId(id: number | null) { activeFacilityId = id }
   // inside apiFetch headers:
   ...(activeFacilityId !== null ? { "X-Facility-Id": String(activeFacilityId) } : {}),
   ```
3. `app/api/backend/[...path]/route.ts`: forward an incoming `X-Facility-Id`
   header only after validating it is a positive integer; drop it otherwise.
   Never forward a client-supplied value verbatim without that check.
4. `lib/api/server.ts`: accept an optional `facilityId` in `init` and set the
   same header. Server components resolve the id from the cookie
   (Step 3) rather than a client store.

**Verify**: `npm run typecheck`; `npm test` (add the context test in Step 5).

### Step 3: Add the facility selector

1. `components/providers/facility-provider.tsx` (`"use client"`): holds
   `{ facilityIds, activeId, setActive }`; on mount calls
   `setActiveFacilityId(activeId)` from `lib/api/client.ts`. On change,
   `router.refresh()` so server components refetch for the new facility, and
   clears any facility-scoped client state (PRD §4.3: "clear facility-scoped
   cached data").
2. `components/facility-switcher.tsx` (`"use client"`): renders a `Select`
   (existing component) when `facilityIds.length > 1`; renders the single
   facility name as static text when exactly one; renders nothing when zero.
   Fetch the facility **names** from `GET /facilities` (plan 003 route) — the
   list endpoint already returns tenant facilities the user may see.
3. `app/(dashboard)/layout.tsx`: resolve the initial context server-side
   (user from `getVerifiedUser()`, stored choice from a `kiyu_facility` cookie)
   and wrap `<AppSidebar/>` + children in the provider; place the switcher in
   the sidebar header or `SiteHeader`. Keep the existing layout structure.
4. The selected id must also be readable by server components:
   `getFacilityContext()` in `lib/facility/context.ts` reads the cookie via
   `next/headers` and validates against the verified user's `facility_ids`.

**Verify**: `npm run typecheck`; manual: with the seeded single-facility tenant
the switcher shows a static name; no header is sent for a second facility
(none exists). State that you checked, or say you could not.

### Step 4: Fix the realtime channel names

`components/realtime/live-refresh.tsx`: the component needs `tenantId` in
addition to department/station. Change the props to
`{ tenantId, departmentId?, stationId? }` and build:

```ts
if (tenantId && departmentId) channels.push(`tenant.${tenantId}.department.${departmentId}`)
if (tenantId && stationId) channels.push(`tenant.${tenantId}.station.${stationId}`)
```

These are **private** channels, so subscribe with `echo.private(name)` — not
`echo.channel(name)` — and pass the event name **without** the leading dot
(`"queue.updated"`), because private-channel event names are not prefixed.

Then update the two callers to pass `tenantId`:
- `app/(dashboard)/receptionist/dashboard/page.tsx:71`
- `components/staff/staff-dashboard.tsx:128`

Both already have the verified user; `tenant_id` is now on the new shape.

> If `echo.private()` fails because the backend does not expose
> `/broadcasting/auth` (verified: `routes/api.php` and `bootstrap/app.php` do
> not register broadcasting auth), then the private channels cannot be
> subscribed at all today. In that case: keep the component on
> `public.facility.{facilityId}` — which the backend *does* broadcast and which
> the hooks already use — and change the props to `{ facilityId }` instead.
> Record in your report which branch you took and why. Do **not** add a
> backend route.

**Verify**: `npm run typecheck`; `grep -n "department\.\${" components/realtime/live-refresh.tsx` → either the tenant-namespaced form or no match at all (if you took the public-channel branch).

### Step 5: Tests

Create `lib/auth/verify.test.ts`:
- `toVerifiedUser` maps `facility_ids: [2, 5]` → `[2, 5]`.
- Missing/invalid `facility_ids` → `[]` (never throws).
- `tenant_id`/`station_id` non-numbers → `null`.
- A payload carrying the *old* `facility_id` singular is ignored (regression
  guard for the removed field).

Create `lib/facility/context.test.ts`:
- `chooseFacility([7], null)` → `7` (auto-select single).
- `chooseFacility([7, 9], null)` → `null` (never guess among several).
- `chooseFacility([7, 9], "9")` → `9`; `"12"` → `null`; `"abc"` → `null`.
- `resolveFacilityId("5", [5])` → `5`; `resolveFacilityId("-1", [5])` → `null`.

**Verify**: `npm test` → all pass.

## Test plan

- New: `lib/auth/verify.test.ts`, `lib/facility/context.test.ts`.
- Pattern: plan 001's colocated `*.test.ts` with dynamic import after env.
- Manual: state which branch of Step 4 you took and why; if you could run the
  dev server, report the receptionist dashboard's connection state.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0, new files pass
- [ ] `npm run lint` exits 0
- [ ] `grep -rn "facility_id\b" lib/auth types app components hooks` → no matches (singular is gone; `facility_ids` and `facilityId` are fine)
- [ ] `grep -rn '`department\.\${' components/realtime/live-refresh.tsx` → no match
- [ ] No files under `C:\laragon\www\kiyu` modified
- [ ] No file outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `backend/app/Http/Controllers/Api/AuthController.php` `userPayload()` no
  longer returns `facility_ids` (re-read it; report the actual keys).
- `ResolveFacility.php` reads a different header than `X-Facility-Id`.
- `echo.private()` is chosen but `/broadcasting/auth` is unreachable **and**
  the public-facility fallback is not viable — report rather than inventing a
  channel.
- Deriving a page's department requires an API field that does not exist —
  report the page and the missing field.
- The provider cannot be mounted without restructuring `app/(dashboard)/layout.tsx`
  beyond wrapping.

## Maintenance notes

- The `kiyu_facility` cookie is a UI preference, never authorization. Every
  request is still authorized by the API; the header only selects context.
- When the backend finally applies `middleware('facility')` to its routes,
  verify the multi-facility flow end to end and delete the caveat at the top of
  this plan from `FRONTEND_API_GAPS.md`.
- Any new context dimension (e.g. a tenant-wide "all facilities" view for
  tenant_admin) extends `lib/facility/context.ts`; keep the validation rule
  ("only ids the verified user can reach") in one place.
