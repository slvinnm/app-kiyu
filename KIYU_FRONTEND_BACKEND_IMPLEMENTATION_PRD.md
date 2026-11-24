# KIYU Frontend & Backend Refactoring PRD

**Version:** 1.0  
**Status:** Approved product direction; implementation specification  
**Audience:** Frontend coding agent, Laravel backend coding agent, reviewer  
**Backend project:** `C:\laragon\www\kiyu`  
**Local environment:** Windows + Laragon + Nginx  

---

## 1. Purpose

This document is the implementation source of truth for aligning the existing KIYU frontend and Laravel backend with the agreed SaaS architecture, domain model, role boundaries, navigation hierarchy, and queue-management product requirements.

The frontend already exists and the backend already contains working functionality. This task is **refactoring and completing the existing product**, not rebuilding everything from scratch.

The frontend agent is authorized to inspect and modify the Laravel backend at:

`C:\laragon\www\kiyu`

The agent may:

- Refactor existing Laravel code to match this architecture.
- Add or modify API endpoints required by the agreed frontend features.
- Add services, policies, middleware, requests, resources, jobs, events, migrations, tests, and supporting backend code.
- Correct existing backend behavior that conflicts with the approved tenant, facility, role, session, queue, or SaaS architecture.
- Update frontend API integration and UI behavior to match the implemented backend contract.

Do not assume that every required backend endpoint already exists. Audit the actual backend and implement missing functionality where it is required by this PRD. Do not create fake frontend data or mock endpoints as substitutes for real business functionality.

## 2. Product Definition

KIYU is a **global, general-purpose Queue Management SaaS**. It is not a clinical, healthcare, hospital, or medical-management product.

KIYU must support organizations that need to manage customer queues and service workflows, including but not limited to service centers, banks, government offices, retail service desks, public services, and other queue-based operations.

### 2.1 Strict domain exclusions

The core product must not contain medical or clinical concepts, fields, labels, workflows, enum values, or assumptions, including but not limited to:

- Patient / patients as the core customer entity.
- MRN or medical record numbers.
- NIK or mandatory national identity numbers.
- Doctor, nurse, laboratory, pharmacy, medical ward, poli, diagnosis, prescription, medical record, or clinical-specific process.
- Medical-specific station types or seed data.
- Clinical queue naming or clinical-only controllers/services.

Use general terminology:

- `Customer` for a person receiving a service.
- `QueueSession` for a customer's service/queue session (subject to preserving audited behavior).
- `QueueTicket` for a queue ticket.
- `ServicePoint` for a counter or service point (if the agreed physical rename is applied).
- `Department` for an organizational service unit.
- `Workflow` and `WorkflowStep` for the configured service sequence.
- `ServiceTransfer` for a general cross-department/facility service handoff where that audited behavior exists.

Do not collect sensitive identity fields without a clearly approved, general business requirement. Customer profiles should use only necessary general contact information (for example name, optional phone, optional email, and optional address if currently required by a supported workflow). Do not preserve MRN/NIK under another name.

## 3. Approved Domain and Hosting Architecture

### 3.1 Production domains

| Host | Responsibility |
|---|---|
| `kiyu.id` | Public marketing website, product information, pricing, documentation, public acquisition pages |
| `app.kiyu.id` | SaaS Customer Portal and Platform Administration |
| `{tenant-slug}.kiyu.id` | Tenant Application for that organization |
| `api.kiyu.id` | Central Laravel API |

There is one central backend and one shared SaaS platform. Do not create a backend or deployment per tenant or per Facility.

### 3.2 Local Windows/Laragon domains

The local development environment uses Laragon **Nginx**, not Apache.

| Host | Responsibility |
|---|---|
| `kiyu.test` | Marketing frontend |
| `app.kiyu.test` | SaaS Portal and Platform Admin frontend |
| `{tenant-slug}.kiyu.test` | Tenant frontend |
| `api.kiyu.test` | Laravel API at `C:\laragon\www\kiyu\public` |

The browser must not need to expose the Next.js development port. Nginx is the local entry point and reverse-proxies frontend traffic to the existing Next.js dev server. The Laravel API is served through the Nginx/PHP-FPM configuration that is actually installed in Laragon.

Do not introduce Apache configuration. Do not overwrite unrelated Laragon virtual hosts or global configuration without approval. Preserve the currently working Nginx local setup unless a verified defect requires a change.

### 3.3 Reserved hostnames

The following labels are reserved and must never be interpreted as tenant slugs:

- `kiyu`
- `app`
- `api`
- `www`
- `admin`
- `support`
- `docs`
- `status`
- `static`
- `assets`

Audit the existing code and centralize the reserved list. Additional reserved names must be documented rather than scattered through route conditions.

### 3.4 Hostname resolution rules

- The hostname determines the application context, not authorization.
- `app.*` is Platform Portal context.
- A valid non-reserved tenant subdomain is Tenant Application context.
- The root marketing host is not a tenant.
- The API host is never treated as a tenant.
- Never silently select a default tenant.
- Never trust the browser hostname, URL parameter, or request body as proof of tenant membership.

## 4. Organization, Tenant, and Facility Domain Model

### 4.1 Core rules

1. One owner account owns exactly one organization.
2. One organization is one Tenant.
3. One Tenant has one canonical `TenantAdmin` owner for v1.
4. One Tenant may have multiple Facilities.
5. One Tenant has its subscription relationship; subscription/device limits are enforced at Tenant scope.
6. Each Facility contains its own Departments, Service Points, Workflows, Kiosks, and Displays as appropriate.
7. A Tenant's users belong to that Tenant. A user can be assigned to multiple Facilities within the same Tenant.
8. A user's role is global within the Tenant and does not change from one Facility to another.
9. A Facility is an operational location, not a separate Tenant or subdomain.
10. Do not create Facility-specific subdomains.

Example:

```text
ACME Organization (Tenant: acme)
├── Jakarta (Facility)
│   ├── Customer Service (Department)
│   │   ├── Counter 1 (Service Point)
│   │   ├── Counter 2 (Service Point)
│   │   └── General Service (Workflow)
│   │       ├── Registration (Workflow Step)
│   │       └── Service (Workflow Step)
│   ├── Kiosk Devices
│   └── Display Devices
└── Bandung (Facility)
    ├── Customer Service (Department)
    ├── Payment Services (Department)
    ├── Kiosk Devices
    └── Display Devices
```

### 4.2 Tenant ownership

The target model must explicitly represent ownership, normally through `tenants.owner_user_id` with a unique constraint.

For v1:

- The canonical owner has the `tenant_admin` role.
- The owner can manage the entire organization, all Facilities, subscription, and billing.
- Do not create a separate `Buyer`, `SaaSOwner`, or `OrganizationOwner` role.
- Additional organization-wide TenantAdmins are deferred unless separately approved.
- Enforce that the owner is a member of the same Tenant and has the correct role.
- Tenant and owner provisioning must be transactional.

### 4.3 Facility access

TenantAdmin has access to all Facilities in their Tenant without requiring individual assignment rows.

`FacilityAdmin`, `Operator`, and `Staff` must have Facility assignments. `Client` does not need Facility assignment for self-service access.

A user may have multiple Facility assignments, but has only one global role. Example: a user assigned to Jakarta and Bandung remains `operator` in both locations.

Never infer that a valid Facility ID means that the current user may access it. Validate both Tenant ownership and the user's Facility assignment.

## 5. Final Role Model

Use the following six role values unless the repository has a documented naming convention that requires a compatible mapping:

| Role value | Application context | Scope |
|---|---|---|
| `platform_admin` | `app.kiyu.test` / `app.kiyu.id` | Entire KIYU platform; no Tenant membership |
| `tenant_admin` | `app.kiyu.test` / `app.kiyu.id` | Owner and administrator of one Tenant |
| `facility_admin` | Tenant subdomain | Full administration of assigned Facilities |
| `operator` | Tenant subdomain | Queue intake/calling operations allowed to Operator |
| `staff` | Tenant subdomain | Queue processing and service transfer operations |
| `client` | Tenant subdomain | End user/customer self-service |

`platform_admin` must not have `tenant_id`. Tenant roles must belong to exactly one Tenant. A global unique email policy is retained unless an explicit architecture review identifies a compelling reason to change it.

### 5.1 Role and application boundary

| Application | Allowed roles |
|---|---|
| Platform Portal: `app.kiyu.*` | `platform_admin`, `tenant_admin` |
| Tenant Workspace: `{tenant}.kiyu.*` | `facility_admin`, `operator`, `staff`, `client` |

Reject a role that is not allowed in the current application context, even if its credentials are otherwise valid.

- A `tenant_admin` cannot log in to a Tenant Workspace.
- A `facility_admin`, `operator`, `staff`, or `client` cannot log in to Platform Portal.
- A `platform_admin` cannot log in as a tenant user.
- A valid session in one application context must not grant access to the other context.

## 6. Authentication and Session Isolation

This is a critical requirement because the frontend and central API are on different subdomains.

### 6.1 Independent authentication contexts

Implement two distinct contexts:

- `platform_portal`
- `tenant_workspace`

They must have independent session/token/cookie semantics. A user navigating from `acme.kiyu.test` to `app.kiyu.test` must be asked to authenticate in Platform Portal. A Platform Portal login must not automatically authenticate the user in a Tenant Workspace.

Do not assume that using separate frontend hostnames alone creates isolated sessions. The central API at `api.kiyu.test` can otherwise cause cookies or credentials to be shared.

Audit the existing Sanctum/authentication implementation and choose a secure implementation that satisfies these observable requirements. Options may include separate host-only HttpOnly cookies with a frontend BFF/session layer, distinct token/session namespaces, or another suitable design. Do not implement a speculative approach without tracing the real request and cookie flow.

Requirements:

- No long-lived sensitive token in `localStorage`.
- Do not use a broad cookie domain such as `.kiyu.test` in a way that makes the two application sessions interchangeable.
- Use HttpOnly, Secure in production, and appropriate SameSite settings for cookies where cookies are used.
- Configure CORS and CSRF for exact trusted origins; never combine credentialed requests with unrestricted `Access-Control-Allow-Origin: *`.
- Login, logout, refresh, and `/me` must be context-aware.
- Backend must validate role, account/Tenant membership, application context, and token/session context on every protected request.
- Directly opening a protected URL must not bypass authorization.

### 6.2 Login behavior

| Scenario | Expected result |
|---|---|
| Operator logs in on `acme.kiyu.test` | Allowed |
| Operator visits `app.kiyu.test` | Platform login required |
| Operator submits credentials on Platform Portal | Rejected as role not allowed in this context |
| TenantAdmin logs in on `app.kiyu.test` | Allowed |
| TenantAdmin visits `acme.kiyu.test` | Tenant login required |
| TenantAdmin submits credentials on Tenant Workspace | Rejected as role not allowed in this context |
| Unknown tenant visits `/login` | Proper tenant-not-found response; do not show tenant login |
| PlatformAdmin attempts tenant login | Rejected |

## 7. Unknown and Invalid Tenant Subdomains

The wildcard subdomain bug must be fixed in frontend and backend behavior.

Examples:

- `acme.kiyu.test/login`: show ACME login only if ACME exists and is eligible for access.
- `random.kiyu.test/login`: return a proper HTTP 404 Tenant Not Found response.
- `unknown.kiyu.test/dashboard`: return 404; do not render a default Tenant.
- `app.kiyu.test`: Platform Portal, never a Tenant.
- `api.kiyu.test`: API host, never a Tenant.

Implementation requirements:

1. Nginx continues to route valid wildcard tenant hostnames to Next.js. Nginx does not query the application database.
2. Next.js parses and classifies the hostname, using a centralized resolver and reserved-host list.
3. Next.js validates the Tenant through a public, read-only Laravel endpoint if an equivalent endpoint does not already exist.
4. Laravel is the source of truth for Tenant existence and public availability.
5. Return only public Tenant branding/context fields required by the frontend.
6. Validate Tenant status according to the actual status lifecycle. Missing Tenant must return 404. Suspended, pending, inactive, or closed states must have explicit and consistent UX/status handling; do not silently treat them as active.
7. Next.js must produce a genuine not-found response, not merely a 404-looking page with HTTP 200. Verify behavior with direct navigation and streamed rendering.
8. Every protected API endpoint must independently validate tenant membership and authorization. Successful public slug resolution is not authentication.
9. Prevent tenant-specific caching or cache-key collisions across hostnames. Public tenant context may be cached only with a hostname/slug-specific key and safe expiry; authenticated responses must not leak across Tenants.
10. Do not redirect unknown Tenant slugs to `app.kiyu.test`.

## 8. Final Navigation Information Architecture

Navigation must be role-specific. Each role must have its own navigation configuration file. Do not use one large sidebar configuration with nested role conditionals.

Shared visual components are allowed, but configuration, route permissions, and dashboard compositions must be separated by role.

### 8.1 PlatformAdmin — `app.kiyu.test`

```text
KIYU Platform
├── Dasbor Platform
│
├── Manajemen Tenant
│   └── Daftar Tenant
│       └── Detail Tenant
│           ├── Informasi Organisasi
│           ├── Informasi Pemilik
│           ├── Langganan
│           ├── Daftar Fasilitas
│           ├── Penggunaan Perangkat
│           └── Aktivitas Tenant
│
├── Langganan
│   └── Daftar Langganan
│       └── Detail Langganan
│           ├── Informasi Langganan
│           ├── Periode Berlangganan
│           └── Riwayat Perubahan
│
├── Transaksi & Pembayaran
│   ├── Daftar Transaksi
│   ├── Detail Pembayaran
│   └── Riwayat Webhook
│
├── Paket & Entitlements
│   └── Daftar Paket
│       └── Detail Paket
│           ├── Informasi Paket
│           ├── Harga & Periode
│           └── Fitur & Batas Penggunaan
│
├── Laporan SaaS
│   ├── Laporan Pendapatan
│   ├── Laporan Pembelian
│   ├── Pertumbuhan Tenant
│   ├── Laporan Langganan
│   ├── Laporan Churn
│   ├── Distribusi Paket
│   ├── Laporan Pembayaran
│   └── Penggunaan Perangkat
│
├── Support & Akses Tenant
│   ├── Riwayat Support Access
│   └── Akses Tenant
│
├── Platform Audit Log
│
└── Pengaturan Platform
    ├── Pengaturan Registrasi
    ├── Reserved Subdomain
    ├── Informasi Platform
    └── Pengaturan Notifikasi
```

PlatformAdmin dashboard is a SaaS business dashboard, not a queue-operations dashboard. It may show verified metrics for tenant acquisition, active/trial/past-due/cancelled subscriptions, MRR, payment collections, failed payments, tenant growth, plan distribution, webhook failures, and recent platform activity.

Do not fabricate figures. MRR must be calculated from eligible recurring subscriptions and normalized billing intervals; it is not the same as payment cash collections.

### 8.2 TenantAdmin — `app.kiyu.test`

```text
ACME Organization
├── Dasbor
│
├── Organisasi
│   └── Fasilitas
│       ├── Daftar Fasilitas
│       │
│       └── Detail / Kelola Fasilitas
│           ├── Informasi Fasilitas
│           │
│           ├── Departemen
│           │   ├── Informasi Departemen
│           │   ├── Loket
│           │   │   └── Detail Loket
│           │   │
│           │   └── Alur Layanan
│           │       ├── Workflow A
│           │       │   └── Workflow Steps
│           │       ├── Workflow B
│           │       │   └── Workflow Steps
│           │       └── Tambah Workflow
│           │
│           ├── Pengguna
│           │   └── Assignment Pengguna
│           │
│           ├── Kiosk
│           │   ├── Daftar Kiosk
│           │   ├── Tambah Kiosk
│           │   └── Pairing Perangkat
│           │
│           └── Display
│               ├── Daftar Display
│               ├── Tambah Display
│               ├── Pairing Perangkat
│               └── Konfigurasi Display
│
├── Operasional
│   ├── Sesi Antrean
│   └── Antrean
│
├── Pelanggan
│
├── Laporan
│
├── Audit Log
│
└── Billing
    ├── Langganan Saya
    ├── Paket Saat Ini
    ├── Penggunaan & Batas Paket
    ├── Riwayat Pembayaran
    └── Informasi Penagihan
```

**Important latest decision:** Service Transfer is a Staff-only operational capability. Do not show a Transfer menu or Transfer action to Operator, TenantAdmin, or FacilityAdmin. This supersedes earlier draft navigation that included Transfer under TenantAdmin Operations. If the existing backend supports read-only organization-wide transfer history, do not expose it as a Transfer feature without approval; report the possibility separately.

TenantAdmin can monitor queue sessions and queues across its Tenant, with Facility filters. This does not make TenantAdmin an operational queue caller in the Tenant Workspace.

### 8.3 FacilityAdmin — Tenant Application

