# Plan 003: Align every API call with the live backend routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 44df395..HEAD -- lib/api types app components hooks`
> If anything changed, diff the "Current state" excerpts against live code
> before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/002-role-model.md
- **Category**: bug
- **Planned at**: commit `44df395`, 2026-11-24

## Why this matters

The backend was refactored (`full refactor v1`, `refactor part 2`) and renamed
its domain: `clients` → `customers`, `visits` → `queue-sessions`, `referrals` →
`service-transfers`, `/clinical/call-next` → `/queue/call-next`, and removed
`/reports/visits/export-file` in favour of `/reports/queue-sessions/export-file`.

The frontend was never updated. Measured: **60 call sites** across 30 files
request endpoints that no longer exist, plus 7 server fetchers. Every one
returns 404. That kills the admin client directory, the visits list, referrals,
the customer portal's visit history, the staff workspace's call-next, and the
dashboard statistics widgets.

This plan re-points each call at the route that exists, and renames the
frontend domain types to match the API's vocabulary (`Client`→`Customer`,
`Visit`→`QueueSession`). It does **not** redesign any screen; same data, same
layout, correct URL and field names.

Verified backend routes (from `php artisan route:list --path=api --json` on
`C:\laragon\www\kiyu`) that replace the dead ones:

| Old (frontend, 404) | Live (backend) | Notes |
|---|---|---|
| `GET/POST /clients` | `GET/POST /customers` | `CustomerController` |
| `GET/PUT /clients/{id}` | `GET/PUT /customers/{id}` | |
| `GET /clients/statistics` | `GET /customers/statistics` | returns `{ total }` |
| `GET /clients/{id}/visits` | `GET /customers/{id}/queue-sessions` | |
| `GET /visits` | `GET /queue-sessions` | filters: `department_id`, `status`, `customer_id`, `intake_channel`, `date` |
| `GET /visits/{id}` | `GET /queue-sessions/{id}` | |
| `PATCH /visits/{id}/priority` | `PATCH /queue-sessions/{id}/priority` | |
| `POST /visits/{id}/cancel` | `POST /queue-sessions/{id}/cancel` | |
| `GET /visits/statistics` | `GET /queue-sessions/statistics` | filters: `date`, `status`, `department_id` |
| `POST /referrals` | `POST /service-transfers` | |
| `GET /referrals` | `GET /service-transfers` | |
| `GET /referrals/{id}` | `GET /service-transfers/{id}` | |
| `POST /clinical/call-next` | `POST /queue/call-next` | body `{ station_id, assigned_to }`; roles tenant_admin..staff |
| `POST /reports/visits/export-file` | `POST /reports/queue-sessions/export-file` | tenant_admin + `advanced_reports` |
| `GET /{token}/track` (visit tracking) | `GET /queue-sessions/{token}/track` | public, throttled 60/min |

Customer field contract (verified in `backend/app/Http/Controllers/Api/CustomerController.php`
and the `customers` migration): the write payload accepts **only**
`name` (required), `phone`, `email`, `address`, `user_id`. There is **no**
`nik`, `mrn`, `date_of_birth`, or `gender` column. Sending them changes nothing
(Laravel ignores unknown keys) but the UI shows fields the product does not
store — plan 005 deletes the fields; this plan only stops *reading* them so
nothing breaks.

Repo conventions: server fetchers live in `lib/api/*-server.ts` (import
`server-only`), browser fetchers in `lib/api/*.ts` (`"use client"`), all going
through `serverApiFetch` / `apiFetch`. `getApiErrorMessage` is the error
convention. Table filters use `parseTableParams` + `toQuery`.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests     | `npm test`          | all pass |
| Lint      | `npm run lint`      | exit 0, 0 errors |

## Scope

**In scope**:

- `lib/api/admin.ts`, `lib/api/admin-server.ts`
- `lib/api/clients.ts`, `lib/api/clients-server.ts`
- `lib/api/reception.ts`, `lib/api/reception-server.ts`
- `lib/api/staff.ts`, `lib/api/staff-server.ts`
- `lib/api/visit-tracking.ts`
- `types/reception.ts`, `types/admin.ts`, `types/client.ts`, `types/staff.ts`
- Pages under `app/(dashboard)/admin/{clients,visits,referrals,dashboard,reports}/`
- Pages under `app/(dashboard)/client/{dashboard,visits,booking,profile}/`
- `app/client/onboarding/page.tsx`
- Pages under `app/(dashboard)/receptionist/{clients,dashboard}/`
- Components under `components/admin/{clients,visits,referrals}/`,
  `components/receptionist/{clients,client}/`, `components/client/`,
  `components/staff/`, `components/visit-tracking/`
