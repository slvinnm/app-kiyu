# KIYU Frontend Rebuild — Product Requirements Document

**Document status:** Implementation-ready product and technical requirements  
**Product:** KIYU — Multi-tenant Queue Management SaaS  
**Frontend repository:** `C:\laragon\www\app-kiyu`  
**Backend repository:** `C:\laragon\www\kiyu`  
**Primary backend reference:** `docs/API_CONTRACT.md` and the actual Laravel routes, controllers, policies, requests, resources, and tests in the backend repository  
**UI foundation:** Existing fresh Next.js frontend with shadcn/ui already initialized and the default shadcn dashboard template installed

---

## 1. Product Overview

KIYU is a multi-tenant queue management SaaS. The frontend must provide distinct experiences for public visitors, organization owners, tenant workforce members, customers, platform administrators, and paired kiosk/display devices.

This project is a **frontend rebuild**, not a backend rewrite. The existing Laravel backend is the source of truth for API capabilities, authorization, tenant boundaries, data structures, validation rules, and business workflows.

The frontend must be implemented in the existing Next.js project. Preserve useful parts of the installed shadcn dashboard template and the current project configuration. Do not replace the project with a new scaffold unless inspection proves the current installation is unusable and the reason is documented.

### Product goals

1. Deliver a coherent multi-domain experience from one maintainable Next.js codebase.
2. Give each user type an interface suited to its actual work instead of forcing every role into one generic dashboard.
3. Keep authentication, sessions, API clients, and navigation isolated by application context.
4. Use shadcn/ui as the primary UI component foundation.
5. Make page navigation feel deliberate and predictable by showing a route-level skeleton for every page transition.
6. Keep frontend code strongly typed, easy to navigate, testable, and aligned with the existing backend contract.
7. Avoid implementing screens, actions, or business rules that the backend does not support.

### Non-goals

- Rewriting or refactoring the Laravel backend.
- Inventing new API endpoints to satisfy a frontend design.
- Implementing unsupported billing gateways, payment flows, queue rules, integrations, or business capabilities.
- Building separate frontend repositories for each domain.
- Treating kiosk/display devices as ordinary authenticated user roles.
- Building an unrestricted staff self-registration flow.

---

## 2. Mandatory Repository Reconnaissance

Before implementing features, inspect both local repositories. The developer's local paths are available to the coding agent:

- Frontend: `C:\laragon\www\app-kiyu`
- Backend: `C:\laragon\www\kiyu`

Do not assume the current README, this document, or prior implementation notes are more authoritative than the running code and API contract. Resolve discrepancies by inspecting the backend implementation and documenting the conclusion.

### 2.1 Frontend inspection

Inspect at least:

- `package.json` and lockfile: Next.js, React, TypeScript, Tailwind, shadcn, form, validation, data-fetching, and icon dependencies.
- The installed Next.js version and whether the project uses App Router.
- Existing `src/app` or `app` route structure.
- `components.json`, shadcn component directory, Tailwind configuration, CSS variables, and global styles.
- The installed dashboard template: layout, sidebar, navigation, theme provider, charts, tables, and existing page patterns.
- Existing authentication, API client, environment variable, middleware/proxy, and test setup.
- Existing lint, formatting, type-check, and build scripts.

Keep useful template components and project conventions. Remove unused demo content only after identifying it. Do not discard working configuration merely to match a preferred folder tree.

### 2.2 Backend inspection

Read `docs/API_CONTRACT.md` first, then verify it against the Laravel implementation. Inspect:

- API route definitions and route prefixes.
- Authentication endpoints, token abilities, token response structure, logout/revocation behavior, and invitation acceptance.
- Middleware, guards, policies, role checks, tenant scoping, and facility scoping.
- Request validation and response/resource structures.
- Feature entitlements, subscription limits, and capacity responses.
- Queue lifecycle and allowed transitions.
- Kiosk/display pairing and device-token behavior.
- Existing tests for critical workflows.

Create a concise backend capability map before building screens. For every planned page/action, identify the endpoint(s) and permissions that support it. If a capability is missing or unclear, do not mock it as a real working feature. Mark it as out of scope or blocked and report the backend gap.

### 2.3 Reconnaissance deliverable

Before broad implementation, produce a short `FRONTEND_IMPLEMENTATION_PLAN.md` in the frontend repository containing:

- Existing frontend stack and relevant installed versions.
- Existing template assets/components that will be retained.
- Backend API context and endpoint map.
- Authentication/session strategy.
- Host-routing strategy for local development and production.
- Proposed folder structure adapted to the actual project.
- shadcn components that need to be installed.
- Any API gaps, ambiguities, or risks.

Do not stop at planning when the inspection is complete. Proceed with implementation in small, verifiable phases unless a genuine backend blocker prevents progress.

---

## 3. Domain and Application Contexts

Use **one Next.js codebase** with separate application shells and context-specific modules. Do not create four independently maintained frontend applications.

| Hostname | Application context | Authentication | Primary users |
|---|---|---|---|
| `kiyu.test` | Public Website | No auth pages | Public visitors and prospective customers |
| `app.kiyu.test` | App Console | Login and Sign Up | `tenant_admin` / organization owner |
| `{tenant}.kiyu.test` | Tenant Workspace and Customer Portal | Login with Staff/Admin and Customer tabs; Customer registration where enabled | `facility_admin`, `operator`, `staff`, `customer` |
| `portal.kiyu.test` | Platform Portal | Login only | `platform_admin` |
| `api.kiyu.test` | Laravel API | API authentication | Backend only; not a frontend application |

