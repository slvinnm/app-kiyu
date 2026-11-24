# FRONTEND_API_GAPS

PRD §15 item 3. Backend capabilities that are missing, incompatible, or unsafe
for the frontend, with the proposed contract and the approval question each
needs. No backend file was changed.

Format: gap → evidence → proposed contract → approval question.

---

## G-1 — Facility selection middleware is dead code (blocks multi-facility tenants)

> **RESOLVED 2026-11-24.** `facility` middleware is now applied to the
> facility-scoped routes and `ResolveFacility` treats an explicit
> `X-Facility-Id` as authoritative. Device creation accepts an explicit
> `facility_id`. 11 new backend tests cover the contract; 236/236 pass. See
> `BACKEND_CHANGELOG.md` §1–§3. The frontend still has to *send* the header —
> plan `plans/004-session-facility-realtime.md`.

**Evidence (historical)**

- `backend/app/Http/Middleware/ResolveFacility.php` implements the
  `X-Facility-Id` contract and is aliased as `facility`
  (`backend/bootstrap/app.php:28`).
- `grep -c "middleware('facility')" backend/routes/api.php` → **0**. No route
  uses it.
- `backend/app/Http/Controllers/Controller.php:75-84` — `facility()` aborts
  403 when no facility is bound, and `ResolveTenant::resolveFacility()`
  (`backend/app/Http/Middleware/ResolveTenant.php:48-66`) only binds one when
  the user can reach **exactly one** facility.

**Impact**

Any tenant with ≥2 active facilities: every facility-scoped route (departments,
stations, reception, intake, kiosk device create) returns
`403 "No facility is resolved for this request."` for facility_admin, operator,
and staff. The frontend cannot fix this; sending the header is ignored because
the middleware never runs.

**Proposed change (backend task)**

```php
// routes/api.php, inside the auth:sanctum + tenant group
Route::middleware(['facility'])->group(function () {
    // departments, stations, workflows, reception, intake, kiosk-devices,
    // display-devices, customers, queue-sessions, tickets, reports
});
```

`ResolveFacility` already validates tenant membership and assignment, so
applying it is additive. Frontend plan `plans/004-session-facility-realtime.md`
sends `X-Facility-Id` for both the browser and server proxies.

**Approval question**

> Should `facility` middleware be applied to the tenant route group so
> multi-facility tenants work? This is a one-line route change with no
> migration. Until it lands, the frontend selector is built but unused in
> tenants with more than one facility.

**Blocker:** yes — blocks acceptance criterion 7 (multi-facility) and 9.

---

## G-2 — Public registration has no tenant locator

**Evidence**

- `POST api/auth/register` is in the `public-tenant` group
  (`backend/routes/api.php:49-50`).
- `ResolvePublicTenant` resolves the tenant from `X-Kiosk-Token`,
  `X-Tenant-Slug`, the `{tenant}` route parameter, or the request host
  (`backend/app/Http/Middleware/ResolvePublicTenant.php:30-60`).
- `frontend/lib/actions/auth.ts:147` posts with only `Accept` and
  `Content-Type`. No slug header; the app has no host-based tenant resolution.

**Impact**

`POST /auth/register` returns `404 "Tenant not specified."` for everyone.
`/signup` is a dead end. This is PRD §6.3 (tenant user public registration).

**Proposed contract**

Add a host-resolution step: read the tenant from `Host`
(`{slug}.kiyu.id`), or, in development, from an `X-Tenant-Slug` env default.
Then `lib/actions/auth.ts` must forward the resolved slug in the header. This is
a **product decision** (which host serves which app), not a code fix.

**Approval question**

> Which mechanism selects the tenant for `app-kiyu.test` in development, and is
> the tenant slug part of `Host` in production? The PRD (§2.4, §4.3) says the
> tenant host serves the app; the frontend needs the exact dev equivalent
> before registration can be wired.

**Blocker:** yes — blocks acceptance criteria 10, 15.

---

## G-3 — Realtime private channels cannot be authorized

