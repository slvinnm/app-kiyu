# BACKEND_API_CONTRACT_MAP

PRD §15 item 2. Every API path the frontend calls, mapped to the route that
actually exists in `C:\laragon\www\kiyu` (`routes/api.php`, verified with
`php artisan route:list --path=api --json` on 2026-11-24, backend HEAD
`dd4abe2`).

Legend: ✅ matches · ❌ no such route (404 at runtime) · ⚠ matches but field or
header contract differs.

## Authentication

| Frontend call | File | Backend route | Status |
|---|---|---|---|
| `POST /auth/login` | `lib/actions/auth.ts` | `POST api/auth/login` (throttle 6/min) | ✅ |
| `POST /auth/register` | `lib/actions/auth.ts:147` | `POST api/auth/register` + `public-tenant` | ⚠ needs `X-Tenant-Slug` or tenant host; the frontend sends neither |
| `POST /auth/logout` | `lib/actions/auth.ts` | `POST api/auth/logout` (auth:sanctum) | ✅ |
| `GET /auth/me` | `lib/auth/verify.ts:66` | `GET api/auth/me` | ⚠ response has `facility_ids`, not `facility_id`/`department_id` |
| (`accept invitation`) | — | `POST api/auth/register/invitation` | missing in frontend |

## Customers (frontend calls them "clients")

| Frontend call | File | Backend route | Status |
|---|---|---|---|
| `GET /clients` | `lib/api/admin-server.ts:117` | `GET api/customers` | ❌ |
| `GET /clients/statistics` | `lib/api/admin-server.ts:182`, `lib/api/reception-server.ts:45` | `GET api/customers/statistics` | ❌ |
| `GET /clients/{id}` | `lib/api/admin.ts:182`, `lib/api/reception.ts:131` | `GET api/customers/{id}` | ❌ |
| `POST /clients` | `lib/api/admin.ts:175`, `lib/api/reception.ts:146`, `lib/api/clients.ts:49` | `POST api/customers` | ❌ |
| `PUT /clients/{id}` | `lib/api/admin.ts`, `lib/api/reception.ts:153`, `lib/api/clients.ts:56` | `PUT api/customers/{id}` | ❌ |
| `GET /clients/{id}/visits` | `lib/api/clients-server.ts` (alias) | `GET api/customers/{id}/queue-sessions` | ❌ |

Payload note: backend accepts `name`, `phone`, `email`, `address`, `user_id`.
The frontend form also sends `nik`, `mrn`, `date_of_birth`, `gender`, which the
`customers` table does not have.

## Queue sessions (frontend calls them "visits")

| Frontend call | File | Backend route | Status |
|---|---|---|---|
| `GET /visits` | `lib/api/admin-server.ts:126` | `GET api/queue-sessions` | ❌ |
| `GET /visits/statistics` | `lib/api/admin-server.ts:166` | `GET api/queue-sessions/statistics` | ❌ |
| `GET /visits/{id}` | `lib/api/admin.ts:213`, `lib/api/clients-server.ts:45` | `GET api/queue-sessions/{id}` | ❌ |
| `GET /visits?client_id=` | `lib/api/clients-server.ts:35` | `GET api/queue-sessions?customer_id=` | ❌ |
| `PATCH /visits/{id}/priority` | `lib/api/admin.ts:196`, `lib/api/staff.ts:139` | `PATCH api/queue-sessions/{id}/priority` | ❌ |
| `POST /visits/{id}/cancel` | `lib/api/admin.ts:206`, `lib/api/staff.ts:146` | `POST api/queue-sessions/{id}/cancel` | ❌ |
| `GET /visits/{id}/acquisition` | `lib/api/reception.ts:167` | `GET api/queue-sessions/{id}/acquisition` | ❌ |
| `GET /visits/{token}/track` (public) | `lib/api/visit-tracking.ts:19` | `GET api/queue-sessions/{token}/track` | ❌ |

## Service transfers (frontend calls them "referrals")

| Frontend call | File | Backend route | Status |
|---|---|---|---|
| `GET /referrals` | `lib/api/admin-server.ts:135` | `GET api/service-transfers` | ❌ |
| `POST /referrals` | `lib/api/admin.ts:235` | `POST api/service-transfers` | ❌ |
| `GET /referrals/{id}` | `lib/api/admin.ts:242` | `GET api/service-transfers/{id}` | ❌ |

## Queue processing

