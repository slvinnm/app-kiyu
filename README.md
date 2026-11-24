# KIYU — Frontend

Next.js 16 App Router frontend for the KIYU queue-management SaaS. It is the UI
for the Laravel API: tenant administration console, operator desk, service-point
workspace, customer portal, self-service kiosk, and public queue display.

## Architecture

- **Auth** — `lib/actions/auth.ts` logs in against the Laravel API and stores the
  Sanctum token plus user claims in an HMAC-signed, HttpOnly cookie
  (`lib/auth/session-core.ts`). Browser JavaScript never sees the token.
- **Authorization** — `requireRole()` (`lib/auth/guard.ts`) runs in each workspace
  layout and reads the account from `/auth/me`, so a demoted or reassigned user
  loses access immediately. `proxy.ts` only checks that a signed cookie exists.
  The role/capability map lives in `types/auth.ts` (`CAPABILITIES`) and mirrors
  the backend's `role:` middleware.
- **API access** —
  - server components: `lib/api/server.ts` (`serverApiFetch`)
  - browsers: `app/api/backend/[...path]/route.ts`, which attaches the bearer token
  - kiosk/display: `app/api/device/[...path]/route.ts`, which attaches a device
    credential kept in a signed HttpOnly cookie
- **Facility context** — a user may reach several facilities. The selected one is
  sent as `X-Facility-Id`; the backend authorizes it and refuses rather than
  guessing (`plans/004-session-facility-realtime.md`).
- **Realtime** — Laravel Reverb over `laravel-echo`. Screens subscribe to the
  facility-scoped public channel `public.facility.{id}`; the tenant department and
  station channels are private and cannot be reached from the browser, because
  Echo cannot attach the HttpOnly session token.

## Scripts

```bash
npm run dev        # dotenvx run -- next dev
npm run build      # production build
npm run start      # serve a production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run format     # prettier
```

## Environment

Copy `.env.example` to `.env` and fill it in. `AUTH_SECRET` signs the session
cookie; `API_BASE_URL` is server-side only; `NEXT_PUBLIC_*` values reach the
browser. `APP_ORIGIN` pins the trusted origin for mutating requests.

## Entry points

| Path | Purpose |
| --- | --- |
| `/login`, `/signup` | account access |
| `/admin/*` | tenant administration console |
| `/receptionist/*` | operator desk |
| `/staff/*` | service-point workspace |
| `/client/*` | customer portal |
| `/kiosk` | self-service kiosk (pair with an admin code) |
| `/display` | public queue display (pair with an admin code) |
| `/track/[token]` | public queue-session tracking link |

## Documentation

- `FRONTEND_AUDIT.md` — architecture, route map, role matrix, risks
- `BACKEND_API_CONTRACT_MAP.md` — every API call vs the backend route
- `FRONTEND_API_GAPS.md` — outstanding contract gaps and decisions
- `BACKEND_CHANGELOG.md` — backend changes made for this frontend
- `plans/` — scoped implementation plans, executed in order