`{tenant}.kiyu.test` is a hostname pattern, not a literal hostname. Example: `klinik-a.kiyu.test`.

### 3.1 Host resolution requirements

- Resolve the application context from the request hostname using one explicit, tested host-resolution layer.
- Resolve the tenant slug from the tenant subdomain and validate it through the backend's public tenant lookup/capability. Do not trust a slug supplied only by client state.
- Handle unknown, malformed, or inactive tenant hosts with a clear not-found/unavailable experience.
- Support local `.test` development hosts and production hostnames through environment-driven configuration. Do not hardcode production domains throughout the application.
- Do not use URL origin or hostname as proof of user identity or authorization.
- Do not expose internal routing prefixes in canonical links or user-facing URLs.
- Keep host-based routing compatible with the installed Next.js version. Use the correct Next.js request interception mechanism for that version; do not blindly copy middleware examples written for another version.

### 3.2 Shared code, isolated contexts

The following may be shared:

- shadcn/ui components and design tokens.
- Generic form fields, feedback patterns, skeleton primitives, and non-domain-specific utilities.
- API transport helpers, error normalization, date/number formatting, and accessibility utilities.

The following must remain context-specific:

- API clients and endpoint namespaces.
- Authentication flows, session/token namespaces, and logout behavior.
- Navigation configuration and route guards.
- Role/permission interpretation.
- Tenant and facility context selection.
- Layout shells and major page workflows.

Do not build one giant dashboard with many role-based conditionals. Use separate shells and feature modules.

---

## 4. Authentication and Session Requirements

Authentication is context-specific. A successful login in one context must never silently authenticate another context.

### 4.1 Public Website — `kiyu.test`

- No login page.
- No sign-up page.
- Public marketing pages only.
- Primary calls to action:
  - **Get Started** → `app.kiyu.test/signup`
  - **Login** → `app.kiyu.test/login`
- Do not expose tenant workforce/customer login links as the primary public login action unless a specific tenant URL is already known.

### 4.2 App Console — `app.kiyu.test`

Required routes:

- `/login`
- `/signup`

Sign Up creates an organization through the backend app signup endpoint. The known signup workflow creates the tenant, owner, initial facility, and trial subscription, but does **not** issue an authentication token. Therefore:

1. Submit the signup request.
2. Show a clear success state explaining that the account has been created.
3. Redirect the user to `/login` or provide an explicit Continue to Login action.
4. Authenticate through the app login endpoint.
5. Load the app-context identity and organization context before entering protected pages.

Do not assume signup returns a token. Confirm the exact response shape in the backend code.

Only `tenant_admin` belongs in this context. Do not allow a Facility Admin, Operator, Staff, Customer, or Platform Admin token to be reused here.

### 4.3 Tenant Workspace — `{tenant}.kiyu.test`

Provide one unified login experience with two clearly separated tabs:

- **Staff / Admin**
- **Customer**

The selected tab determines the authentication context and endpoint. Never try one endpoint and silently fall back to the other.

#### Staff / Admin tab

- Login only.
- Authenticate using the tenant workforce authentication endpoint.
- Supported user roles: `facility_admin`, `operator`, and `staff`.
- No public sign-up link or staff self-registration form.
- Workforce users join through the backend invitation flow. Implement invitation acceptance only if it is supported by the inspected backend contract.
- After authentication, load `/me`, permissions, tenant membership, and accessible facility context before redirecting.
- Route users to the appropriate role experience. Do not redirect every workforce role to the same dashboard.

#### Customer tab

- Provide Customer Login and Customer Sign Up within the Customer tab.
- Customer registration is available only when the tenant's `allow_public_registration` setting is enabled.
- If registration is disabled, hide or disable the registration action and explain that registration is unavailable for this organization.
- Customer authentication must use the Customer API context, not the workforce API context.
- Customer registration must create only a Customer account. It must never create a staff or administrator account.
- After login, load the Customer identity and use customer-specific routes/navigation.

A single page may host the two top-level tabs and the Customer login/register switch. Keep the selected authentication mode explicit in the URL or page state where practical, so refresh/back navigation does not unexpectedly switch contexts.

### 4.4 Platform Portal — `portal.kiyu.test`

- Login page only.
- No sign-up or public account creation.
- Authenticate only through the Platform API context.
- Only `platform_admin` may enter the portal.
- A normal tenant user must not be redirected into this portal as a fallback.

### 4.5 Session and token isolation

Create separate context-aware authentication services and session namespaces for:

- App Console (`app`)
- Tenant workforce (`tenant`)
- Tenant customer (`customer`)
- Platform Portal (`portal`)

Tenant workforce and Customer share the same tenant hostname but are still different authentication contexts. They must not share a token, session namespace, API client, or role assumptions.

Security requirements:

- Do not store bearer tokens in `localStorage` or expose sensitive tokens to client-side JavaScript.
- Prefer secure server-managed sessions or `HttpOnly`, `Secure` (in production), appropriately `SameSite` cookies, subject to the actual Next.js/backend integration. If a server-side proxy/BFF is required to keep tokens out of browser JavaScript, implement it consistently rather than mixing direct and proxied token handling.
- Use host-only cookies by default. Do not set a broad `.kiyu.test` cookie unless there is a documented security reason.
- If Customer and workforce sessions coexist on the same tenant host, use distinct cookie/session names and explicit context handling.
- Logout must revoke/invalidate the matching backend token/session and clear only the matching context session. Do not accidentally log out another context.
- Never treat `Origin`, hostname, a client-provided role, or a hidden UI element as authentication or authorization.
- Handle expired, revoked, and invalid tokens predictably. Return users to the correct context login page and preserve a safe return path where appropriate.

The backend remains the final authority for every protected operation.

---

## 5. User Roles and Experience Requirements

The frontend must support six human user roles and two device interfaces. Kiosk and Display are device modes, not user roles.

### 5.1 `platform_admin` — Platform Portal

**Host:** `portal.kiyu.test`  
**Experience:** SaaS-wide management interface; desktop-first.

Primary navigation:

1. Dashboard
2. Tenants
3. Subscriptions
4. Payments
5. Plans
6. Add-ons
7. Feature Registry
8. Reports
9. Audit Logs
10. Settings

Requirements:

- Show platform-wide operational and business summaries supported by backend data.
- Manage tenant lifecycle and subscription/payment administration where APIs exist.
- Manage plans, add-ons, feature availability/release, reports, audit logs, and platform settings where supported.
- Feature release/availability controls must reflect backend semantics. Do not substitute plan labels for actual feature entitlement/release data.
- Do not implement tenant impersonation unless the backend explicitly supports it. The current expected behavior is no impersonation.

### 5.2 `tenant_admin` — App Console

**Host:** `app.kiyu.test`  
**Experience:** Organization-level management interface; desktop-first.

Primary navigation:

1. Dashboard
2. Facilities
3. Users & Invitations
4. Departments
5. Stations
6. Workflows
7. Monitoring
8. Reports
9. Subscription
10. Payments

Requirements:

- Manage the organization and its facilities.
- Provide an organization-level facility selector/filter where relevant.
- Distinguish organization-wide data from a specific facility's data.
- Support invitation and user management according to backend permissions.
- Manage operational configuration exposed by the App API context.
- Display subscription, plan, add-on, feature, and capacity information from backend responses.
- Do not assume the organization has only one facility.
- Do not let organization-level navigation imply access to tenant workforce endpoints; use App API context for App Console operations.

### 5.3 `facility_admin` — Facility Management

**Host:** `{tenant}.kiyu.test`  
**Experience:** Facility-level management and operations; desktop-first, responsive for tablets.

Primary navigation:

1. Dashboard
2. Reception
3. Queue Monitor
4. Tickets
5. Queue Sessions
6. Customers
7. Departments
8. Stations
9. Workflows
10. Devices
11. Reports

Requirements:

- All data and operations must be scoped to an accessible facility.
- Provide a facility selector only when the signed-in user has more than one accessible facility.
- If the backend auto-selects the only active facility, use that result rather than inventing a client-side selection rule.
- Support facility configuration and daily operations only where the Tenant API and permission contract allow it.
- Device management must support the actual kiosk/display pairing workflows.
- Do not expose organization-wide billing or Platform Portal functions here.

### 5.4 `operator` — Reception / Front Desk

**Host:** `{tenant}.kiyu.test`  
**Experience:** Task-oriented operational interface; optimized for speed and reduced navigation complexity.

Primary navigation should be limited to permitted operational features, typically:

1. Operational Overview (lightweight, not an administrative dashboard)
2. Reception
3. Queue Monitor
4. Queue Acquisitions / Queue Intake
5. Tickets
6. Customers
7. Reports (only when permission allows)

Requirements:

- Reception/intake is the primary workflow and should be easy to reach.
- Minimize clicks for registering/checking in customers and performing permitted queue actions.
- Avoid facility configuration, subscription, billing, feature registry, and other administrator-only navigation.
- Render menus from actual permissions and backend capability data, not only from the role name.

### 5.5 `staff` — Service Workstation

**Host:** `{tenant}.kiyu.test`  
**Experience:** Dedicated service workstation; task-first, not a conventional dashboard.

The default Staff landing page must be a **single primary Service Workstation**, not an analytics dashboard and not a full management sidebar.

The workstation should prioritize:

- Current/active ticket.
- Customer and visit information relevant to the current service.
- Current station/department context.
- Next waiting queue or queue preview, when supported.
- Large, clearly labeled actions for valid backend transitions, such as Call Next, Recall, Hold, Resume, Complete, Skip, No-show, or Transfer — but only include each action if the backend supports it for the current role/state.
- Clear loading, empty, success, error, and disabled states.

Requirements:

- Keep the primary screen focused. Do not overload it with unrelated cards and analytics.
- Do not show a dashboard sidebar by default.
- Secondary capabilities such as ticket history or service transfers may be shown in a drawer, dialog, compact secondary route, or another clearly separated surface when supported.
- Prevent invalid or duplicate actions through pending states and backend response handling. The backend still validates state transitions.
- Confirm destructive or irreversible actions where appropriate.

### 5.6 `customer` — Customer Self-Service Portal

**Host:** `{tenant}.kiyu.test`  
**Experience:** Mobile-first, self-service, no conventional dashboard/sidebar.

Primary bottom navigation:

1. Home
2. Booking
3. My Queue
4. Profile

