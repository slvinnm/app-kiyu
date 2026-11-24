# KIYU Frontend — Product Requirements Document (PRD)
## Frontend Refactoring and Implementation Specification

**Document version:** 1.0  
**Date:** 24 November 2026  
**Product:** KIYU — General-Purpose Queue Management SaaS  
**Audience:** Frontend coding agents, frontend engineers, backend/API engineers, QA  
**Backend project:** `C:\laragon\www\kiyu`  
**Status:** Frontend target specification aligned with the agreed KIYU architecture; endpoint details must be verified against the backend repository before implementation.

---

## 0. Instructions to the Coding Agent

This document specifies the frontend experience and frontend refactoring scope for KIYU. The backend Laravel project is located at:

```text
C:\laragon\www\kiyu
```

Treat that backend repository as the source of truth for implemented API contracts, authentication behavior, validation rules, permissions, resource shapes, and current business logic. Inspect it before changing frontend code.

**The frontend repository path has not been specified in this document.** First locate the existing frontend project in the currently opened workspace or the known project directories. Do not assume that the backend folder contains the frontend. Do not scaffold a new frontend, replace the existing frontend, or rewrite it from scratch merely because the backend repository has no frontend routes or because `resources/js/app.js` is empty. If the existing frontend repository cannot be identified unambiguously, stop before making changes and ask the product owner for its path.

### Mandatory workflow

1. Inspect the existing frontend repository, its framework, routing, component library, styling system, state management, API client, authentication implementation, tests, and current UX.
2. Inspect `C:\laragon\www\kiyu` read-only: API routes, middleware, policies/gates, controllers, Form Requests, API Resources, models, services, migrations, enums, tests, CORS/Sanctum configuration, and API documentation.
3. Map the existing frontend screens and API calls to the approved target architecture in this PRD.
4. Produce a frontend audit and an API contract gap report before implementation.
5. Preserve working functionality and the existing frontend stack where reasonable. Refactor incrementally; avoid cosmetic rewrites that do not advance an approved requirement.
6. Do not edit the backend as part of this frontend task. If a required API capability is missing or unsafe, document the exact gap, propose the backend change, and request approval or a separate backend task.
7. Do not invent endpoints, request fields, response fields, role values, permissions, or status enums. Verify them in the backend. Use typed API contracts based on actual or explicitly approved API specifications.
8. Do not use mock data as a substitute for a missing production API. Mocks may be used only in isolated component/story/test fixtures and must be clearly marked.
9. Do not introduce new roles, permission semantics, workflows, product rules, or data collection without presenting the rationale, alternatives, impact, and approval request first.
10. Do not perform destructive operations, remove existing screens, or change user-visible behavior without checking dependencies and obtaining required approval.

### Decision and approval rule

Approved architectural decisions below are constraints. Where the backend API has not yet implemented the target behavior, the frontend agent must identify the integration gap rather than pretending it exists. Any product-semantic choice not settled by this PRD must be raised as a decision proposal and approved before implementation.

---

## 1. Product Overview

KIYU is a **global, general-purpose queue management SaaS**. It helps organizations manage service locations, departments, queue workflows, service points, queue tickets, customer intake, kiosk devices, display devices, and operational reporting.

KIYU is not a clinic, hospital, medical-record, patient-management, pharmacy, laboratory, or healthcare-specific product. The frontend must use neutral language and generic service concepts suitable for different industries and countries.

Examples of potential customer industries include retail service centers, public service offices, banks, customer support centers, repair/service businesses, education administration, and other organizations that operate queues. These are examples only; do not hardcode industry-specific assumptions.

### 1.1 Frontend goals

- Provide clear and distinct experiences for the public marketing website, SaaS customer portal, tenant application, kiosk, display, and platform administration.
- Make one account and one organization understandable to a SaaS buyer.
- Support one organization with multiple facilities and many devices.
- Reflect global user roles and facility assignments consistently.
- Present device quotas and subscription usage at tenant level, not as separate quotas per facility.
- Make queue operations intuitive and fast for customers, operators, and staff.
- Remove clinical/medical terminology and fields throughout the UI, forms, validation, tables, reports, exports, and notifications.
- Integrate with the existing Laravel backend rather than creating a parallel business-logic layer in the frontend.

### 1.2 Non-goals

Unless approved separately, the frontend must not introduce:

- Medical record number (MRN), patient identifiers, diagnosis, treatment, prescriptions, clinical notes, or medical history.
- NIK or mandatory national identity collection.
- Patient, doctor, nurse, pharmacist, laboratory, clinic, hospital, or other medical-specific role names.
- Facility-specific subdomains.
- A separate frontend deployment per facility.
- A separate tenant or subscription for each facility.
- Client-side authorization as a replacement for backend authorization.
- New queue domain entities or new workflow semantics not supported by the approved backend design.

Do not collect date of birth, gender, national identity number, or address in the core customer intake flow by default. Any future collection requires a specific business purpose and product-owner approval.

---

## 2. Approved Product and Domain Architecture

### 2.1 Domain map

| Host | Frontend responsibility | Primary audience |
|---|---|---|
| `kiyu.id` | Public marketing website, product information, pricing, documentation, contact, and calls to action | Visitors and prospective buyers |
| `app.kiyu.id` | One SaaS application containing Customer Portal and Platform Administration areas | Tenant owners and KIYU PlatformAdmins |
| `{tenantSlug}.kiyu.id` | Tenant application for one organization, all of its facilities, queue operations, kiosk and display experiences | Tenant users and devices |
| `api.kiyu.id` | Central Laravel backend API; not a user-facing frontend | Frontend API clients and device clients |

One tenant subdomain serves every facility that belongs to the organization. For example, Jakarta and Bandung locations both use `acme.kiyu.id`. Do not create `jakarta.acme.kiyu.id`, `bandung.acme.kiyu.id`, or facility-specific deployments.

### 2.2 Organization hierarchy