- `app/track/[token]/page.tsx` (path unchanged; only the API URL changes)
- `lib/api/routes.test.ts` (create)

**Out of scope** (do NOT touch):

- Any file in `C:\laragon\www\kiyu` — read-only. Do **not** add a backend
  route, alias, or compatibility shim.
- Deleting the clinical *fields* from forms (`nik`, `mrn`, `gender`,
  `date_of_birth`) and the clinical role labels — plan 005. Here you only stop
  the compile from depending on them (make them optional / read defensively).
- Route paths in `app/` (`/admin/visits`, `/admin/clients`, …). PRD route maps
  are a separate decision; this plan changes API URLs, not page URLs. Page
  renames are plan 005.
- The `facility_id` / `department_id` session-shape fix — plan 004.

## Git workflow

- Branch: `advisor/003-api-alignment`
- One commit per API domain (customers, queue-sessions, service-transfers,
  call-next, reports, tracking) keeps the diff reviewable.
- Conventional commits. Do NOT push or open a PR.

## Steps

Work domain by domain. After each step the app must typecheck.

### Step 1: Customers (was "clients")

1. In `types/reception.ts`, keep the `Client` type but make it match the
   backend: `{ id, tenant_id, user_id?, name, phone?, email?, address?,
   created_at?, updated_at? }`. Remove `nik`, `mrn`, `date_of_birth`,
   `gender` from the type **only if** all readers are updated in this step;
   otherwise keep them optional (`?: string | null`) and leave the deletion to
   plan 005. Prefer keeping them optional here to keep the diff bounded.
2. `lib/api/admin-server.ts`: `getClientsServer` → fetch `/customers`;
   `getClientStatisticsServer` → `/customers/statistics`.
3. `lib/api/reception-server.ts`: `getClientsTableServer` → `/customers`;
   `getClientCountServer` → `/customers/statistics`.
4. `lib/api/reception.ts` and `lib/api/admin.ts` and `lib/api/clients.ts`: all
   `/clients` → `/customers`.

**Verify**: `npm run typecheck` → 0 errors; `grep -rn '"/clients' lib/` → no matches.

### Step 2: Queue sessions (was "visits")

1. `types/reception.ts`: add a `QueueSession` type with the fields the
   backend actually returns for `/queue-sessions`: `id`, `session_number`,
   `status` (`QueueSessionStatus`), `priority`, `intake_channel`,
   `customer_id`, `department_id`, `workflow_id`, `created_at`,
   `completed_at`, plus `customer?`, `department?`, `workflow?`. Keep the
   existing `Visit`/`VisitDetail` names as **deprecated aliases**
   (`export type Visit = QueueSession`) so this plan does not have to rename
   every component prop. Plan 005 deletes the aliases.
2. Re-point every fetcher:
   - `/visits` → `/queue-sessions`
   - `/visits/statistics` → `/queue-sessions/statistics`
   - `/visits/{id}` → `/queue-sessions/{id}`
   - `/visits/{id}/priority` → `/queue-sessions/{id}/priority`
   - `/visits/{id}/cancel` → `/queue-sessions/{id}/cancel`
   - `/customers/{id}/visits` → `/customers/{id}/queue-sessions`
   - `?client_id=` → `?customer_id=`
3. `app/(dashboard)/client/dashboard/page.tsx` and
   `app/(dashboard)/client/visits/page.tsx`: `getClientVisitsServer` now hits
   `/queue-sessions?customer_id=...`.
4. `app/(dashboard)/admin/visits/page.tsx`: it passes
   `SORTABLE = ["status", "priority", "created_at", "id"]`; the backend
   allowlists the same names for `/queue-sessions`, so no change needed there.

**Verify**: `npm run typecheck` → 0 errors; `grep -rn '"/visits' lib app components` → no matches; `grep -rn 'client_id=' lib` → no matches.

### Step 3: Service transfers (was "referrals")

1. `lib/api/admin.ts`: `/referrals` → `/service-transfers` (POST, GET, GET by id).
2. `lib/api/admin-server.ts`: `getReferralsServer` → `/service-transfers`.
3. `types/admin.ts`: keep `Referral` as an alias of a `ServiceTransfer` type;
   the backend exposes `target_department_id`, `status`, `priority`, `reason`
   — check `backend/app/Http/Controllers/Api/ServiceTransferController.php`
   before changing field names. If a field differs, adjust the type, not the
   component props.
4. The referral page's filters (`target_department_id`, `status`) are accepted
   by the backend — keep them.

**Verify**: `npm run typecheck`; `grep -rn '"/referrals' lib app components` → no matches.