Requirements:

- Home shows relevant tenant information and the Customer's useful current state.
- Booking allows a Customer to book a queue/session using backend-supported departments and the supported booking request. Do not invent facility selection or additional booking fields if the backend derives them.
- My Queue shows the Customer's own active/recent queue sessions and their status.
- Profile shows Customer profile information and supported profile actions. Visit/history information may be included here or under My Queue where it makes sense.
- Use the public tenant endpoint for public tenant/department information where appropriate.
- Customer must only see their own records as returned by the backend.
- Do not add payment, doctor selection, appointment scheduling, or other workflows unless those capabilities exist in the backend contract.
- On larger screens, adapt the same simple information architecture without turning it into the workforce management dashboard.

### 5.7 Kiosk Device Interface

**Host:** `{tenant}.kiyu.test`  
**Route:** `/kiosk`  
**Experience:** Full-screen, touch-first device UI.

Requirements:

- Not a standard user login page.
- Use the paired device credential (`X-Kiosk-Token`) for protected kiosk operations, not a user bearer token.
- Support the actual device pairing and queue intake contract.
- Make touch targets large and readable; minimize text entry and unnecessary controls.
- Avoid admin sidebar/header navigation.
- Provide clear unpaired, pairing, ready, submitting, success, recoverable error, and revoked/invalid-device states.
- Do not expose device tokens in page content, URLs, logs, or client-visible diagnostics.

### 5.8 Display Device Interface

**Host:** `{tenant}.kiyu.test`  
**Route:** `/display`  
**Experience:** Full-screen public queue signage, readable from a distance.

Requirements:

- Not a standard user login page.
- Use the paired display credential (`X-Display-Token`) only for device-authenticated operations that require it. Respect any public tenant-origin-bound display endpoint defined by the backend.
- No sidebar or normal application navigation.
- Prioritize current/serving numbers, called tickets, waiting information, and other data actually exposed by the backend.
- Support responsive signage layouts for common TV/display aspect ratios.
- Handle refresh/reconnection and stale data visibly but unobtrusively.
- Do not show private Customer information on a public display.

---

## 6. API Context and Integration Requirements

The frontend must use the API context boundaries defined by the backend. The expected context map is:

| Context | API prefix | Expected host context | Principal |
|---|---|---|---|
| Public | `/api/public` | `kiyu.test` or tenant public experience as contract permits | None |
| Customer | `/api/customer` | `{tenant}.kiyu.test` | `customer` |
| App | `/api/app` | `app.kiyu.test` | `tenant_admin` |
| Tenant | `/api/tenant` | `{tenant}.kiyu.test` | `facility_admin`, `operator`, `staff` |
| Portal | `/api/portal` | `portal.kiyu.test` | `platform_admin` |
| Webhooks | `/api/webhooks` | Backend/provider integration | Not called by browser UI |

The exact API base URL must come from environment configuration. The expected development API origin is `api.kiyu.test`; do not hardcode it inside feature modules.

### 6.1 API client architecture

- Provide separate typed API clients for Public, Customer, App, Tenant, and Portal contexts.
- A shared low-level HTTP transport may be used, but endpoint namespaces, auth injection, error handling, and session selection must remain explicit per context.
- Do not call an endpoint from the wrong context merely because its response looks similar.
- Define typed request/response contracts from the backend's actual API contract. Avoid `any` and broad unsafe casts.
- Normalize API errors in one shared, typed way while preserving field-level validation errors for forms.
- Handle network errors, timeouts, rate limits, validation errors, unauthenticated responses, and forbidden responses distinctly.
- Do not silently swallow errors or display a success toast when the server operation failed.
- Avoid duplicate requests and stale state when users switch facilities, tenant contexts, or tabs.
- Use cache invalidation/refetch strategies appropriate to mutations and rapidly changing queue data.

### 6.2 Origin and authorization

The backend may use request `Origin` as a context selector. `Origin` is **not authentication** and does not replace token abilities, roles, tenant membership, facility access, or policy checks.

Frontend requirements:

- Send the context/origin information exactly as required by the backend contract and deployment configuration.
- Do not trust frontend role claims for access control.
- Do not rely on hidden buttons or hidden menu items as security controls.
- Treat `401` and `403` separately: authentication expiry/absence versus authenticated-but-forbidden.

### 6.3 Facility scope

The expected backend contract uses `facility_id` as a query parameter for reads and in the JSON body for mutations. Do not invent a facility header or facility middleware convention.

- Use only facility IDs returned for the signed-in identity or organization.
- Include facility scope where required by the endpoint contract.
- Respect backend auto-selection when exactly one active facility exists.
- Clear or refetch facility-scoped data whenever the selected facility changes.
- Never allow an arbitrary client-provided facility ID to bypass backend access checks.

### 6.4 Entitlements and capacity

Feature/menu availability must be derived from backend entitlement data, including fields such as release/availability, entitlement sources, type, reason code, and capacity limit/used/remaining where exposed.

- Do not determine feature access from plan name alone.
- Do not assume a feature is usable just because it is visible in the UI.
- Distinguish not released, not available, not entitled, and capacity exhausted where the API provides those states.
- Use entitlements to render menus, disabled states, upgrade messages, and capacity indicators.
- Backend authorization remains authoritative even when the UI hides or disables a feature.

### 6.5 No invented backend capabilities