```text
KIYU Platform
└── Tenant / Organization (ACME) — acme.kiyu.id
    ├── Tenant Owner / TenantAdmin
    ├── Users
    ├── Subscription and tenant-wide entitlements
    ├── Facility A — Jakarta
    │   ├── Departments
    │   ├── Workflows and Workflow Steps
    │   ├── Service Points
    │   ├── Kiosk Devices
    │   └── Display Devices
    └── Facility B — Bandung
        ├── Departments
        ├── Workflows and Workflow Steps
        ├── Service Points
        ├── Kiosk Devices
        └── Display Devices
```

A tenant is the organization and subscription boundary. A facility is an operational location. Department, workflow, workflow step, service point, queue sessions, tickets, and devices are scoped to the relevant tenant/facility context.

### 2.3 Subscription and device limits

- A tenant has one canonical owner and one organization-level subscription context.
- A tenant can have multiple facilities, subject to any plan entitlement that the backend exposes and that the product owner has approved.
- Kiosk and display limits are aggregated across the entire tenant. They are not reset or multiplied per facility.
- The frontend must display quota usage returned by the backend. Do not independently calculate authoritative quota from a partial device list.
- An offline device may still consume quota. The UI must follow the backend's explicit device lifecycle and quota response. The frontend must not infer that offline or temporarily disabled means quota is released.
- Facility distribution is managed within the tenant. Example: a tenant with 3 kiosk slots and 5 display slots may distribute them across Jakarta and Bandung, while remaining within the total tenant quota.

### 2.4 Tenant and facility context

The API runs on `api.kiyu.id`; its hostname does not identify which tenant subdomain initiated the request. The tenant frontend must send the agreed tenant context using the API contract selected by backend engineering (for example, a tenant slug header or another explicit mechanism).

A tenant slug or facility ID supplied by the browser is only a context selector. It is not proof of authorization. The backend must verify tenant membership and facility assignment. The frontend must never trust a request payload, URL parameter, local storage value, or client-side role check as permission to access data.

The frontend must not silently choose the first facility when a tenant has multiple facilities. Users with access to multiple facilities must explicitly select a facility or use a tenant-wide view where their role allows it. Device context is resolved from the paired device credential, not a manual facility selector.

---

## 3. User Roles and Frontend Access Model

The approved global role values are:

| Role | Scope | Frontend experience |
|---|---|---|
| `platform_admin` | Platform | Platform Administration in `app.kiyu.id/platform` |
| `tenant_admin` | Entire tenant | Customer Portal and tenant-wide administration |
| `facility_admin` | Assigned facilities | Full administration of assigned facilities, excluding tenant billing/ownership and creation/deletion of facilities |
| `operator` | Assigned facilities | Customer intake and queue operations |
| `staff` | Assigned facilities | Queue processing at assigned facilities/service points, within backend permissions |
| `client` | Own account/data | Self-service profile, own queue registration/tracking, and permitted public features |

### 3.1 Role is global; facility assignment defines location access

A user has one global tenant role. The same role applies at every facility assigned to that user. A user cannot be an Operator in one facility and a Staff member in another facility with the same account.

- TenantAdmin implicitly has access to all facilities in the tenant; the UI must not require facility assignment rows for the owner.
- FacilityAdmin, Operator, and Staff require one or more facility assignments.
- Client does not need a facility assignment and is restricted to their own data/actions.
- PlatformAdmin has no tenant membership. Platform support access is a separate, explicit, audited context.

### 3.2 Frontend authorization requirements

- Build navigation and action visibility from the authenticated user capabilities/permissions returned by the API, or from a strictly verified role/permission contract.
- Route guards improve UX but are not security controls. The backend remains authoritative.
- On `403`, show an access-denied state and do not retry with a broader tenant/facility context.
- On tenant mismatch, clear stale tenant-scoped UI state and require a valid tenant session/context.
- Do not allow users to change their own role, tenant, owner status, or facility assignments through generic profile forms.
- FacilityAdmin may manage users only within assigned facilities and only within backend-approved role assignment limits. The UI must not offer TenantAdmin or PlatformAdmin as assignable roles.
- Do not assume FacilityAdmin can create or delete facilities, manage subscriptions, change billing details, transfer organization ownership, or view tenant-wide reports.

### 3.3 Capability-driven UI

Prefer permission/capability-driven navigation if the backend provides a permissions resource. If the backend exposes only role identifiers, implement a centralized frontend role-to-capability map that mirrors the approved matrix and is covered by tests. Do not scatter checks such as `user.role === 'admin'` throughout components.

The capability map must be centralized and documented. Backend authorization is still required for every protected API operation.

---

## 4. Application Areas and Information Architecture

## 4.1 `kiyu.id` — Marketing Website

Purpose: introduce KIYU to prospective organizations and route prospective buyers into the SaaS registration/onboarding experience.

Required page families:

- Home / product overview.
- Features / queue management capabilities.
- How it works.
- Pricing / plans.
- Contact or sales inquiry.
- Documentation/help links if currently available.
- Legal and privacy pages as provided by the product owner.

Required behavior:

- Primary calls to action (e.g. Get Started / Start Subscription) navigate to `app.kiyu.id/register` or the approved onboarding entry point.
- Pricing cards use plan names, prices, billing intervals, and included features supplied by the backend or approved content source. Do not hardcode mutable commercial values in multiple components.
- The marketing site must not create tenant end users because no tenant context exists on the root domain.
- Do not display unsupported claims, integrations, guarantees, or features that do not exist in the product.
- Provide clear navigation to login at `app.kiyu.id/login`.

## 4.2 `app.kiyu.id` — SaaS Customer Portal and Platform Administration

This is one application and one deployment with two distinct protected areas. They must not be mixed in navigation or permissions.

### A. Public/authentication pages

- `/login`
- `/register`
- Password recovery/reset pages, if supported by backend
- Email verification page/flow, if supported by backend
- Onboarding flow

### B. Tenant Owner / Customer Portal

Suggested route/page map (adapt naming to existing frontend conventions):