```text
ACME
└── Jakarta (Current Facility)
    ├── Dasbor
    │
    ├── Departemen
    │   ├── Daftar Departemen
    │   │
    │   └── Detail Departemen
    │       ├── Informasi Departemen
    │       │
    │       ├── Loket
    │       │   ├── Daftar Loket
    │       │   └── Detail Loket
    │       │
    │       └── Alur Layanan
    │           ├── Workflow A
    │           │   └── Workflow Steps
    │           ├── Workflow B
    │           │   └── Workflow Steps
    │           └── Tambah Workflow
    │
    ├── Pengguna
    │   └── Assignment Pengguna
    │
    ├── Kiosk
    │   ├── Daftar Kiosk
    │   ├── Tambah Kiosk
    │   └── Pairing Perangkat
    │
    ├── Display
    │   ├── Daftar Display
    │   ├── Tambah Display
    │   ├── Pairing Perangkat
    │   └── Konfigurasi Display
    │
    ├── Laporan
    │
    └── Audit Log
```

FacilityAdmin has full administration permissions within assigned Facilities, including Departments, Service Points, Workflows, user Facility assignments, Kiosk, and Display. FacilityAdmin cannot create/delete Facilities, manage Tenant subscription/billing, or access other Facilities without an assignment.

Facility selection behavior:

- Exactly one active assignment: enter that Facility directly.
- More than one active assignment: require an explicit Facility selection or preserve a previously selected, still-authorized Facility.
- Never silently select the first Facility.
- Every API request must validate the selected Facility against the authenticated user's assignment.

### 8.4 Operator — Tenant Application

```text
ACME
└── Jakarta (Assigned Facility)
    ├── Dasbor
    │
    ├── Antrean
    │   ├── Daftar Antrean
    │   ├── Registrasi Manual (Modal Dialog)
    │   ├── Detail Tiket
    │   ├── Panggil Antrean
    │   ├── Recall Antrean
    │   ├── Skip Antrean
    │   ├── No Show
    │   └── Penyelesaian Antrean (only where permitted by current workflow)
    │
    └── Pelanggan
        └── Detail Pelanggan (Read Only)
```

There is no standalone Registrasi menu. Manual registration is an action/modal inside the Antrean page. It must use the same queue acquisition/business workflow as Kiosk intake, with the channel recorded as `MANUAL` (or the established canonical enum value).

**Operator must not have Service Transfer in navigation, UI actions, or API permissions.** Do not make the Operator able to invoke transfer by calling an endpoint directly.

### 8.5 Staff — Tenant Application

```text
ACME
└── Jakarta (Assigned Facility)
    ├── Dasbor
    │
    └── Antrean
        ├── Daftar Tiket
        ├── Detail Tiket
        ├── Proses Antrean
        ├── Transfer Layanan (Staff only)
        ├── Recall (only where permitted)
        └── Penyelesaian Antrean
```

Staff has no Manual Registration feature and no Customer management menu. Service Transfer is available only to Staff in the UI and must be enforced by backend authorization. Preserve the audited general-purpose cross-department service handoff behavior; do not remove it merely because the old table/controller uses the word `referral`.

### 8.6 Client — Tenant Application

Keep the current Client/Customer navigation exactly as follows:

```text
ACME
└── Customer Portal
    ├── Dasbor
    │
    ├── Kunjungan
    │   ├── Daftar Kunjungan
    │   └── Detail Kunjungan
    │
    ├── Booking Online
    │   └── Buat Booking
    │
    └── Profil
        ├── Informasi Profil
        └── Pengaturan Akun
```

Preserve currently working Client functions and API behavior where they remain consistent with the general-purpose product. Review the terminology of `Kunjungan` with the existing frontend/API contract, but do not silently remove the user's existing Client experience.

## 9. Navigation and Dashboard Code Organization

Each role must have an independently maintained navigation configuration file. Do not put all role-specific navigation in one large file with nested conditions.

Suggested structure (adapt to the existing frontend conventions; do not force an unnecessary rewrite):

```text
src/features/navigation/
├── configs/
│   ├── platform-admin.navigation.ts
│   ├── tenant-admin.navigation.ts
│   ├── facility-admin.navigation.ts
│   ├── operator.navigation.ts
│   ├── staff.navigation.ts
│   └── client.navigation.ts
├── navigation.registry.ts
├── navigation.types.ts
└── components/
    ├── AppSidebar.tsx
    ├── SidebarGroup.tsx
    ├── SidebarItem.tsx
    └── SidebarUserProfile.tsx
```

Shared sidebar components are encouraged. The per-role files should contain navigation configuration, not duplicate rendering implementations.

Each role must also have a separate dashboard composition:

```text
src/features/dashboards/
├── platform-admin/PlatformAdminDashboard.tsx
├── tenant-admin/TenantAdminDashboard.tsx
├── facility-admin/FacilityAdminDashboard.tsx
├── operator/OperatorDashboard.tsx
├── staff/StaffDashboard.tsx
└── client/ClientDashboard.tsx
```

Do not implement six dashboards in one generic component with many role conditionals. Shared cards/charts/tables are allowed, but dashboard composition and data responsibilities must remain separate.

Separate Platform and Tenant layouts/route guards where the current Next.js architecture supports it. Follow the actual app router/project structure after inspecting the repository.

## 10. Platform Administration Functional Requirements and API Completeness

The PlatformAdmin screens are not assumed to be implemented in the existing backend. Audit all current routes, controllers, services, policies, database tables, and tests. Implement missing APIs required by the UI. Do not mock production features.

At minimum, verify and implement the following capabilities where missing:

### 10.1 Platform dashboard

- Tenant counts by relevant status.
- Newly registered tenants over a date range.
- Subscription counts by status and plan.
- Revenue/payment collection summaries from verified payment records.
- MRR only if the subscription and price model supports a correct calculation.
- Failed/unprocessed payment webhook counts.
- Recent platform activity.
- Device usage aggregated by tenant and plan.

Every metric needs a documented definition, date/time boundary, currency handling, and backend source. Do not double-count retries/refunds or confuse invoices/charges with collected payments.

### 10.2 Tenant management

- Paginated/searchable/filterable tenant list.
- Tenant detail and owner information.
- Tenant status and lifecycle.
- Subscription summary.
- Facility count/list.
- Kiosk and Display usage.
- Recent audit/activity summary.
- Suspend/reactivate with reason and audit trail.