Before implementing every action, identify the backend endpoint and request/response model. If there is no supporting endpoint:

1. Do not simulate a successful action.
2. Do not persist important state only in frontend memory.
3. Do not create a fake workflow or sample data in production screens.
4. Mark the feature as blocked/out of scope and report the missing backend capability.

Mock data is acceptable only for isolated visual development and must be clearly separated from production data paths and removed/disabled before completion.

---

## 7. UI System and shadcn/ui Rules

The existing project already has shadcn/ui installed and a dashboard template. Build on that foundation.

### 7.1 Mandatory component discovery rule

**Before creating any UI component, first check the official shadcn/ui documentation and component registry.**

Official references:

- Components: `https://ui.shadcn.com/docs/components`
- Installation: `https://ui.shadcn.com/docs/installation`
- CLI: `https://ui.shadcn.com/docs/cli`
- Registry directory: `https://ui.shadcn.com/docs/registry/directory`

If shadcn/ui already provides the required component:

1. Install it using the shadcn CLI from the frontend project directory.
2. Use the installed component and its documented API.
3. Customize it through supported variants, composition, and project theme tokens.
4. Do not manually recreate a duplicate implementation.

Use the project's existing package manager and lockfile. Follow the CLI command appropriate for the project, for example `pnpm dlx shadcn@latest add <component>` or the equivalent command for the installed package manager. Do not run a second initialization over the already initialized project without a documented need.

### 7.2 Custom component restrictions

- Do not create custom foundational UI primitives when an equivalent shadcn component exists.
- Do not create a custom Button, Input, Select, Dialog, Sheet, Dropdown, Tabs, Tooltip, Toast/Sonner, Table, Calendar, Form primitive, or similar replacement if a suitable shadcn component exists.
- Do not add another component library to solve a problem already covered by shadcn/ui.
- Domain-specific page compositions are allowed when needed, but they must be composed from existing shadcn components and remain focused on KIYU business workflows.
- If no suitable shadcn component exists, document the search result first. Compose existing primitives where possible. Only create a narrowly scoped custom component when composition cannot reasonably meet the requirement.
- Review third-party registry code before installing it. Prefer official shadcn components over community registry components.

### 7.3 Design principles

- Use a clean, restrained, professional SaaS visual language.
- Prefer light theme as the default unless the installed template already establishes a deliberate theme strategy.
- Use neutral surfaces and a controlled brand accent. Do not invent a new color palette without reviewing existing theme tokens and branding assets.
- Use semantic colors consistently for success, warning, destructive, informational, and neutral states.
- Avoid excessive gradients, glassmorphism, decoration, and unnecessary animation.
- Avoid card sprawl. Use cards only when they establish meaningful grouping or hierarchy.
- Prioritize information hierarchy, spacing, readability, and clear action affordances.
- Keep typography and spacing consistent across contexts while allowing each context to have a different layout.
- Preserve keyboard access, visible focus states, semantic labels, and sufficient contrast.

### 7.4 Experience-specific layout rules

| Experience | Layout requirements |
|---|---|
| Public Website | Marketing layout, responsive header/footer, no authenticated dashboard chrome |
| App Console | Desktop-first management shell, sidebar navigation, organization-level context |
| Platform Portal | Separate management shell, platform-specific navigation and identity |
| Facility Admin | Facility management shell with facility context and operations navigation |
| Operator | Compact operational shell; prioritize reception and queue work |
| Staff | Dedicated service workstation; no conventional dashboard/sidebar by default |
| Customer | Mobile-first, simple navigation with bottom tab bar; no management sidebar |
| Kiosk | Full-screen touch UI, no normal app chrome |
| Display | Full-screen signage, no normal app chrome |

Do not force Customer, Staff, Kiosk, and Display into the same dashboard template simply because the initial project template is a dashboard.

---

## 8. Navigation and Route-Level Loading Requirements

### 8.1 Skeleton loading is mandatory for every page transition

**Every navigation that changes the current page/route must show an appropriate skeleton loading state.** This is a core product requirement, not an optional enhancement.

Implementation requirements:

- Use the loading conventions supported by the installed Next.js App Router version, including route-segment `loading.tsx` and/or Suspense boundaries where appropriate.
- Add route-level skeletons for every page or route segment that can take the user to a different page.
- Do not rely only on `loading.tsx` if route prefetching/caching prevents the required pending state from appearing. Verify real navigation behavior and add a route-transition pending presentation where necessary so every page transition has the required skeleton feedback. Avoid a visible flash when the destination is already ready instantly.
- Skeleton structure must resemble the destination page layout: sidebar/header plus content placeholders for management pages, a focused workstation skeleton for Staff, mobile content and bottom navigation for Customer, and device-specific skeletons for Kiosk/Display where needed.
- Avoid using a single generic centered spinner as the only page-navigation loading state.
- Keep shared layout stable while destination content loads where the framework supports it.
- Ensure nested routes and dynamic tenant routes have loading coverage, not just the top-level dashboard route.
- Loading skeletons must not expose previous-user or previous-tenant data while a new context is loading.
- Do not show stale content from a previous facility/customer/session as if it belonged to the newly selected context.

For actions that do not navigate to another page, use appropriate local pending/loading feedback instead of unnecessarily replacing the entire page. Examples include submitting forms, changing a ticket state, pairing a device, and saving settings.