```text
/dashboard
/onboarding/organization
/onboarding/plan
/onboarding/payment
/organization
/organization/profile
/facilities
/facilities/:facilityId
/users
/users/:userId
/invitations
/devices
/devices/kiosks
/devices/displays
/subscription
/billing
/account
```

Required features:

**Dashboard**
- Show organization status, subscription status, plan summary, usage and recent activity.
- Show total facilities and tenant-wide device usage.
- Provide clear actions for managing facilities, users, devices, and billing.
- Do not assume that organization-wide queue operational metrics belong in the SaaS portal if those are provided by the tenant application.

**Organization onboarding**
- Collect organization name, requested tenant slug, owner account details, and initial facility details as required by backend onboarding API.
- Validate slug availability through the backend; account for reserved hostnames and invalid slug formats.
- Explain that the tenant subdomain is the organization's application address and is shared by all facilities.
- Do not let the user choose or create a separate subdomain per facility.
- Create tenant/owner and initial Facility through the backend's transactional onboarding flow. The frontend must not orchestrate partial database creation with multiple uncoordinated writes.

**Plan selection and payment**
- Show available plans, billing interval, price, currency, and entitlements from API responses.
- Clearly show tenant-wide kiosk/display quotas and any approved facility/user limits.
- Show pending, successful, failed, expired, and cancelled payment states only when supported by backend lifecycle.
- Never treat a browser redirect/success query parameter as authoritative proof of payment. Refresh subscription/payment state from the backend after provider return.
- Do not allow FacilityAdmin or other non-owner roles to change subscriptions or billing.

**Facility management**
- List all facilities belonging to the tenant.
- Create, view, update, activate/deactivate facilities subject to API permissions and plan entitlement.
- Show facility information, departments, service points, workflows, and assigned users.
- Provide facility selection in the tenant portal; never change tenant identity when switching facilities.
- Show quota restrictions/errors returned by the backend.

**User and invitation management**
- List organization users with role, status, and facility assignment summary.
- Invite users by email and role using only roles permitted by the current user's authority.
- Assign FacilityAdmin, Operator, and Staff to one or multiple facilities according to backend rules.
- Do not require Facility assignment for TenantAdmin or Client.
- Show invitation pending/accepted/expired/revoked states based on API response.
- Prevent UI flows that let FacilityAdmin grant TenantAdmin or PlatformAdmin.
- Do not permit the canonical owner to be removed or demoted through ordinary user management.

**Device management**
- Separate Kiosk and Display device lists.
- Create device records against a selected Facility.
- Start and show pairing flow, pairing code/expiry, paired state, last seen, active/revoked/expired state.
- Show tenant-wide quota summary (used, limit, remaining) from backend.
- Explain that offline devices may still consume a quota slot.
- Revoke/deactivate devices according to API capabilities; clearly distinguish temporary disable from revoke if the backend does.
- Do not expose raw device credentials or persist pairing secrets in ordinary browser storage.

**Subscription and billing**
- Show current plan, billing interval, current period, renewal/cancellation information, payment history, invoices/receipts if available, and payment status.
- Show owner-only actions based on backend capability.
- Preserve access to payment history even after subscription cancellation/expiry, subject to backend retention policy.

### C. Platform Administration — `/platform`

PlatformAdmin uses the same `app.kiyu.id` application but receives a separate navigation shell/section and platform-specific route guards.

Suggested route/page map:

```text
/platform
/platform/tenants
/platform/tenants/:tenantId
/platform/plans
/platform/plans/:planId
/platform/payments
/platform/audit-logs
/platform/support
/platform/users
```

Required capabilities:

- View/search/filter tenants.
- View tenant status, owner reference, subscription summary, facilities, and device usage.
- Manage plans and entitlements according to platform API permissions.
- Inspect platform-level payment/subscription status.
- View platform audit logs.
- Initiate explicit tenant support access only if supported by backend.
- Require a reason before entering a tenant support context if backend requires it.
- Display a prominent support-mode banner showing the target tenant and a clear exit action.
- Never silently impersonate a tenant user or reuse TenantAdmin permissions without an explicit backend-authorized support context.
- Show the support actor, target tenant, and session context in the UI where available.

PlatformAdmin is not a tenant user. The frontend must not display tenant navigation as if PlatformAdmin had an ordinary tenant membership.

## 4.3 `{tenantSlug}.kiyu.id` — Tenant Application

This host serves the entire organization and all of its facilities.

Suggested routes:

```text
/login
/register
/invitations/accept
/dashboard
/facilities
/facilities/:facilityId
/customers
/customers/:customerId
/queues
/queue-sessions
/queue-sessions/:sessionId
/tickets
/tickets/:ticketId
/departments
/service-points
/workflows
/workflows/:workflowId
/users
/users/:userId
/invitations
/devices
/reports
/settings
/kiosk
/display
```

Exact routing must follow the existing frontend and backend API contracts; this list describes page families, not mandatory endpoint names.

### Tenant application navigation by role

**TenantAdmin**
- Organization-wide dashboard.
- All facilities and facility switching.
- Users and invitations.
- Departments, workflows, service points, kiosks, displays.
- Customers, queue sessions, tickets, reports.
- Organization settings and public registration policy.
- Link to subscription/billing in `app.kiyu.id` or the approved portal flow.

**FacilityAdmin**
- Assigned facilities only.
- Facility dashboard and settings.
- Department/workflow/service-point management within assigned facilities.
- Device management in assigned facilities, subject to tenant-wide quota and backend rules.
- User assignment management within allowed scope.
- Facility-level queue operations and reports.
- No tenant-wide billing, subscription, owner, or facility-creation controls.

**Operator**
- Assigned facility selection when more than one assignment exists.
- Customer intake/registration.
- Queue acquisition and ticket creation where allowed.
- Queue calling, recall, skip, no-show, completion, cancellation, and transfer only according to backend permissions and workflow state.
- No organization configuration, device quota management, billing, or user role management.

**Staff**
- Assigned facility and permitted service-point context.
- Queue board and tickets requiring processing.
- Start, hold, resume, complete, skip, no-show, or transfer actions only where backend permissions and workflow rules allow.
- No organization/facility administration, subscription, billing, or user administration.