### 10.3 Subscription management

- List/filter subscriptions.
- View subscription detail, plan, price, interval, provider, dates, status, cancellation state.
- View subscription changes/history if supported or add a suitable auditable record model after approval where required.
- Avoid allowing arbitrary status changes that bypass payment-provider or subscription business rules.

### 10.4 Transactions and payments

- Paginated/searchable/filterable payments.
- Tenant, subscription, provider, transaction reference, amount, currency, status, paid timestamp.
- Failure information where available.
- Webhook event history and processing status.
- Safe, idempotent retry/reprocessing where supported and explicitly authorized.
- Financial history must not be cascade-deleted when subscriptions are removed/cancelled.

### 10.5 Plans and entitlements

- Plan CRUD with safe activation/deactivation.
- Price and billing interval management.
- Feature/limit entitlements, including at least `max_facilities`, `max_kiosk_devices`, and `max_display_devices` if those are product limits.
- Preserve historical price/transaction meaning when a new price is introduced. Do not silently rewrite historical payment amounts.
- Backend must enforce limits atomically; frontend limit checks are only UX.

### 10.6 SaaS reports

- Revenue report.
- Purchase/payment report.
- Tenant growth report.
- Subscription report.
- Churn report.
- Plan distribution.
- Payment success/failure report.
- Device usage report.

Export functionality may be added where appropriate. Reports must use real backend data and correct aggregate definitions.

### 10.7 Support access

- Select target Tenant.
- Require a support reason.
- Record platform actor, target Tenant, timestamp, reason, actions, and end of access.
- Clearly display active support mode in UI.
- No silent impersonation.
- Do not let support access automatically bypass plan entitlements or tenant-level authorization.

### 10.8 Platform audit log and settings

- Platform actor and action log.
- Tenant lifecycle changes.
- Plan/entitlement changes.
- Subscription/payment administrative actions.
- Support access.
- Registration policy and reserved tenant slug settings where the backend supports safe runtime configuration.
- Secrets/provider credentials must remain in secure environment/secret management; do not expose them as ordinary editable UI fields.

## 11. TenantAdmin and FacilityAdmin Backend/API Requirements

Audit and implement the endpoints needed by the agreed navigation. Required capabilities include:

- Tenant organization summary.
- Facility CRUD and detail.
- Facility-scoped Department CRUD.
- Department-scoped Service Point CRUD.
- Department-scoped Workflow CRUD and Workflow Step management.
- Tenant user listing/invitation and Facility assignment management.
- FacilityAdmin-limited user assignment management.
- Kiosk CRUD, pairing-code creation/revocation, status, and quota usage.
- Display CRUD, pairing-code creation/revocation, status, and display configuration/targeting.
- Organization-wide queue session and queue monitoring for TenantAdmin, with Facility filters.
- Facility-level reports and audit logs for FacilityAdmin.
- Organization-level reports and audit logs for TenantAdmin.
- Subscription, billing, payment history, and entitlement usage for TenantAdmin.

For every resource endpoint, validate that referenced Tenant, Facility, Department, Workflow, Service Point, Device, Session, and Ticket belong to the correct parent context. Do not rely on independent foreign keys alone when cross-tenant/cross-facility mismatches are possible.

## 12. Registration, Tenant Onboarding, and Invitations

### 12.1 SaaS customer onboarding

The SaaS registration flow belongs to Platform Portal:

```text
kiyu.id
  -> app.kiyu.id/register
  -> Create platform/customer account context
  -> Create one Tenant and canonical owner transactionally
  -> Create the first Facility transactionally
  -> Choose subscription plan
  -> Initiate payment/trial according to the approved business rules
  -> Verify payment/provider result
  -> Activate subscription/Tenant according to lifecycle
  -> Continue to app.kiyu.id portal
```

The user does not need an existing Tenant to start SaaS registration. Do not put SaaS customer registration behind tenant-resolution middleware.

### 12.2 Tenant user registration

Support both invitation and public registration:

- Public registration is controlled by a per-Tenant setting such as `allow_public_registration`.
- Public registration may create only `client` accounts.
- TenantAdmin may invite `facility_admin`, `operator`, `staff`, and `client`.
- FacilityAdmin may invite `operator`, `staff`, and `client`, only within Facilities assigned to that inviter.
- Normal invitations cannot grant `tenant_admin` or `platform_admin`.
- Invitation token must be securely hashed, expire, be revocable, and be single-use.
- Backend determines the assigned role and Facility; never trust arbitrary role/facility values from the browser.
- Registration must resolve and validate the Tenant before creating a Tenant user.

## 13. Facility Assignment and Authorization

Implement the agreed global-role model.

Suggested target relationship:

```text
users
  id
  tenant_id
  role
  ...

user_facility_assignments
  id
  tenant_id
  user_id
  facility_id
  assigned_by_user_id
  created_at
  updated_at
```

Rules:

- One role per User, stored globally on the user record.
- TenantAdmin has access to all Facilities in their Tenant without assignment rows.
- FacilityAdmin, Operator, Staff need one or more Facility assignments.
- Client does not need Facility assignment for normal self-service.
- A user with multiple assignments retains the same role at every assigned Facility.
- A user cannot be assigned a Facility belonging to another Tenant.
- FacilityAdmin can only manage assignments within Facilities where they have authority.
- FacilityAdmin cannot grant `tenant_admin`, `platform_admin`, or another `facility_admin` role unless explicitly permitted by a future approved policy. For v1, TenantAdmin controls FacilityAdmin invitations/creation.
- Removing an assignment must revoke access on subsequent requests.

Use Laravel Policies/Gates or an equivalent explicit authorization layer. Middleware should establish authentication and context; policies should authorize actions on resources. Do not scatter role checks inconsistently throughout controllers.