### 8.2 Other required states

Every data-driven page must handle:

- Initial loading.
- Background refresh where relevant.
- Empty state with a useful next step.
- Recoverable error with retry where appropriate.
- Permission denied / unavailable feature.
- Validation errors.
- Disabled or pending action states.
- Success confirmation for completed mutations.

Do not leave blank pages, infinite spinners, or unhandled rejected promises.

---

## 9. Frontend Architecture and Code Quality

### 9.1 Architecture principles

- Use the existing App Router and project conventions after inspecting them.
- Keep route composition separate from feature/business logic.
- Prefer Server Components by default when compatible with the chosen data/session architecture. Use Client Components only for genuine interactivity, browser-only APIs, local UI state, and event handling.
- Keep server-only code, secrets, and token handling out of client bundles.
- Do not put all API calls, types, validation, and UI in a single page file.
- Avoid giant shared components with many role/context conditionals.
- Avoid unnecessary abstractions and premature generic frameworks.
- Use descriptive names and predictable file locations.
- Use strict TypeScript. Avoid `any`, `@ts-ignore`, unsafe casts, and silent fallbacks unless there is a documented, narrow reason.
- Keep components small enough to understand, but do not split every few lines into a new file.
- Centralize route definitions, context definitions, API configuration, permissions, and navigation metadata where useful.
- Keep business rules in backend services. Frontend code should present state and coordinate user interactions, not become a second source of truth.

### 9.2 Suggested folder structure

Adapt this structure to the installed template rather than blindly moving files. The goal is discoverability and separation of concerns.

```text
src/
├── app/
│   ├── (public)/
│   ├── (app-console)/
│   ├── (tenant-workspace)/
│   ├── (customer-portal)/
│   ├── (platform-portal)/
│   └── ... route loading and error boundaries
│
├── components/
│   ├── ui/                 # shadcn-managed components only
│   ├── shared/             # cross-context compositions, not replacement primitives
│   └── layouts/            # reusable shell parts only where genuinely shared
│
├── modules/
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
├── contexts/
│   ├── public/
│   ├── app/
│   ├── tenant/
│   ├── customer/
│   └── portal/
│
├── lib/
│   ├── api/
│   │   ├── transport/
│   │   ├── public/
│   │   ├── app/
│   │   ├── tenant/
│   │   ├── customer/
│   │   └── portal/
│   ├── auth/
│   ├── host-routing/
│   ├── tenant/
│   ├── permissions/
│   ├── validation/
│   └── utilities/
│
├── config/
│   ├── navigation/
│   ├── routes/
│   └── environment/
│
└── types/
    ├── api/
    └── domain/
```

Important notes:

- The route-group names above are logical boundaries, not a requirement to create conflicting root routes. The host-resolution/rewrite strategy must be designed for the installed Next.js version and tested across all hostnames.
- If the current template uses a different but clear structure, retain it and map these responsibilities to the existing layout.
- Do not create empty folders for every proposed module. Add modules when implementing a real feature.
- Keep shadcn-generated UI files in the configured shadcn directory.

### 9.3 State and data management

- Inspect existing dependencies before adding a data-fetching or state-management library.
- Use one consistent server-data strategy; do not mix several overlapping cache/state libraries without justification.
- Separate server state from transient UI state.
- Scope cached data by authentication context, tenant, facility, and relevant resource identifiers.
- Clear or invalidate sensitive caches on logout, tenant changes, facility changes, and context changes.
- Do not use global client state as the source of truth for authorization or business state.
- For rapidly changing queue data, use the backend-supported refresh/realtime mechanism. Do not invent WebSocket/event channels if the backend does not provide them.

### 9.4 Forms and validation

- Use the project's installed form and validation tooling if it is already suitable.
- Validate user input on the client for usability, but the backend remains authoritative.
- Reuse API validation messages and map field errors to their corresponding fields.
- Disable duplicate submission while a request is pending.
- Keep forms accessible: labels, descriptions, required indicators, and clear error messaging.
- Use confirmation for destructive or irreversible operations.

### 9.5 Responsive behavior and accessibility

- Management pages must work on desktop and remain usable on tablet/mobile where practical.
- Customer experience must be designed mobile-first.
- Kiosk must support touch-first interaction.
- Display must prioritize distance readability and common landscape screen dimensions.
- All interactive elements must be keyboard accessible where applicable.
- Use semantic HTML, accessible names, focus management for dialogs/sheets, and appropriate ARIA only when needed.

---

## 10. Feature and Page Delivery Scope

Build the application shell and authentication foundations first, then implement feature pages according to backend support.

### Phase 1 — Foundation

- Inspect repositories and produce `FRONTEND_IMPLEMENTATION_PLAN.md`.
- Preserve and clean up the installed shadcn dashboard template.
- Establish environment configuration and host resolution.
- Establish separate application shells and context boundaries.
- Establish typed API transport and context-specific API clients.
- Establish safe session/token handling and logout behavior.
- Establish theme tokens, typography, responsive primitives, and skeleton patterns using shadcn components.
- Establish route-level loading and error boundaries.

### Phase 2 — Authentication and context routing

- Public website with no auth routes.
- App Console login and signup, including signup-then-login behavior.
- Tenant login with Staff/Admin and Customer tabs.
- Customer registration visibility controlled by `allow_public_registration`.
- Platform Portal login only.
- Context-specific post-login routing.
- Expired-session and forbidden-state handling.