**Client**
- Own profile and permitted account settings.
- Public queue registration when tenant policy allows it.
- Own queue status/tracking and history where supported.
- No access to other customers, staff dashboards, facility administration, or operational data.

### Facility selection and context

- If the user has one assigned facility, the frontend may select it automatically only after the backend/session context has been verified.
- If the user has multiple assigned facilities, show an explicit facility selector.
- TenantAdmin may select a facility or use a tenant-wide view.
- FacilityAdmin, Operator, and Staff must not see facilities outside their assignments.
- Persisting the last selected facility is a UX convenience only. Every API request must still be authorized by the backend.
- When changing facility, clear facility-scoped cached data and refetch data for the new context. Avoid showing stale data from the previous facility during transition.
- Never silently fall back to the first facility if context resolution fails.

## 4.4 Kiosk experience

Kiosk is a device-focused, touch-first experience served from the tenant host, for example `acme.kiyu.id/kiosk`. It is not a Facility subdomain and is not a normal staff account.

Requirements:

- Pairing/recovery screen for an unpaired device.
- After pairing, load the tenant and facility context from the authenticated device record.
- Show only Departments/services available at the paired Facility and allowed for kiosk intake.
- Support large touch targets, readable typography, limited navigation, clear instructions, and a simple return-to-start action.
- Support customer identity collection minimally: name and optional contact details only where required. Do not request MRN, NIK, date of birth, gender, diagnosis, or medical data.
- Allow queue acquisition according to backend rules and tenant configuration.
- Prevent users from changing tenant/facility through URL or request payload manipulation.
- Show friendly device states for unpaired, expired, revoked, inactive, network unavailable, service unavailable, and quota-independent operation errors.
- Avoid exposing internal customer details or other facilities' queues.
- Support kiosk reset/idle behavior and avoid leaving the previous customer's information visible.

## 4.5 Display experience

Display is a device-authenticated, read-only experience served from the tenant host, for example `acme.kiyu.id/display`.

Requirements:

- Pairing/recovery flow for unpaired devices.
- Display target is resolved from the paired device configuration returned/derived by the backend.
- Display only the queue information allowed by the device's target configuration and privacy rules.
- Support full-screen layouts, large queue number typography, clear service point/department labels, and accessible contrast.
- Refresh or subscribe using the transport supported by the backend (polling, events, WebSockets, etc.); do not assume a real-time transport without verifying it.
- Show connection/disconnected/reconnecting states without leaking credentials.
- Do not expose customer email, phone, national identifiers, or other private data on public screens.
- Do not invent multi-department display targeting if the backend contract supports only one target. If display targeting is not finalized, raise it as an API/product decision before building the configuration UI.

---

## 5. Core Frontend Domain Terminology

Use consistent, industry-neutral terms throughout navigation, forms, data tables, empty states, notifications, PDF/CSV export labels, and help text.

| Legacy/medical terminology | Target frontend terminology |
|---|---|
| Patient | Customer or service customer |
| MRN / Medical Record Number | Remove entirely |
| NIK / national identity as mandatory field | Remove from core intake |
| Visit (if it represents a queue service lifecycle) | Queue Session, subject to API mapping |
| Clinical Queue | Queue Operations / Queue Management |
| Clinical Department | Department |
| Station | Service Point |
| Receptionist | Operator |
| Doctor / Nurse / Pharmacist / Laboratory | Remove; use generic role/service labels |
| Referral (if cross-department service handoff) | Service Transfer / Service Handoff, subject to backend mapping |

### 5.1 Customer form

The default customer record form should be minimal:

- Name (required if required by API).
- Phone (optional unless business/API validation requires it).
- Email (optional unless business/API validation requires it).
- Other fields only when supported by an approved general-purpose requirement.

No MRN, NIK, gender, date of birth, diagnosis, medical history, or clinic-specific fields. Do not create replacement pseudo-identifiers in the frontend. If a customer reference number is needed, it must be a generic, backend-generated identifier with a documented purpose and must not be presented as a medical record number.

### 5.2 Queue terminology

Use the following user-facing concepts consistently:

- **Customer:** person requesting a service.
- **Queue Session:** one service visit/request context for a customer or walk-in.
- **Queue Acquisition:** channel/record of how a queue session or ticket was obtained, if retained by the backend domain.
- **Queue Ticket:** a numbered item processed through a workflow step.
- **Workflow:** ordered process for a department's service.
- **Workflow Step:** one stage in a workflow.
- **Service Point:** counter or operational point handling a step.
- **Queue Event:** recorded transition/action in a ticket lifecycle.
- **Service Transfer:** handoff of a service session to another department/workflow, if confirmed by backend semantics.

Do not treat Queue Session and Queue Ticket as interchangeable. The UI must represent their relationship accurately based on backend data.

---

## 6. Required User Journeys

### 6.1 Prospective buyer: register and purchase KIYU

1. Visitor enters `kiyu.id`.
2. Visitor reviews features and pricing.
3. Visitor clicks Get Started and goes to `app.kiyu.id/register`.
4. Visitor registers with a globally unique email and verifies email if required.
5. Visitor enters organization name, requested tenant slug, and initial Facility details.
6. Frontend checks slug availability through API and displays reserved/invalid slug errors.
7. Backend creates the user, tenant, canonical owner relationship, and initial Facility transactionally.
8. Visitor selects a subscription plan and billing interval.
9. Visitor completes payment through the provider flow.
10. Frontend returns from payment and fetches verified payment/subscription state from backend.
11. On success, the customer can open Customer Portal and the tenant application at `{slug}.kiyu.id`.
12. If payment is pending/failed/expired, show accurate status and available retry actions; never assume success from URL parameters.

### 6.2 Tenant owner manages two facilities

