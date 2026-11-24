# BACKEND_CHANGELOG

Changes made to the Laravel backend at `C:\laragon\www\kiyu` as part of the
frontend refactor. This is the only file in the frontend repo that records
backend edits; the backend's own git history is the authoritative log.

**Date:** 2026-11-24
**Backend base commit:** `dd4abe2` (refactor part 2)
**Verification:** `php artisan test` → 236 passed, 978 assertions (was 225 tests
/ 955 assertions; +11 tests, +23 assertions). No test was removed or weakened.

---

## 1. `facility` middleware applied to facility-scoped routes (closes G-1)

**Problem.** `ResolveFacility` was registered as the `facility` alias but
applied to zero routes. `ResolveTenant` binds a facility only when the user can
reach exactly one, so in any tenant with two or more active facilities every
department, station, workflow, reception, intake, ticket and report call hit
`Controller::facility()` and aborted 403. Multi-facility tenants — the core of
the product per PRD §2.3 and acceptance criteria 7 and 9 — were unusable.

**Files**

- `routes/api.php` — `facility` added to:
  - `POST /intake/manual`
  - the `reception/*` group
  - `POST /queue/call-next`
  - the `tickets/*` group
  - `departments/*` group
  - `stations/*` group
  - `workflows/*` group, and `PUT/DELETE /workflow-steps/{id}`
  - `GET /queue/monitor`
  - the `reports/*` group
- `app/Http/Middleware/ResolveFacility.php` — rewritten resolution order.

**Behavior now**

1. A valid `X-Facility-Id` header is **authoritative**: it is validated against
   the tenant (`404` if it is not an active facility of that tenant) and against
   the caller's reach (`403` if unassigned). It is never silently replaced by the
   context facility — a stale selector must fail loudly, not act on the wrong
   location.
2. A non-numeric header is `400`.
3. No header, and a facility already bound implicitly → use it (single-facility
   tenants need no header at all).
4. No header, several reachable facilities → `400` naming the required header.
5. No reachable facility at all → `403` (there is nothing the caller could send
   to fix it, so it is not a bad request).

**Routes deliberately left without `facility`:** user management, invitations,
facility assignment, billing, audit logs, customers, queue sessions. These are
tenant-wide (a customer is not owned by a facility; the device quota is tenant
level), and forcing a facility would break legitimate tenant-wide reads.

---

## 2. Device creation takes an explicit `facility_id` (closes part of G-1)

**Problem.** `KioskDeviceController::store` and `DisplayDeviceController::store`
wrote `facility_id => $this->facilityId()`, which aborts 403 when the tenant has
several facilities and no single context. A tenant admin could not provision a
kiosk for a specific branch — the primary multi-location workflow.

**Files**

- `app/Http/Controllers/Controller.php` — new protected
  `resolveDeviceFacility(Request, ?int): int`.
- `app/Http/Controllers/Api/KioskDeviceController.php` — `store` validates an
  optional `facility_id` and resolves through the helper.
- `app/Http/Controllers/Api/DisplayDeviceController.php` — same.

**Contract**

```
POST /api/kiosk-devices
{ "name": "Branch Kiosk", "facility_id": 2, "expires_at": null }
```

- `facility_id` omitted, single reachable facility → that facility is used.
- `facility_id` omitted, several reachable → `422` on `facility_id`
  ("Choose the facility this device belongs to.") — never a silent guess.
- `facility_id` given, not in this tenant / inactive → `404`.
- `facility_id` given, caller does not administer it → `403`.
- `GET /kiosk-devices` and `GET /display-devices` stay **tenant-wide** (the
  quota is per tenant, PRD §2.3), so no `facility` middleware was added there.

**Note on the response.** The device create response still returns the device
object; `facility_id` is included because it is a real column. The frontend may
read it to confirm placement.

---

## 3. New tests: `tests/Feature/FacilityContextTest.php`

Eleven cases, all passing:

1. Multi-facility operator without a header → `400` with the header message.
2. Operator sees only the departments of the facility they select.
3. Operator is refused a facility they are not assigned to (`403`).
4. Tenant admin may select any active facility of the tenant.
5. Another tenant's facility id → `404`.
6. Malformed `X-Facility-Id` values (`abc`, `-1`, `1.5`) → `400`.
7. An inactive facility cannot be selected → `404`.
8. A user with no reachable facility → `403`, never "send a header".
9. A single-facility tenant needs no header.
10. Device creation accepts an explicit facility the caller administers (both
    branches: the other facility and the own facility).
11. Device creation without `facility_id` in a multi-facility tenant → `422`.

---

## Deliberately NOT changed, with reasons

- **`/broadcasting/auth` already exists.**
  `php artisan route:list | grep broadcast` →
  `GET|POST broadcasting/auth → BroadcastController@authenticate`. It is
  registered automatically because `bootstrap/app.php` passes `channels:`. The
  earlier report (FRONTEND_API_GAPS G-3) that it was missing was wrong; that
  document is corrected. Private channels still need a bearer token Echo cannot
  send from an HttpOnly cookie, so the frontend correctly uses the public
  `public.facility.{id}` channel. No backend change needed.
- **Tenant locator for `POST /auth/register` (G-2).** `ResolvePublicTenant`
  already accepts `X-Tenant-Slug`, the `{tenant}` route parameter, or the host's
  first label. The endpoint works; the frontend simply never sends the header.
  This is a frontend change (plan 004 follow-up), not a backend one.
- **`tenants.timezone` / `tenants.locale` (G-10).** PRD §9.7 wants configuration,
  but no column exists and the product is single-market today. Adding schema for
  a hypothetical future is out of scope for a bug-fix pass; recorded as a
  product decision.
- **Platform payments/audit/users endpoints (G-9).** Not implemented on the
  backend; building them is a feature, not a fix.
- **Facility assignment UI, invitation UI (G-7, G-8).** Backend endpoints
  already exist and work; these are missing frontend screens, not backend gaps.

---

## Frontend follow-ups created by these changes

| Change | Frontend must |
|---|---|
| `X-Facility-Id` now enforced | plan `plans/004-session-facility-realtime.md` sends it from both proxies (already planned) |
| Device create takes `facility_id` | device form adds a facility select when the user reaches more than one facility |
| `400` for a missing header | error handling must surface the message, not a generic failure |

## How to reproduce the verification

```bash
cd C:\laragon\www\kiyu
php artisan test --compact                 # 236 passed
php artisan test --filter=FacilityContextTest   # 11 passed
php artisan route:list --path=api/departments   # shows ResolveFacility in middleware
```