> **CORRECTED 2026-11-24 — this was a false finding.** `/broadcasting/auth` is
> registered (`BroadcastController@authenticate`, auto-wired because
> `bootstrap/app.php` passes `channels:`). The private channels *are*
> authorizable at the framework level. The real constraint is that Echo cannot
> attach the Sanctum bearer token, which lives in an HttpOnly cookie the browser
> JS cannot read. The public `public.facility.{id}` channel is therefore the
> correct and only viable path for the frontend today. No backend change
> required; no approval needed.

**Original evidence**

- `backend/app/Events/QueueUpdated.php:35-45` broadcasts on
  `PrivateChannel("tenant.{tenantId}.department.{departmentId}")` and
  `PrivateChannel("tenant.…station.…")`.
- `backend/routes/channels.php` defines the authorization callbacks.
- `backend/routes/api.php` and `backend/bootstrap/app.php` register **no**
  `/broadcasting/auth` route (`grep -rn "withBroadcasting\|Broadcast::routes"`
  → no matches).

**Impact**

`echo.private("tenant.…")` has no auth endpoint to call, so subscription fails
and the socket never marks connected. The public `public.facility.{id}` channel
works (no auth) and is what the queue hooks already use.

**Proposed change**

Either (a) register `Broadcast::routes()` and the Sanctum guard so private
channels authorize, or (b) document that the operator dashboards intentionally
use the public facility channel and delete the private-channel events.

**Approval question**

> Are the department/station private channels intended for production, or is
> the public facility channel the only supported realtime path? Plan 004
> defaults to the public channel until this is answered.

**Blocker:** no — plan 004 has a documented fallback.

---

## G-4 — `/auth/me` payload shape differs from the frontend's claim model

**Evidence**

- `backend/app/Http/Controllers/Api/AuthController.php:170-186`
  `userPayload()` returns `{ id, name, email, role, tenant_id, facility_ids,
  station_id, profile }`.
- `frontend/lib/auth/verify.ts:10-51` reads `facility_id` and
  `department_id` — both absent. `users` table has no `department_id`
  (`backend/database/migrations/2026_10_28_060000_create_kiyu_domain_schema.php:88-102`).

**Impact**

Reception and staff queues get `facilityId = null`; department defaults are
always null.

**Resolution:** frontend-only. Plan 004 adopts `facility_ids` and derives the
department from the selected station. **No backend change requested.**

**Approval question:** none — the frontend is wrong, not the API.

---

## G-5 — Station type enum rejects the UI's values

**Evidence**

- `backend/app/Enums/StationType.php` — `INTAKE`, `SERVICE`, `CASHIER`,
  `COUNTER`.
- `backend/app/Http/Controllers/Api/StationController.php:26,70,107,160` —
  `Rule::enum(StationType::class)`.
- `frontend/lib/reception/format.ts:40-47` and
  `components/admin/stations/station-form-dialog.tsx:35-36` offer
  `REGISTRATION`, `NURSE`, `DOCTOR`, `LABORATORY`, `PHARMACY`, `BILLING`.

**Impact**

Creating or updating a station from the UI returns 422 for every value.

**Resolution:** frontend-only. Plan 005 replaces the union and labels.

**Approval question:** none — the frontend must match the API.

---

## G-6 — User form posts fields the API rejects

**Evidence**

- `backend/app/Http/Controllers/Api/UserController.php:84-92` — accepts
  `name`, `email`, `password`, `role` (in `UserRole::tenantValues()`),
  `station_id`, `facility_ids[]`.
- `frontend/components/admin/users/user-form-dialog.tsx:145-152` — posts
  `department_id`, and the role select offers `nurse`/`doctor`/… .

**Impact**

422 on create/update; a facility admin cannot be assigned facilities from the
UI at all (no `facility_ids` control exists).

**Resolution:** frontend-only. Plans 002 and 003 replace the role options and
align the payload. **A facility-assignment control is still missing** —
see G-7.

**Approval question:** none for the payload; see G-7 for the missing control.

---

## G-7 — Facility assignment UI does not exist

**Evidence**

- Backend: `GET/POST/DELETE api/users/{userId}/facilities` and
  `facility_ids` on user create/update
  (`backend/routes/api.php`, `FacilityAssignmentController`).
- Frontend: no component or fetcher references
  `users/{id}/facilities` or `facility_ids` (`grep` returns nothing).