1. John logs into `app.kiyu.id` and opens the Customer Portal.
2. John sees ACME as his one organization and subscription.
3. John creates Jakarta and Bandung facilities.
4. John configures Department, Workflow, Workflow Steps, and Service Points for each facility.
5. John creates devices and assigns each to a facility.
6. The device usage page shows total tenant-wide kiosk/display usage, with per-facility distribution.
7. John invites users and assigns them to one or more facilities.
8. John can switch facility context in the tenant application without changing tenant identity or subscription.

### 6.3 Tenant user public registration

1. User enters `{tenantSlug}.kiyu.id/register`.
2. Frontend resolves the tenant context.
3. Frontend fetches whether public registration is available.
4. If disabled, show registration unavailable and offer the approved contact/invitation path; do not reveal internal tenant details.
5. If enabled, user submits the general account/customer registration form.
6. Backend creates only the role allowed by public registration policy (conservative default: `client`).
7. User verifies email if required and accesses self-service features.

### 6.4 Invitation acceptance

1. Invited user opens the invitation link.
2. Frontend validates the invitation token with backend without exposing token in logs/analytics.
3. Show organization name and the assigned role/facility scope when safe and supported.
4. User creates an account or signs into an existing account using the same globally unique email policy.
5. User accepts invitation.
6. Backend validates tenant, email, expiry, token single-use, inviter authority, role, and facility assignment.
7. Frontend shows success and routes the user to the tenant application.

### 6.5 Facility administration

1. FacilityAdmin signs in at tenant host.
2. The frontend loads only assigned facilities/capabilities.
3. FacilityAdmin selects an assigned facility.
4. They manage Department, workflows, service points, assigned users, kiosk/display devices, and facility reports within permitted scope.
5. They cannot create/delete a Facility, change the canonical owner, manage billing, or grant a higher global role.

### 6.6 Queue operation

1. Operator selects an assigned facility.
2. Operator selects/creates a general Customer where appropriate or creates a walk-in Queue Session without a linked customer if supported.
3. Operator selects the appropriate Department/workflow.
4. Backend creates the Queue Session and ticket(s) and returns queue numbers/tokens.
5. Operator and Staff see ticket state and permitted actions.
6. Status changes are submitted to backend and reflected only after authoritative response/event.
7. Queue event timeline shows actor and action using the backend actor contract.
8. Service transfer/handoff follows backend workflow semantics; do not emulate a transfer by changing local frontend state only.

### 6.7 Kiosk and Display pairing

1. Authorized administrator creates a device record for a selected Facility within tenant-wide quota.
2. Backend issues a short-lived pairing code.
3. Device opens `/kiosk` or `/display` on the tenant host.
4. Device redeems pairing code.
5. Backend binds the device credential to a tenant/facility and the configured display target if applicable.
6. Device uses the device authentication flow for subsequent requests.
7. Administrator can inspect last-seen state and revoke the device.

---

## 7. API Integration Requirements

### 7.1 Backend source of truth

The backend project at `C:\laragon\www\kiyu` is authoritative. Before using or adding any API call, inspect:

- `routes/api.php` and route groups.
- Middleware and tenant/facility context handling.
- AuthController and Sanctum configuration.
- Platform and tenant controllers.
- Form Request validation and API Resources.
- Subscription and entitlement services.
- Kiosk/display pairing and device authentication services.
- Queue lifecycle services/controllers.
- Tests and API documentation.

The API paths suggested below are logical capability groups, not a mandate to rename every existing route. Preserve compatible existing endpoints and document required breaking changes before changing frontend calls.

### 7.2 Logical API capability map

| Context | Frontend capabilities |
|---|---|
| Platform | Platform login/session, tenants, plans, entitlements, payments, audit logs, support context |
| Portal | SaaS registration, onboarding, owner profile, organization, facilities, users, invitations, devices, subscription, billing |
| Tenant | Login/session, users, facility assignments, customers, departments, service points, workflows, queue sessions, tickets, events, transfers, reports |
| Public | Tenant registration policy, public queue acquisition/tracking, limited public data |
| Device | Pairing, authenticated kiosk intake, display queue feed, heartbeat/last-seen, revocation status |
| Webhooks | Server-to-server only; never called directly by browser frontend |

### 7.3 API contract discipline

- Use typed request and response contracts.
- Keep API calls in a shared client/service layer, not scattered directly through view components.
- Centralize base URL, tenant context, authentication, request ID/correlation headers, error parsing, and retry policy.
- Do not blindly retry non-idempotent queue acquisition, payment initiation, invitation acceptance, or device pairing requests.
- Use backend idempotency support where available.
- Validate pagination, filtering, sorting, and date/time formats against backend contracts.
- Normalize error handling for `401`, `403`, `404`, `409`, `422`, `429`, and `5xx` responses.
- On `401`, follow the approved session refresh/logout flow. On `403`, show access denied. On `409`, explain conflict/quota/already-processed state according to error code. On `422`, map field errors to forms.
- Do not expose stack traces, SQL errors, provider secrets, device credentials, or internal metadata to users.

### 7.4 API gap handling

If the frontend needs a capability that the backend does not expose:

1. Identify the user journey and missing capability.
2. Show the relevant backend route/controller/service evidence.
3. Propose the required API contract (method, path, request, response, authorization, validation, error cases).
4. Explain whether it is a new endpoint or a safe extension.
5. Request approval or a separate backend implementation task.

Do not make a fake endpoint, silently edit the backend, or ship a UI that implies a feature works when it does not.

---

## 8. Authentication, Session, and Domain Security

- Platform Admin authentication occurs through `app.kiyu.id` and remains separate from tenant user authentication context.
- Tenant user authentication occurs on the tenant host and must be bound to the resolved tenant.
- A person may use the same global email identity for their account; the session/token context and authorization must still be validated independently for each application context.
- Do not assume cookies are safely shareable across all `*.kiyu.id` hosts.
- Do not set a broad `.kiyu.id` cookie domain or share a bearer token across every tenant subdomain without an explicit security assessment and backend approval.
- Inspect Laravel Sanctum stateful domains, CSRF, CORS, cookie domain, SameSite/Secure/HttpOnly settings, reverse proxy behavior, and frontend origins before changing auth behavior.
- Prefer secure, HttpOnly cookie-based SPA authentication when compatible with the approved architecture; if the existing architecture uses token authentication, document storage, rotation, XSS, revocation, and host-isolation risks before retaining it.
- Never put long-lived device credentials or invitation secrets in analytics, console logs, error reports, or URLs beyond the minimum one-time token flow.
- Avoid storing sensitive authentication material in localStorage. Use the backend-supported secure session mechanism.
- Separate platform, tenant user, and device API clients/interceptors where their credentials and context differ.
- Do not allow a PlatformAdmin session to become a tenant user session implicitly.
- Logout and tenant switching must clear the appropriate scoped caches and credentials without accidentally retaining another tenant's data.