Do not treat hidden navigation as access control.

## 14. Queue, Customer, Workflow, and Service Transfer Behavior

### 14.1 General queue domain

Core flow:

```text
Tenant
└── Facility
    └── Department
        ├── Service Points
        └── Workflows
            └── Workflow Steps
                └── Queue Tickets
                    └── Queue Events

Customer
└── Queue Session
    ├── Queue Acquisition
    └── Queue Tickets
```

Preserve and generalize existing queue behavior after auditing the actual services and tests. Do not create a new `Queue` entity unless the actual domain requirements justify it and the change is approved.

### 14.2 Customer

Rename/generalize the existing client/patient-like entity to `Customer`/`customers` as part of the agreed baseline where appropriate. Remove MRN, NIK, date of birth, gender, and medical-specific fields from the general-purpose core. Audit every consumer before removal: models, migrations, factories, seeders, duplicate detection, controllers, requests, resources, exports, PDF/CSV reports, frontend forms/types, and tests.

Do not replace MRN with another mandatory arbitrary identifier. Use the Customer primary key internally. General contact details are optional unless a specific flow requires them.

### 14.3 Queue Session

Generalize `visits` to `queue_sessions` where the audit confirms the entity's behavior. Preserve required concepts such as Tenant, Facility, Customer (nullable for walk-ins where supported), Department, Workflow, queue/session number, tracking token, status, channel, timestamps, and soft deletion as appropriate.

Queue/session numbering must remain correctly scoped. Facility and date are part of the current visit counter behavior; audit and preserve the actual numbering semantics. Ticket numbering may have a different Service Point/date/workflow scope. Prevent duplicates and race conditions with database constraints and transaction-safe sequence allocation.

### 14.4 Intake and manual registration

Operator manual registration is an action inside the Antrean page using a modal dialog; it is not a sidebar route/menu.

The manual channel must be distinguishable from Kiosk and other supported channels. Manual intake and Kiosk intake must use consistent queue-acquisition/business logic and idempotency rules where applicable.

### 14.5 Service Transfer — Staff only

The existing audited referral behavior is a general service handoff and must be preserved and generalized, not deleted as a medical feature.

- Service Transfer is available to Staff only.
- Operator must not see or invoke Service Transfer.
- TenantAdmin and FacilityAdmin must not receive Service Transfer navigation/actions in this v1 role allocation.
- The capability must be enforced by backend policies, not merely hidden in the frontend.
- Transfer may create a target session/ticket and associated events as dictated by the existing audited business behavior.
- Preserve audit/history and prevent invalid cross-Tenant transfer.
- A transfer between Facilities, if supported, must validate both source and destination context, user permissions, and Tenant rules.

### 14.6 Ticket transfer vs service transfer

Keep distinct concepts clear:

- Ticket-level reassignment/transfer changes the handling of a ticket according to the queue workflow.
- Service Transfer/handoff moves a customer/session to another service/Department and may create a new target queue session/ticket.

Do not collapse them into one operation without a domain review.

## 15. Kiosk, Display, and Device Quotas

- Kiosk and Display are devices, not user roles.
- Device identity is authenticated through its paired, validated credential.
- Device context must resolve the registered Tenant and Facility from the device record.
- Never trust `tenant_id` or `facility_id` supplied by the device request body as proof of access.
- One Tenant can have multiple Facilities and multiple devices per Facility.
- Subscription device limits are aggregated across the entire Tenant, not reset per Facility.
- Registered/paired devices count against quota even while offline.
- Temporarily disabled devices continue to count unless explicitly revoked.
- Explicitly revoked devices release quota according to a consistent lifecycle.
- Enforce quota atomically to prevent concurrent registrations exceeding the limit.
- Device management UI must display Tenant-wide usage and Facility allocation.
- Display targeting must follow the existing backend contract. Do not invent many-to-many targeting if the current approved behavior is one Display to one Department; flag any schema/API change that would alter this model.

## 16. Backend Route and API Contract Strategy

The route structure below is a logical grouping, not an instruction to duplicate APIs or blindly rename every existing endpoint. Inspect current routes and preserve compatibility where appropriate. Add missing endpoints that the frontend needs.

Suggested API contexts:

```text
/api/platform/...
    platform authentication/context
    dashboard metrics
    tenants
    subscriptions
    plans and entitlements
    payments and webhook monitoring
    SaaS reports
    support access
    platform audit logs
    platform settings

/api/portal/...
    TenantAdmin portal context
    organization overview
    facilities
    organization-wide queue/session monitoring
    customers
    organization reports and audit logs
    subscription and billing

/api/tenant/...
    tenant authentication/context
    users and invitations
    Facility-scoped departments
    Service Points
    Workflows and Workflow Steps
    queue operations
    customers
    reports and audit logs
    Kiosk and Display management where authorized

/api/public/...
    public tenant resolution
    public queue/booking/online intake endpoints as permitted

/api/device/...
    kiosk/display pairing and authenticated device operations

/api/webhooks/...
    payment provider webhooks
```

The backend may retain another consistent route layout if existing architecture supports it. The important requirements are clear context boundaries, correct middleware/policies, stable API contracts, and no duplicated business logic.

For each frontend feature:

1. Audit whether the endpoint exists.
2. Inspect whether the endpoint has correct semantics and authorization.
3. If missing, implement it in Laravel using existing project patterns.
4. Add Form Request validation, policy authorization, service/business logic, API Resource/response contract, and tests as appropriate.
5. Update frontend types and API client.
6. Document endpoint, payload, response, errors, permissions, and pagination/filter behavior.

Do not use fabricated static arrays or mock successful responses for features that must persist data.

## 17. Database and Migration Requirements

The previously approved strategy is a fresh baseline for the current development database only. The user confirmed that the current database contains development/testing data and no business data that must be preserved. However, destructive operations still require target verification and a complete, restorable backup.