### Phase 3 — Management interfaces

- App Console (`tenant_admin`) pages supported by the App API context.
- Platform Portal (`platform_admin`) pages supported by the Portal API context.
- Facility Admin pages supported by Tenant API permissions and facility scope.
- Entitlement/capacity-aware navigation and feature states.

### Phase 4 — Operational interfaces

- Operator reception and queue-intake workflow.
- Queue monitor and permitted ticket/queue operations.
- Staff Service Workstation and valid ticket lifecycle actions.
- Operational empty/loading/error states and action feedback.

### Phase 5 — Customer and device interfaces

- Customer mobile-first portal and bottom navigation.
- Customer booking and own queue-session views.
- Kiosk pairing/runtime experience.
- Display pairing/runtime signage experience.
- Reconnection and device credential error states.

### Phase 6 — Stabilization

- End-to-end tests for key context/auth/role flows.
- Responsive and accessibility review.
- Security review of host resolution, cookies/session handling, and context isolation.
- Type checks, lint, tests, and production build.
- Remove unused template demo content and mock data.
- Document environment variables, local host setup, and known backend limitations.

Do not build all screens as static placeholders and claim the product is complete. Prioritize end-to-end working workflows backed by real endpoints.

---

## 11. Quality Assurance and Acceptance Criteria

The rebuild is acceptable only when the following criteria are met.

### 11.1 Domain and routing

- `kiyu.test` renders the Public Website and has no login or sign-up page.
- `app.kiyu.test` exposes `/login` and `/signup`.
- `{tenant}.kiyu.test` exposes the tabbed Staff/Admin and Customer authentication experience.
- Customer registration is shown only when the backend says public registration is enabled.
- `portal.kiyu.test` exposes login only.
- Unknown tenant hosts fail safely and do not leak another tenant's data.
- All hostnames resolve to the correct application shell in local development.

### 11.2 Authentication and security

- App, Tenant, Customer, and Portal authentication use their correct API contexts.
- Customer and workforce sessions remain isolated even on the same tenant hostname.
- App signup does not assume it receives a token; the user is directed to login after successful signup.
- Staff accounts cannot self-register through the Customer registration form.
- Tokens are not stored in localStorage or exposed to client-side JavaScript.
- Logout clears/revokes only the relevant context session.
- UI permission checks are backed by backend authorization; direct API access remains protected by the backend.
- Changing host, slug, role, or facility in the browser cannot bypass backend tenant/facility authorization.

### 11.3 Role experiences

- Platform Admin sees platform management, not tenant workforce navigation.
- Tenant Admin sees organization management on App Console.
- Facility Admin sees facility-scoped management and operations.
- Operator sees a reduced operational interface centered on reception.
- Staff lands on a focused Service Workstation, not an analytics dashboard.
- Customer receives a mobile-first self-service interface with bottom navigation and no management sidebar.
- Kiosk and Display run as device interfaces using device credentials, not normal user sessions.

### 11.4 UI component policy

- Existing shadcn components are reused where suitable.
- New shadcn components are installed through the shadcn CLI.
- No duplicate custom foundational UI primitives are introduced when shadcn provides an equivalent.
- Any necessary custom domain composition is documented and built from existing primitives wherever possible.
- The existing dashboard template is reused selectively rather than copied into every experience.

### 11.5 Loading and page states

- Every page transition has a destination-appropriate skeleton.
- Nested and dynamic routes have loading coverage.
- Forms and mutations show local pending states and prevent duplicate submission.
- Data-driven pages provide loading, empty, error, forbidden/unavailable, and success states as applicable.
- No page is left blank or stuck in an infinite loading state after an error.

### 11.6 Code quality

- TypeScript type-check passes.
- Lint passes.
- Production build passes.
- Critical auth, host routing, and workflow tests pass.
- No unexplained `any`, `@ts-ignore`, dead demo pages, fake production data, or unhandled promise rejections remain.
- API calls use typed context-specific clients.
- Folder structure and module naming are consistent and easy for another developer/agent to navigate.

---

## 12. Required Test Scenarios

At minimum, automate or document reproducible tests for:

1. Public hostname loads marketing pages and does not expose auth pages.
2. App signup succeeds, then requires a separate login.
3. App login creates only an App-context session.
4. Tenant Staff/Admin login uses the Tenant authentication endpoint.
5. Tenant Customer login uses the Customer authentication endpoint.
6. Customer registration is hidden/blocked when `allow_public_registration` is false.
7. Customer and workforce sessions do not overwrite or reuse one another.
8. Portal login is isolated from all other contexts.
9. A user cannot access a page or API operation outside assigned permissions.
10. Facility switching invalidates/refetches facility-scoped data.
11. A user with one active facility follows backend auto-selection behavior.
12. Staff ticket actions reflect valid backend state transitions and handle rejected transitions.
13. Kiosk pairing uses a device token and does not require a normal user login.
14. Display uses only permitted display data and does not expose private Customer information.
15. Every route transition displays the correct skeleton.
16. Expired/invalid sessions return to the correct context login page.
17. Unknown tenant hostnames do not resolve to another tenant's content.

---

## 13. Environment and Local Development

Use environment variables for hostnames and API origin. Provide an `.env.example` with safe placeholder values and document the expected local DNS/hosts-file setup.