---

## 9. Frontend UX, Design System, and Interaction Requirements

### 9.1 Preserve the existing stack and design system

First inspect the frontend repository's existing framework, version, router, UI library, CSS approach, state management, form validation, and test tools. Continue using the existing stack unless there is a documented technical reason to change it and the product owner approves the change.

Do not introduce a second component library, duplicate styling framework, or replacement design system solely for preference. Reuse existing components and tokens where they are healthy. Identify inconsistencies and propose targeted improvements.

### 9.2 Application shells

Use separate navigation shells or clear layout boundaries for:

- Public marketing site.
- SaaS Customer Portal.
- Platform Administration.
- Tenant operational application.
- Kiosk.
- Display.

These are different user experiences, but they do not necessarily require separate repositories or deployments. Keep shared UI components and design tokens where useful, without coupling privileged route trees.

### 9.3 General UI states

Every data-backed page must handle:

- Initial loading.
- Empty state with an actionable next step.
- Success state.
- Validation error.
- Permission denied.
- Not found.
- Network/offline state where relevant.
- API/server error.
- Conflict or concurrent update.
- Expired session/invitation/pairing code.
- Quota limit reached.

Do not leave blank screens or silently swallow API failures.

### 9.4 Forms

- Match validation and field requirements to backend Form Requests/contracts.
- Show inline field-level errors and a top-level summary where appropriate.
- Disable duplicate submission while a request is pending, but do not rely on disabled buttons for idempotency.
- Preserve safe user input after validation failures.
- Require confirmation for destructive operations such as device revoke, user removal, facility deactivation, or cancellation.
- Explain the impact of disabling/revoking a device on quota usage.
- Do not present medical or national-identity fields.

### 9.5 Tables and filtering

- Use server-side pagination/filter/sort where supported.
- Provide clear tenant/facility context in operational tables.
- Avoid showing records outside user permission scope.
- Use stable identifiers internally but display human-friendly names/queue numbers.
- Ensure exports use generic field labels and do not include removed clinical identifiers.

### 9.6 Responsive and device-aware behavior

- Customer Portal and tenant administration must work on desktop, tablet, and mobile.
- Queue operator workflows should prioritize fast desktop/tablet interaction and keyboard efficiency where appropriate.
- Kiosk must be touch-first, full-screen, and resilient to idle/reset conditions.
- Display must be full-screen/read-only with large, legible queue information.
- Do not assume a kiosk/display is a normal browser tab with a human user logged in.

### 9.7 Accessibility and localization

- Use semantic HTML and accessible labels.
- Ensure keyboard navigation for administrative interfaces.
- Maintain visible focus indicators and sufficient color contrast.
- Do not communicate state using color alone.
- Use localization-ready date/time, currency, and number formatting.
- Default UI language and timezone must follow the current product configuration; do not hardcode Indonesia-specific language, currency, or timezone into domain logic.
- Display facility/tenant timezone when it affects queue dates and reports.

---

## 10. Frontend State and Data Management

- Keep server data in the existing query/cache solution where the frontend already uses one.
- Avoid duplicating authoritative backend state in global client stores.
- Centralize authenticated user, tenant context, active facility, and device context.
- Treat the active facility as a UI context selector, not an authorization grant.
- On tenant switch/logout, clear tenant-scoped query caches and persisted state.
- On facility switch, invalidate/refetch all facility-scoped data and prevent stale previous-facility data from flashing.
- Keep global platform data separate from tenant data caches.
- Do not cache private customer records in public kiosk/display state longer than necessary.
- Use optimistic updates only when rollback is safe and backend semantics are well understood. For queue state transitions, prefer the authoritative response/event.
- Keep device session state separate from human user session state.

---

## 11. Frontend Testing Strategy

### 11.1 Unit/component tests

Cover:

- Role/capability navigation rules.
- Facility selector visibility and behavior.
- Form validation mapping.
- Device quota display.
- Tenant/facility context changes and cache clearing.
- Empty/loading/error states.
- General terminology (no MRN/clinical labels).

### 11.2 Integration tests

Cover:

- SaaS registration and onboarding API integration.
- Plan selection and payment return-state refresh.
- Tenant login and public registration policy.
- Invitation acceptance and expiry.
- Facility creation and switching.
- User invitation and facility assignment UI.
- Kiosk/device pairing and revocation.
- Queue acquisition and ticket lifecycle.
- Display feed and reconnect behavior.

### 11.3 End-to-end scenarios

**Scenario A — SaaS owner with two facilities**

1. John registers at `app.kiyu.id`.
2. John creates ACME organization and its tenant slug.
3. John selects a plan and completes payment.
4. John opens ACME tenant application.
5. John creates Jakarta and Bandung facilities.
6. John configures departments/workflows/service points for both.
7. John registers 3 kiosks and 5 displays according to plan limits and distributes them across facilities.
8. John sees tenant-wide quota usage, not a separate quota per facility.

**Scenario B — FacilityAdmin isolation**

1. Jane is assigned to Jakarta as FacilityAdmin.
2. Jane can manage Jakarta's departments, workflows, service points, users within permitted scope, and devices.
3. Jane cannot list, access, or mutate Bandung resources by changing URL or request identifiers.
4. Jane cannot manage billing, subscription, ownership, or create/delete facilities.

**Scenario C — Global role with multiple facility assignments**