Before destructive migration/reset:

- Verify the exact database connection and environment.
- Confirm the database is the intended local development/testing database.
- Create a full schema-and-data backup.
- Restore the backup into an isolated temporary database and verify it.
- Present the exact target database name and destructive commands.
- Obtain explicit final approval before dropping/resetting any database.

Do not run destructive database commands against staging, production, shared, or unknown targets.

Review and implement where required:

- `tenants.owner_user_id` with proper uniqueness and ownership consistency.
- `user_facility_assignments` with tenant-aware foreign keys/constraints.
- `tenant_invitations` and Tenant public-registration policy.
- General-purpose Customer/QueueSession/ServicePoint naming.
- Composite/tenant-aware foreign keys to prevent cross-Tenant and cross-Facility relationships.
- `queue_tickets.tenant_id` or equivalent reliable Tenant-aware integrity strategy where required.
- Stable actor identifiers (user IDs for human actors; explicit actor type/identifier for system/device actors), not email strings as relational identity.
- Queue event actor and audit actor consistency.
- Payment history protection: do not cascade-delete financial records when a subscription is deleted.
- Unique provider transaction and webhook event/idempotency constraints.
- Price history/snapshot correctness.
- Tenant-wide device quota enforcement.

Never edit a migration history that has already been deployed to a non-disposable environment without a verified environment/migration strategy. For the disposable local baseline, consolidate/rewrite only after backup and approval.

## 18. Frontend Architecture and Code Quality

The frontend already exists. Inspect the current repository, routing conventions, UI library, data-fetching approach, form validation, state management, and design system before reorganizing it.

Requirements:

- Separate navigation configuration per role.
- Separate dashboard composition per role.
- Separate Platform and Tenant layouts/application contexts.
- Reusable visual components without one giant role-conditional component.
- Contextual navigation: Organization → Facility → Department → Service Point/Workflow.
- Breadcrumbs must reflect the actual hierarchy.
- Facility selector appears only when multiple assignments require a choice.
- Loading, empty, error, not-found, forbidden, and unavailable states must be explicit.
- Use real API data and typed contracts.
- Do not make up new endpoints or silently substitute mock data.
- Preserve existing features that remain consistent with the approved product.
- Ensure direct URL access is guarded and backend authorization remains authoritative.

## 19. Security and Data Isolation Requirements

The implementation must address:

- Tenant isolation on all Tenant-owned data.
- Facility assignment isolation on Facility-scoped operations.
- Role-to-application context enforcement.
- Session/authentication context isolation across Platform Portal and Tenant Workspace.
- Reserved hostname and unknown Tenant handling.
- Device credential authentication and revocation.
- Tenant-aware and Facility-aware foreign keys.
- Authorization on direct resource IDs to prevent IDOR.
- Safe CORS/CSRF and trusted proxy configuration.
- No cross-Tenant caching or response leakage.
- Rate limiting for public registration, login, invitations, pairing, and public tracking.
- Audit logging of sensitive administrative/support operations.
- No secret values in frontend bundles or logs.

## 20. Testing and Acceptance Criteria

The task is not complete merely because the app builds or current tests pass. Add/update tests for the new behavior.

### 20.1 Hostname and Tenant resolution

- Marketing, Platform, API, and Tenant hosts are distinguished correctly.
- Reserved hostnames are never interpreted as Tenant slugs.
- Existing Tenant slug resolves to correct public context.
- Unknown slug returns real HTTP 404.
- Inactive/suspended/pending Tenant has the agreed response/UX.
- Unknown slug never falls back to a default Tenant.
- Tenant-specific caches cannot leak data across hostnames.

### 20.2 Authentication and roles

Test each role on its allowed and disallowed application context.

- PlatformAdmin and TenantAdmin can authenticate only on Platform Portal.
- FacilityAdmin, Operator, Staff, and Client can authenticate only on Tenant Workspace.
- Sessions are not shared/interchangeable across contexts.
- Logout affects the intended context.
- A role mismatch is rejected by the backend.
- A valid login cannot access another Tenant or unauthorized Facility.

### 20.3 Facility assignments

- TenantAdmin can access every Facility in their Tenant.
- FacilityAdmin can access assigned Facilities only.
- Operator can access assigned Facilities only.
- Staff can access assigned Facilities only.
- A user assigned to multiple Facilities retains one global role.
- Cross-Tenant Facility assignment is rejected.
- Removing an assignment revokes subsequent access.
- No automatic first-Facility selection when multiple assignments exist.

### 20.4 Navigation and UI

- Each role receives the exact agreed navigation hierarchy.
- Navigation configurations are stored in separate role-specific files.
- Dashboard composition is separated per role.
- PlatformAdmin sees SaaS administration, not tenant queue menus.
- TenantAdmin sees Organization → Facilities hierarchy.
- FacilityAdmin sees only assigned Facility context and its management modules.
- Operator sees Dashboard, Antrean, and read-only Pelanggan.
- Manual Registration is a modal/action inside Antrean, not a standalone menu.
- Operator has no Transfer menu/action/API permission.
- Staff has Transfer capability and no manual registration/customer management.
- Client keeps Dashboard, Kunjungan, Booking Online, and Profil.
- Direct route access cannot bypass authorization.

### 20.5 Queue and service transfer

- Manual and Kiosk intake use consistent queue acquisition behavior with correct channel attribution.
- Queue/session and ticket numbering retain the intended Facility/Service Point/date scope.
- Duplicate submissions are handled idempotently where required.
- Only Staff can invoke Service Transfer.
- Transfer validates source/destination Tenant, Facility, Department, and queue context.
- Transfer history/events/audit are preserved.

### 20.6 SaaS Platform features