**Impact**

PRD §4.2B and acceptance criterion 9 (facility assignment) cannot be met from
the UI. A facility_admin cannot be scoped to a facility.

**Proposed frontend contract**

Add a facility multi-select to the user form, POSTed as `facility_ids: number[]`.
Visible only for `facility_admin`, `operator`, `staff` (the roles
`UserRole::facilityScopedRoles()`). Hidden for `tenant_admin` (implicit access)
and `client`.

**Approval question**

> Should the facility assignment control be built into the existing user dialog,
> or as a separate "Assigned facilities" section on the user detail page? Both
> are supported by the API; the PRD (§4.2B) suggests the user list shows an
> assignment summary and the detail page manages it.

**Blocker:** no — a frontend follow-up plan can be written once answered.

---

## G-8 — Invitation UI is absent

**Evidence**

- Backend: `GET/POST api/invitations`, `DELETE api/invitations/{id}`,
  `POST api/auth/register/invitation`.
- Frontend: no route, component, or fetcher references `invitations`.

**Impact**

PRD §6.4 and acceptance criterion 15 (invitation acceptance under tenant
policy) unaddressed. Users can only be created with a password chosen by an
admin, which is not the invited flow.

**Approval question**

> Who may invite which roles? The backend already restricts
> (`InvitationController::guardRoleEscalation`) and requires ≥1 facility for
> facility-scoped roles. The frontend needs the route map:
> `/invitations` (list) in the admin console and `/invitations/accept?token=`
> on the tenant host. Confirm both.

**Blocker:** no — new feature, separate plan.

---

## G-9 — Platform administration has no contract for most PRD pages

**Evidence**

- Present: `GET/POST api/platform/tenants`, `GET api/platform/tenants/{id}`,
  `GET/POST api/platform/plans`, and
  `api/platform/tenants/{tenant}/manage/*` (users, customers, facilities,
  kiosk-devices, queue-sessions, audit-logs).
- Missing: platform payments, platform audit log, tenant plan/entitlement
  write, support-session start/stop, platform users.

**Impact**

PRD §4.2C pages (`/platform/payments`, `/platform/audit-logs`,
`/platform/support`, `/platform/users`) cannot be built.

**Approval question**

> Should the platform area ship with the routes that exist today (tenants,
> plans, per-tenant support management) and defer payments/audit/platform-users
> until backend endpoints exist? The PRD lists the deferred pages as required;
> the backend does not expose them.

**Blocker:** yes — for the deferred pages only.

---

## G-10 — Tenant timezone is hardcoded

**Evidence**

- `frontend/lib/admin/date.ts:5-13` — `Asia/Jakarta`.
- `frontend/lib/reception/format.ts:108-140` — `id-ID`.
- Five kiosk/display components — `id-ID`, explicit time zones.

**Impact**

PRD §9.7 says the UI language and timezone must follow product configuration.
There is no tenant timezone/locale column on the backend
(`backend/database/migrations/2026_10_28_060000_create_kiyu_domain_schema.php`,
`tenants` table has no timezone).

**Approval question**

> Add `tenants.timezone` and `tenants.locale` (default `Asia/Jakarta`,
> `id-ID`), or keep the constants until internationalization is in scope? The
> PRD calls for configuration but the data model does not support it.

**Blocker:** no — constants are correct for the current single-market launch.

---

## Summary

| Gap | Blocker | Owner |
|---|---|---|
| G-1 facility middleware | **RESOLVED** (backend) | frontend sends the header — plan 004 |
| G-2 tenant locator for signup | no — endpoint works, frontend omits header | frontend (plan 004 follow-up) |
| G-3 realtime private channel auth | **CORRECTED** — false finding; public channel is correct | none |
| G-4 `/auth/me` shape | no | frontend (plan 004) |
| G-5 station type enum | no | frontend (plan 005) |
| G-6 user form payload | no | frontend (plans 002/003) |
| G-7 facility assignment UI | no | frontend (new plan) |
| G-8 invitation UI | no | frontend (new plan) |
| G-9 platform pages | yes (deferred pages) | backend feature work |
| G-10 timezone/locale | no | product decision |
