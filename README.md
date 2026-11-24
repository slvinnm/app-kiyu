# KIYU — Frontend

Next.js 16 App Router frontend for the KIYU clinic queue system. It is the UI
for the Laravel API: admin console, receptionist desk, clinical station
workspace, patient portal, self-service kiosk, and public queue display.

## Architecture

- **Auth** — `lib/actions/auth.ts` logs in against the Laravel API and stores the
  Sanctum token plus user claims in an HMAC-signed, HttpOnly cookie
  (`lib/auth/session-core.ts`). Browser JavaScript never sees the token.
- **Authorization** — `requireRole()` (`lib/auth/guard.ts`) runs in each workspace
  layout and reads the account from `/auth/me`, so a demoted or reassigned user
  loses access immediately. `proxy.ts` only checks that a signed cookie exists.
- **API access** —
  - server components: `lib/api/server.ts` (`serverApiFetch`)
  - browsers: `app/api/backend/[...path]/route.ts`, which attaches the bearer token
  - kiosk/display: `app/api/device/[...path]/route.ts`, which attaches a device
    credential kept in a signed HttpOnly cookie
- **Realtime** — Laravel Reverb over `laravel-echo`; public display uses the
  `public.facility.{id}` channel, staff pages poll as a fallback.

## Scripts

```bash
npm run dev        # dotenvx run -- next dev
npm run build      # production build
npm run start      # serve a production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
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
| `/admin/*` | admin console |
| `/receptionist/*` | reception desk |
| `/staff/*` | clinical station workspace |
| `/client/*` | patient portal |
| `/kiosk` | self-service kiosk (pair with an admin code) |
| `/display` | public queue display (pair with an admin code) |
| `/track/[token]` | public visit tracking link |