### Step 4: Call-next and ticket actions

1. `lib/api/staff.ts:41`: `"/clinical/call-next"` → `"/queue/call-next"`
   (body `{ station_id, assigned_to }` is correct — the backend accepts both).
2. Confirm the ticket action routes (`/tickets/{id}/start|hold|resume|complete|skip|no-show|cancel|transfer`) all exist — they do, so no change.
3. `lib/api/staff-server.ts`: check for `/clinical` and replace likewise.

**Verify**: `npm run typecheck`; `grep -rn "/clinical" lib app components` → no matches.

### Step 5: Reports and tracking

1. `lib/api/admin.ts`: `/reports/visits/export-file` →
   `/reports/queue-sessions/export-file`. Response is a generated file
   reference; keep the existing `ReportExport` handling but verify the key
   names against `ReportController::exportFile`.
2. `lib/api/visit-tracking.ts`: `/visits/{token}/track` →
   `/queue-sessions/{token}/track`. The public route needs no auth header —
   keep `credentials: "omit"`.
3. `types/visit-tracking.ts`: rename `TrackingVisitStatus` values only if the
   backend enum differs (`QueueSessionStatus` = AWAITING_CHECKIN, WAITING,
   IN_PROGRESS, COMPLETED, CANCELLED — matches today's list; no change).

**Verify**: `npm run typecheck`; `grep -rn "reports/visits\|/visits/.*track" lib` → no matches.

### Step 6: Lock the URL map with a test

Create `lib/api/routes.test.ts` that asserts **no fetch path in the codebase
points at a retired route**. Implement it as a source scan (cheap, no network):

```ts
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOTS = ["lib", "app", "components", "hooks"]
const RETIRED = [
  "/clients",          // use /customers
  "/visits",           // use /queue-sessions
  "/referrals",        // use /service-transfers
  "/clinical/",        // use /queue/
  "/reports/visits/",  // use /reports/queue-sessions/
]
// walk ROOTS, read *.ts/tsx, collect lines containing a fetch path
// (template literals starting with `/` or "apiFetch(..."), assert none
// contains a RETIRED prefix.
```

Be careful to exclude the word `clients` in comments and `use-client-*` file
names — match only a `/`-prefixed literal inside `apiFetch`/`serverApiFetch`/
`fetch(` call lines. If that proves too fuzzy, an allowlist of the exact
strings found is acceptable as long as it asserts the retired ones are gone.

**Verify**: `npm test` → all pass, including `routes.test.ts`.

## Test plan

- New `lib/api/routes.test.ts` — the regression guard against a future
  rename that re-breaks 60 call sites.
- Re-run the plan-001 auth tests to confirm nothing in the guard chain moved.
- Manual smoke (record the commands you ran and what you saw): start the API
  (`cd C:\laragon\www\kiyu && php artisan serve` if a dev server is not already
  running) and the frontend (`npm run dev`), log in with the seeded
  `operator@kiyu.id` account, and confirm the reception queue page loads
  instead of erroring. If you cannot start the stack, say so in the report
  rather than claiming a pass.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0, `lib/api/routes.test.ts` passes
- [ ] `npm run lint` exits 0
- [ ] `grep -rnE '"/clients|"/visits|"/referrals|"/clinical|/reports/visits' lib app components hooks` returns no matches
- [ ] No files under `C:\laragon\www\kiyu` modified (`git -C C:\laragon\www\kiyu status --short` is empty)
- [ ] No file outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- A replacement route above is missing from
  `php artisan route:list --path=api`. Report the missing route; do not invent
  a different one.
- The backend response shape for `/customers`, `/queue-sessions`, or
  `/service-transfers` differs from the fields listed here in a way that needs a
  component change larger than a field rename (e.g. a nested object where the
  UI expects a flat one). Report the shape and stop.
- Re-pointing a fetcher requires changing a page's URL path.
- `types/client.ts` turns out to be consumed by kiosk code with a different
  shape (`types/kiosk.ts`) — report and stop rather than merging the two models
  blind.
- You are tempted to add a backend alias route. That is out of scope; report
  the gap instead.

## Maintenance notes

- When the backend adds a new list endpoint, add it to `lib/api/*-server.ts`
  and update `lib/api/routes.test.ts`'s retired list only when a route is
  actually removed.
- Plan 004 depends on `getCustomersServer`/`getQueueSessionsServer` being the
  canonical names; keep them.
- Plan 005 deletes the `Patient*`/`Visit` aliases and the clinical form fields
  this plan deliberately kept optional.
- Reviewer should diff the per-domain commits separately and confirm each
  `npm run typecheck` was green between them.