1. David has one global role: Operator.
2. David is assigned to Jakarta and Bandung.
3. David can switch between both assigned facilities.
4. David remains Operator in both locations.
5. David cannot use frontend state manipulation to access a third facility.

**Scenario D — Kiosk and Display context**

1. Kiosk Jakarta is paired to Jakarta.
2. Kiosk Bandung is paired to Bandung.
3. Both use the same tenant host `/kiosk` route.
4. Each device receives only its paired facility's permitted data.
5. Display devices show only their configured target.
6. Revoked device credentials are rejected.

**Scenario E — General-purpose product**

1. Customer intake requires no MRN, NIK, birth date, gender, or medical fields.
2. Queue workflows use generic service terminology.
3. Reports and exports use Customer, Queue Session, Service Point, and other generic concepts.
4. No active screen, route, validation message, test fixture, or help copy refers to a clinical process.

### 11.4 Cross-role and security tests

- PlatformAdmin routes are unavailable to tenant roles.
- TenantAdmin routes are unavailable to FacilityAdmin, Operator, Staff, and Client unless an explicitly permitted endpoint applies.
- FacilityAdmin cannot access unassigned facilities.
- Operator and Staff cannot perform configuration actions not granted by backend.
- Client cannot access another customer's data.
- Tenant A context cannot be changed to Tenant B by editing a slug or request payload.
- Kiosk/Display cannot change facility identity through browser parameters.
- A stale cached response from a previous tenant/facility is not rendered after context change.

---

## 12. Non-Functional Requirements

### Performance

- Use pagination for potentially large customer, ticket, user, and audit lists.
- Avoid fetching all tenant facilities/resources when the UI needs a small subset.
- Debounce search fields where appropriate.
- Avoid polling intervals that overload the API; follow backend recommendations for kiosk/display refresh.
- Lazy-load heavy reports and platform tables where supported by the current frontend architecture.

### Reliability

- Show clear offline/reconnecting states for kiosk/display and queue operator flows.
- Prevent duplicate queue acquisition through UI safeguards and backend idempotency support.
- Refresh authoritative subscription/payment state after external payment flows.
- Recover gracefully from expired sessions, pairing codes, and invitations.

### Security and privacy

- No client-side authorization as the only enforcement.
- No tenant/facility ID trust from arbitrary client input.
- No device credential exposure.
- No medical or unnecessary personal data collection.
- No cross-tenant data cache leakage.
- No secrets in logs, analytics, URLs, or client error reports.

### Maintainability

- Centralize route metadata, role/capability checks, API clients, error handling, and domain terminology.
- Keep reusable components shared where appropriate but preserve separate platform/tenant/device boundaries.
- Maintain typed API contracts and update them when backend contracts change.
- Avoid duplicated business logic in forms and page components.

---

## 13. Frontend Refactoring Phases

### Phase 0 — Frontend repository discovery and read-only audit

- Locate the existing frontend repository.
- Confirm its path and framework/version.
- Inventory routes, pages, layouts, components, styles, state, API clients, auth/session, environment configuration, tests, build scripts, and deployment configuration.
- Identify current host/domain assumptions.
- Identify all clinical terminology and MRN/NIK references.
- Inspect backend at `C:\laragon\www\kiyu` read-only and map frontend API calls to backend routes.
- Produce current frontend architecture map and API gap report.
- Make no code changes.

### Phase 1 — Frontend/API contract alignment

- Finalize domain/host resolution strategy.
- Finalize auth/session handling for `app`, tenant subdomains, and device routes.
- Finalize API request/response types and error contracts.
- Finalize role/capability map and facility selector behavior.
- Identify backend gaps and request approval for required backend changes.
- Make no speculative endpoint assumptions.

### Phase 2 — Shared foundation

- Refactor shared API client and environment configuration.
- Implement explicit app context detection (marketing, portal/platform, tenant, kiosk, display).
- Implement centralized auth/user/tenant/facility context state.
- Implement route guards and navigation metadata.
- Implement standardized loading/error/empty states.
- Preserve existing design system and components.

### Phase 3 — SaaS Portal and Platform Administration

- Marketing CTA and plan display integration as applicable.
- SaaS registration and onboarding.
- Organization and Facility management.
- User and invitation management.
- Device and tenant-wide quota management.
- Subscription and billing pages.
- Platform administration pages and audited support-mode UI.

### Phase 4 — Tenant operational application

- Tenant login and registration/invitation acceptance.
- Role-based navigation and Facility selection.
- Department/workflow/service-point configuration.
- Customer management with generic fields.
- Queue session, ticket, event, transfer, and reporting screens.
- Facility-level dashboards and user assignment UI.

### Phase 5 — Kiosk and Display

- Pairing and device recovery.
- Touch-first kiosk intake flow.
- Display read-only queue board.
- Device status and reconnect behavior.
- Device-target configuration UI according to approved backend contract.

### Phase 6 — Cleanup, verification, and rollout

- Remove unused clinical/medical pages, routes, types, components, labels, and validation.
- Verify all screens against backend authorization.
- Run unit, integration, and end-to-end tests.
- Run cross-tenant/facility security tests.
- Verify all domain hosts and environment configurations.
- Document deployment, DNS/TLS assumptions, API configuration, and smoke tests.
- Report deferred API/backend dependencies.

Do not combine all phases into one unreviewable change set. Deliver incremental batches with tests and a concise change report.

---

## 14. Acceptance Criteria / Definition of Done

The frontend work is complete only when:

1. The existing frontend repository and stack have been identified and its working functionality has been audited.
2. The frontend integrates with the Laravel backend at `C:\laragon\www\kiyu` using verified API contracts.
3. `kiyu.id`, `app.kiyu.id`, `{tenantSlug}.kiyu.id`, and `api.kiyu.id` responsibilities are correctly represented.
4. Customer Portal and Platform Administration share `app.kiyu.id` but have separate navigation and authorization boundaries.
5. Tenant applications use one host for all facilities; no facility subdomains are created.
6. One account owner maps to one organization/tenant.
7. Tenant can manage multiple facilities.
8. Global roles are consistently represented: `platform_admin`, `tenant_admin`, `facility_admin`, `operator`, `staff`, `client`.
9. Facility selection and user assignment follow backend authorization; frontend state is never treated as permission.
10. TenantAdmin sees all tenant facilities; FacilityAdmin, Operator, and Staff see only assigned facilities.
11. Device quotas are shown at tenant level and derived from backend entitlement data.
12. Kiosk and Display are device-authenticated experiences, not normal user roles.
13. Customer and queue screens use generic, non-medical terminology.
14. No active frontend flow requests or displays MRN, NIK, diagnosis, clinical notes, or medical-only data.
15. Public registration and invitation UI obey tenant policy and backend role restrictions.
16. Payment success is confirmed by backend state, not browser redirect parameters.
17. All key pages include loading, empty, error, validation, permission-denied, and relevant offline states.
18. Tests cover role navigation, facility boundaries, context switching, device flows, and major journeys.
19. No endpoint is mocked or invented in production code.
20. Frontend deployment and environment configuration support the approved host architecture.
21. Outstanding API gaps, deferred product decisions, and security risks are documented.

---

## 15. Required Agent Deliverables

The frontend agent must produce:

1. `FRONTEND_AUDIT.md` — current frontend architecture, stack, routes, major components, and risks.
2. `BACKEND_API_CONTRACT_MAP.md` — mapping of frontend API calls to the backend repository at `C:\laragon\www\kiyu`.
3. `FRONTEND_API_GAPS.md` — missing or incompatible backend endpoints/contracts, with proposed changes and approval questions.
4. `FRONTEND_ROUTE_MAP.md` — marketing, portal, platform, tenant, kiosk, and display routes.
5. `FRONTEND_ROLE_NAVIGATION_MATRIX.md` — role/capability-based navigation and action visibility.
6. `FRONTEND_DESIGN_DECISIONS.md` — reused design system, layouts, responsive behavior, accessibility decisions.
7. Updated frontend implementation in the existing frontend repository.
8. Updated tests and test execution report.
9. `FRONTEND_RELEASE_CHECKLIST.md` — environment, domain, API, auth, smoke-test, and rollout checklist.
10. Final summary listing changed files, API dependencies, tests, deferred items, and known risks.

---

## 16. Mandatory Approval Gates

### Gate 0 — Repository discovery and read-only audit

Identify the existing frontend repository. Inspect the backend at `C:\laragon\www\kiyu` read-only. Do not modify files. If the frontend repository cannot be found unambiguously, ask the product owner for its path before scaffolding anything.

### Gate 1 — Frontend architecture and API contract proposal

Present the frontend audit, route map, domain detection, authentication/session design, role navigation matrix, facility selector model, API contract map, and backend gaps. Wait for approval on any new product-semantic or security decision.

### Gate 2 — Shared foundation

After approval, implement app context resolution, API client, authentication integration, centralized capabilities, tenant/facility context, layout shells, and standard UI states. Run tests before proceeding.

### Gate 3 — Portal and tenant application

Implement the SaaS Portal, Platform Administration, tenant pages, facility management, user assignments, registration, invitation, and queue operations in reviewable batches.

### Gate 4 — Kiosk, Display, and device UI

Implement pairing, kiosk intake, display output, device management, and quota visibility against verified backend contracts.

### Gate 5 — Cleanup and verification

Remove obsolete clinical UI and run the full frontend suite, API integration tests, security tests, E2E journeys, and host/deployment smoke tests.

### Agent conduct requirements

- Do not modify the backend repository as part of this frontend task.
- Do not assume the frontend lives inside `C:\laragon\www\kiyu`.
- Do not create a new frontend if an existing frontend project is available.
- If the frontend project path is unknown and cannot be discovered, ask before scaffolding.
- Do not change the existing framework, major dependencies, or design system without approval.
- Do not invent API endpoints or response structures.
- Do not treat hidden UI controls as authorization.
- Do not add roles or permission semantics without approval.
- Do not implement facility-specific subdomains.
- Do not add clinical/medical features or identifiers.
- Do not silently change subscription, device quota, invitation, or queue business rules.
- Keep work incremental and tested.
- Report API blockers instead of bypassing backend authorization.

---

## Appendix A — Illustrative Multi-Facility Scenario

John purchases KIYU and creates one organization, ACME, at `acme.kiyu.id`. ACME has two facilities: Jakarta and Bandung.

- John is the canonical TenantAdmin and owner.
- Jane is FacilityAdmin assigned to Jakarta.
- Michael is FacilityAdmin assigned to Bandung.
- David is Operator assigned to both Jakarta and Bandung. His role remains Operator in both locations.
- Jakarta and Bandung use the same tenant host and different device records.
- Kiosk and Display quotas are counted across ACME, not per facility.
- A kiosk paired to Jakarta receives Jakarta's device context; a kiosk paired to Bandung receives Bandung's device context.
- No facility-specific subdomain, tenant, owner account, or subscription is created.

## Appendix B — Terminology Reference

| Use | Avoid |
|---|---|
| Organization / Tenant | Clinic account |
| Facility / Location | Hospital branch (unless customer-specific wording is intentionally configured) |
| Customer | Patient |
| Queue Session | Clinical visit |
| Service Point | Medical station |
| Operator | Receptionist (as a fixed product role) |
| Workflow | Clinical pathway |
| Service Transfer / Handoff | Medical referral, unless the underlying context is genuinely clinical (which is out of scope) |
| Kiosk Device | Patient kiosk |

## Appendix C — Related Backend PRD

This frontend PRD is intended to be used alongside the approved KIYU backend architecture/refactoring PRD. If the two documents conflict:

1. Approved product/architecture decisions are authoritative.
2. The backend repository is authoritative for currently implemented API behavior, but not automatically for the desired target product behavior.
3. The frontend must not silently compensate for a backend security or contract gap.
4. Raise discrepancies as explicit API gap reports and obtain approval for changes.

**Backend repository:** `C:\laragon\www\kiyu`