- Tenant listing/search/filter/detail works with actual backend data.
- Subscription listing/detail works.
- Plans and entitlements are persisted and enforced by the backend.
- Payments and webhook events are visible with correct status.
- Dashboard metrics use correct calculations and real data.
- Reports filter by date and relevant status/plan/tenant.
- Support access requires reason and creates audit trail.
- Platform actions cannot bypass normal authorization silently.

### 20.7 Devices and limits

- Device pairing identifies the registered Tenant and Facility.
- A device cannot spoof Tenant/Facility IDs.
- Device counts aggregate across all Facilities in a Tenant.
- Offline registered devices still count.
- Revoked devices release quota according to policy.
- Concurrent registration cannot exceed quota.
- Display configuration stays inside its assigned Facility/approved target.

### 20.8 General-purpose domain

- No MRN, NIK, patient, or clinical-only domain references remain in core features, migrations, seeders, factories, reports, CSV/PDF exports, validation, API resources, tests, or frontend types/labels.
- General-purpose station/service-point types replace clinical-specific enum values.
- Existing general handoff behavior remains available to Staff as Service Transfer.

## 21. Execution Plan

### Gate 0 — Full Existing-Code Audit

Inspect both the existing frontend workspace and backend at `C:\laragon\www\kiyu`.

Produce:

- Current frontend route/layout/navigation map.
- Current backend route/controller/service/model map.
- Existing API contract inventory.
- Missing endpoint list.
- Current authentication/session flow.
- Current Tenant/Facility resolution flow.
- Existing database/migration status.
- Existing tests and baseline results.
- File-level implementation impact map.

Do not begin broad refactoring before the audit is completed.

### Gate 1 — Implementation Design

Present:

- Final route map.
- Role-specific navigation file map.
- Role-specific dashboard map.
- API endpoint additions/changes.
- Authentication/session isolation design.
- Tenant and Facility context design.
- Database/migration plan.
- Risk and dependency sequence.

The decisions in this PRD are approved direction. Ask the user before introducing a new role, changing the global-role model, changing the one-owner/one-Tenant rule, changing the Staff-only transfer rule, changing device quota semantics, or introducing another material business rule not covered here.

### Gate 2 — Core Backend Foundations

Implement and test in a safe sequence:

1. Role enum and account scope invariants.
2. Tenant owner relationship and onboarding transaction.
3. Tenant context and unknown Tenant resolution.
4. Facility assignments and policies.
5. Independent authentication contexts.
6. Tenant/Facility relational integrity.
7. Device authentication and quota enforcement.

### Gate 3 — Backend Feature/API Completion

Implement required APIs for PlatformAdmin, TenantAdmin, FacilityAdmin, Operator, Staff, and Client features. Keep API response contracts documented and typed on the frontend.

### Gate 4 — Frontend Navigation and UX Refactoring

Implement:

1. Separate navigation configs per role.
2. Separate Platform and Tenant layouts/auth contexts.
3. PlatformAdmin dashboard and SaaS administration modules.
4. TenantAdmin dashboard and Facility management hierarchy.
5. FacilityAdmin workspace.
6. Operator queue UI with manual registration modal and read-only Customer list.
7. Staff queue UI with Staff-only Service Transfer.
8. Client experience preserving Dashboard, Kunjungan, Booking Online, and Profil.
9. Unknown Tenant and status-specific pages.

### Gate 5 — Integration, Security, and Regression Testing

Test frontend and backend independently, then run end-to-end tests through actual local domains.

### Gate 6 — Documentation and Handover

Update:

- `docs/ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/API_CONTRACT.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/MIGRATION_PLAN.md`

Document actual implemented behavior, not merely intended behavior.

## 22. Approval and Safety Rules

The agent is authorized to modify both frontend and backend code and add the API endpoints required by this PRD.

The agent does not need to ask for approval for routine implementation decisions that directly follow the approved architecture.

However, explicit approval is required before:

- Adding a new role or materially changing the role/permission model.
- Changing one owner account ↔ one Tenant.
- Changing global role behavior or Facility assignment semantics.
- Changing Staff-only Service Transfer allocation.
- Changing Tenant-wide device quota behavior.
- Introducing a materially different authentication/session architecture than the stated requirements.
- Deleting data or performing a destructive database reset.
- Resetting a database before exact target verification, complete backup, and successful restore verification.
- Installing system-wide DNS software or changing global Windows/Laragon network configuration.
- Making production or shared-environment changes.

For any proposal requiring approval, provide:

1. The problem.
2. Why the change is needed.
3. Alternatives.
4. Recommended option.
5. Impact on frontend, backend, database, security, and existing behavior.
6. Migration/rollback implications.

Wait for explicit approval before implementing that unapproved decision. Continue other independent approved work where possible.

## 23. Definition of Done

KIYU refactoring is complete only when:

- The two application contexts and allowed role boundaries work.
- Platform and Tenant sessions are genuinely independent.
- Unknown Tenant subdomains return a real 404 and never display a default Tenant.
- All six roles have their agreed navigation and separate dashboard compositions.
- TenantAdmin and FacilityAdmin have the correct hierarchy and Facility scope.
- Operator manual registration is a modal inside Antrean.
- Operator cannot transfer service.
- Staff can perform Service Transfer and cannot manually register customers.
- Client navigation remains Dashboard, Kunjungan, Booking Online, Profil.
- Required PlatformAdmin functions are backed by real APIs, not mocks.
- Missing backend endpoints required by the approved UI have been implemented and tested.
- Multi-Tenant and multi-Facility isolation is verified.
- Device quota and pairing work at Tenant scope with Facility context.
- Medical/clinical legacy fields and assumptions have been removed from the general-purpose core.
- Database constraints and audit behavior protect the required invariants.
- Automated tests, build, lint/type checks, and end-to-end checks pass.
- Documentation describes the code that actually exists.

**Final instruction:** Do not merely make the frontend look correct. Align the frontend, Laravel backend, database, authentication, authorization, API contracts, and local subdomain routing as one coherent KIYU SaaS system.