Expected local host pattern:

```text
kiyu.test
app.kiyu.test
portal.kiyu.test
api.kiyu.test
{tenant}.kiyu.test
```

Do not hardcode these values in page components. Centralize host and API configuration.

Do not commit secrets, access tokens, private keys, or real production credentials. Ensure environment variables intended only for server-side use do not use a `NEXT_PUBLIC_` prefix.

---

## 14. Implementation Rules for Claude Code

These rules are mandatory throughout implementation:

1. **Inspect before changing.** Read the existing frontend and backend before making architectural decisions.
2. **Backend contract first.** Do not invent endpoints, fields, permissions, or business rules.
3. **Preserve the existing setup.** Reuse the installed Next.js/shadcn dashboard foundation and existing package manager.
4. **Search shadcn first.** Before creating a UI component, search official shadcn documentation/registry. Install an available component using the shadcn CLI.
5. **Separate contexts.** Do not mix App, Tenant, Customer, and Portal API/authentication flows.
6. **One codebase, separate shells.** Share design foundations, not role-specific business behavior.
7. **Skeleton on every route transition.** This applies to all route-level page navigation.
8. **No fake functionality.** A visible action must either work through a real backend capability or be clearly unavailable/out of scope.
9. **Use strict typing.** Keep API models, forms, and feature state typed.
10. **Keep the code understandable.** Favor clear naming, focused modules, and predictable folder locations over clever abstractions.
11. **Verify continuously.** Run type checking, linting, tests, and build after meaningful milestones. Fix regressions before moving on.
12. **Do not modify the backend.** If a backend gap is discovered, report it with the relevant endpoint/contract evidence instead of silently changing Laravel code.
13. **Do not stop after generating a plan.** Once reconnaissance is complete, implement the approved requirements in working increments.
14. **Report completion honestly.** List implemented features, tests run, known blockers, backend gaps, and incomplete requirements. Never claim a workflow works if it uses mock data or has not been verified.

---

## 15. Definition of Done

The frontend rebuild is done when:

- All four web application contexts are correctly routed by hostname.
- The Public Website has no auth page; App Console has Login and Sign Up; Tenant host has the tabbed Staff/Admin and Customer auth experience; Platform Portal has Login only.
- Each role receives its intended layout and navigation.
- Staff uses a focused Service Workstation.
- Customer uses a mobile-first self-service portal with bottom navigation.
- Kiosk and Display are full-screen device experiences using device credentials.
- All implemented workflows are connected to the correct backend context and respect permissions, tenant boundaries, facility scope, and entitlements.
- Every page transition displays a suitable skeleton loading state.
- shadcn/ui is the primary UI foundation and the component discovery/install rule has been followed.
- Type checks, lint, automated tests, and production build pass.
- No known critical security, routing, or context-isolation issue remains unresolved.
- Documentation for setup, architecture, environment variables, and known limitations is included in the frontend repository.



---

## Appendix A. Known Backend Endpoint Families to Verify

The following endpoint families are already identified in the current KIYU API contract context. They are a starting point for reconnaissance, **not permission to assume undocumented request/response fields**. Verify exact methods, payloads, permissions, and response shapes in `docs/API_CONTRACT.md` and the Laravel source before implementation.

| Context | Known endpoint families / capabilities |
|---|---|
| Public | `GET /api/public/tenants/{slug}` for public tenant information and registration/tenant capability discovery as exposed by the response |
| Customer | `/api/customer/auth/register`, `/login`, `/me`, `/logout`; Customer profile; Customer-owned queue sessions; booking creation |
| App | `/api/app/auth/signup`, `/login`, `/me`, `/logout`; organization dashboard; facilities; users/invitations; departments; stations; workflows; monitoring; reports; billing; subscription; add-ons |
| Tenant | `/api/tenant/auth/login`, `/me`, `/logout`; invitation acceptance; reception; queue/ticket operations; Customer records; departments; stations; workflows; devices; reports; supported messaging actions |
| Portal | `/api/portal/auth/login`, `/me`, `/logout`; platform dashboard; tenants; subscriptions; payments; plans; add-ons; feature registry; reports; audit logs; settings |
| Device | Tenant device pairing and runtime flows for Kiosk and Display; device runtime authentication uses device credentials rather than standard user tokens |

Additional contract constraints already identified and requiring verification:

- App signup creates the tenant, owner, first facility, and trial subscription but does not issue a login token. The frontend must perform a separate App login.
- Customer booking is currently exposed through the Customer context and derives facility from the selected department; verify the exact booking request model before building the form.
- Tenant device pairing includes separate Kiosk and Display pairing operations. Kiosk runtime uses `X-Kiosk-Token`; Display runtime uses `X-Display-Token` where required by the contract.
- Customer registration depends on the tenant's `allow_public_registration` setting.
- Facility scope is supplied through `facility_id` in the query string for reads and in the JSON body for mutations where required. Do not invent a facility header.
- When the identity has exactly one active facility, the backend may auto-select it. Follow the actual response and contract.
- Entitlement responses expose release/availability, entitlement/source/reason details, and capacity information. Use those values rather than inferring access from plan names.

If the local backend has changed since this endpoint map was written, the current local backend implementation and API contract take precedence. Update `FRONTEND_IMPLEMENTATION_PLAN.md` with the verified contract before coding the affected feature.