| Frontend call | File | Backend route | Status |
|---|---|---|---|
| `POST /clinical/call-next` | `lib/api/staff.ts:41` | `POST api/queue/call-next` | ❌ |
| `GET /reception/queue` | `lib/api/reception.ts:22`, `lib/api/reception-server.ts` | `GET api/reception/queue` | ✅ |
| `POST /reception/call-next` | `lib/api/reception.ts:30` | `POST api/reception/call-next` | ✅ |
| `POST /reception/complete-registration` | `lib/api/reception.ts:82` | ✅ | ✅ |
| `POST /reception/{id}/recall·skip·no-show` | `lib/api/reception.ts:40,50,57` | ✅ | ✅ |
| `POST /tickets/{id}/start·hold·resume·complete·skip·no-show·cancel·transfer` | `lib/api/staff.ts` | ✅ | ✅ |
| `GET /tickets` , `/tickets/statistics`, `/tickets/{id}`, `/tickets/{id}/events` | `lib/api/staff.ts` | ✅ | ✅ |
| `GET /stations/{id}/queue` | `lib/api/staff.ts:24` | ✅ | ✅ |
| `GET /stations/options` | `lib/api/staff.ts:31` | ✅ | ✅ |
| `GET /queue/monitor` | `lib/api/admin-server.ts:228` | `GET api/queue/monitor` | ✅ |
| `GET /public/queue` (via device proxy) | `lib/api/display.ts` | `GET api/public/queue` + `public-tenant` | ✅ (device header) |

## Organisational configuration

| Frontend call | Backend route | Status |
|---|---|---|
| `GET /departments`, `GET /departments/options`, `GET /departments/active` | `api/departments*` | ✅ |
| `POST/PUT /departments/{id}` | ✅ | ✅ |
| `GET /departments/{id}/stations`, `/workflows` | ✅ | ✅ |
| `GET/POST/PUT /stations*` | ✅ | ⚠ frontend sends `type: "REGISTRATION"/"NURSE"/…`; backend `Rule::enum(StationType)` accepts only `INTAKE|SERVICE|CASHIER|COUNTER` → 422 |
| `GET/POST /workflows`, `POST /workflows/{id}/steps`, `PUT/DELETE /workflow-steps/{id}` | ✅ | ✅ |
| `GET /workflows/statistics` | ✅ | ✅ |

## Users, facilities, devices, billing

| Frontend call | Backend route | Status |
|---|---|---|
| `GET/POST/PUT/DELETE /users*` | ✅ | ⚠ frontend form sends `role: "doctor"/"nurse"/…` and `department_id`; backend accepts only `UserRole::tenantValues()` and takes `facility_ids[]` + `station_id` → 422 |
| `GET/POST/PUT /facilities*` | ✅ | ✅ |
| `GET/POST/DELETE /kiosk-devices*`, `POST /{id}/pairing-code` | ✅ | ✅ |
| `GET/POST/DELETE /display-devices*`, `POST /{id}/pairing-code` | ✅ | ✅ |
| `POST /kiosk/pair`, `POST /display/pair` | ✅ | ✅ |
| `GET /billing/subscription`, `POST /billing/subscription`, `POST /billing/subscription/cancel` | ✅ | ✅ (tenant_admin only) |
| `GET /audit-logs` | ✅ | ✅ (tenant_admin only) |
| `GET /reports/summary` | ✅ | ✅ (`basic_reports`) |
| `GET /reports/queue-sessions/export`, `POST /reports/queue-sessions/export-file` | ✅ | ❌ frontend calls `/reports/visits/export-file` |
| `POST /intake/manual`, `POST /intake/online`, `POST /intake/kiosk`, `GET /intake/online-lookup/{id}`, `POST /intake/online-checkin` | ✅ | ✅ |

## Not called by the frontend (backend capabilities with no UI)

- `queue-acquisitions` (list/show/cancel)
- `invitations` (list/create/revoke) and invitation acceptance
- `users/{userId}/facilities` assignment CRUD
- `queue-sessions/{id}/acquisition`, `service-transfers/{id}`
- `whatsapp/messages`
- all `/platform/**` routes (tenants, plans, per-tenant management)

## Cross-cutting contract notes

| Topic | Backend | Frontend |
|---|---|---|
| Tenant context | `X-Tenant-Slug` header, or tenant host, or device credential | never sent |
| Facility selection | `X-Facility-Id` header, required when >1 active facility | never sent; `ResolveFacility` middleware is registered but applied to **0** routes |
| Auth transport | Sanctum bearer token | HMAC-signed HttpOnly cookie holding the token ✅ |
| CSRF | Origin allowlist `CORS_ALLOWED_ORIGINS` | `isSameOrigin()` against `APP_ORIGIN` ✅ |
| Realtime channels | `public.facility.{id}`, `tenant.{t}.department.{d}`, `tenant.{t}.station.{s}` (private) | hooks use the public one ✅; `live-refresh.tsx` uses `department.{id}` ❌; `/broadcasting/auth` route is not registered |
| Pagination | Laravel `paginate` (`current_page`, `data`, `last_page`, …) | `Paginated<T>` ✅ |
| Table query | `search`, `sort`, `direction`, `page`, `per_page` + allowlisted sort columns | `parseTableParams` ✅ |
