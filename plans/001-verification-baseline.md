# Plan 001: Establish a verification baseline (Vitest + green lint)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 44df395..HEAD -- package.json eslint.config.mjs lib/auth lib/api/origin.ts`
> If any of those files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests / dx
- **Planned at**: commit `44df395`, 2026-11-24

## Why this matters

The frontend has no test runner, no test script, and no CI. `npm run lint`
exits 1 today because ESLint walks two vendored agent-skill trees
(`.agents/**`, `.claude/**`) and trips `react-hooks/rules-of-hooks` on their
bundled `fx.js`. That means there is no single command that proves the app is
healthy, and every subsequent plan in this series (role rewrite, endpoint
rewrite, session-shape change) is unverifiable except by clicking through the
UI.

After this plan: `npm test` runs, `npm run lint` exits 0, and the auth/session
primitives have real assertions — so plans 002–005 can each be checked
objectively.

## Current state

Relevant files:

- `package.json` — scripts and dependencies. No `test` script, no test framework.
- `eslint.config.mjs` — flat config; `globalIgnores` at lines 19–25.
- `lib/auth/session-core.ts` — pure, dependency-free session cookie primitives
  (`serializeSession`, `parseSession`, `readSessionFromCookieHeader`,
  `SESSION_COOKIE_NAME`). Ideal first unit-test target: signed cookie
  round-trip, tamper rejection, cookie-tossing rejection.
- `lib/auth/origin.ts` — `isSameOrigin()` / `isStateChangingMethod()`. Takes a
  `NextRequest`; only `.headers.get()` and `.method` are used, so a plain
  `new Request(...)` works in tests.
- `lib/auth/route-access.ts` — `isGatedPath()`. Pure string logic.

Current `package.json` scripts (verified):

```json
"scripts": {
  "dev": "dotenvx run -- next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit"
}
```

Current `eslint.config.mjs` ignore block (lines 18–25):

```js
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
```

Baseline measured on this commit: `npx eslint` → `✖ 281 problems (15 errors,
266 warnings)`, exit code 1. All 15 errors are in
`.agents/skills/design-taste-frontend/assets/**` and
`.claude/skills/design-taste-frontend/assets/**` (vendored JS, not app code).
`npx tsc --noEmit` → exit 0.

Repo conventions to follow:

- Path alias `@/*` maps to the repo root (`tsconfig.json` `paths`).
- Comments state the *reason* a thing exists, not what it does — see the header
  comment style in `lib/auth/session-core.ts:1-10`. Match it.
- No test files exist yet; this plan creates the convention. Use
  `*.test.ts` colocated next to the unit under `lib/`.

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Install   | `npm install -D vitest` | exit 0 (adds to devDependencies) |
| Typecheck | `npm run typecheck`  | exit 0, no errors |
| Tests     | `npm test`           | all pass, exit 0 |
| Lint      | `npm run lint`       | exit 0, no errors (warnings allowed) |

## Scope

**In scope** (the only files you should modify):

- `package.json` (add `test` script, add `vitest` devDependency)
- `package-lock.json` (whatever `npm install` writes)
- `eslint.config.mjs`
- `vitest.config.ts` (create)
- `lib/auth/session-core.test.ts` (create)
- `lib/auth/origin.test.ts` (create)
- `lib/auth/route-access.test.ts` (create)

**Out of scope** (do NOT touch):

- Any file under `.agents/` or `.claude/` — vendored skill trees, not app code.
- `lib/auth/session-core.ts` and the other units under test. If a test cannot
  be written without changing the source, STOP and report (see STOP conditions).
- Adding CI workflows, Playwright, or component tests — out of scope for a
  baseline plan.

## Git workflow

- Branch: `advisor/001-vitest-baseline`
- One commit per step is fine; conventional commits, matching `git log`
  (`test: ...`, `chore: ...`, `fix: ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add Vitest and a test script

Run `npm install -D vitest`. Then add to `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "skills/**", ".agents/**", ".claude/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
```

**Verify**: `npm run typecheck` → exit 0; `npx vitest run --passWithNoTests` → exit 0.

### Step 2: Write the session-cookie tests

Create `lib/auth/session-core.test.ts`. Set the secret **before** importing the
module (it throws at import when `AUTH_SECRET` is empty):

```ts
import { beforeAll, describe, expect, it } from "vitest"

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-not-a-real-credential"
})

const { parseSession, readSessionFromCookieHeader, serializeSession, SESSION_COOKIE_NAME } =
  await import("@/lib/auth/session-core")
```

Assert these cases (all are behaviors the source comments promise):

1. **Round-trip** — `parseSession(serializeSession(session))` returns the same
   `token` and `user.role`.
2. **Tampered payload rejected** — flip one character of the payload segment
   before the `.`; `parseSession` returns `null`.
3. **Malformed values** — `""`, `"abc"`, `"a.b.c"`, `null` each return `null`
   and do not throw.
4. **Cookie tossing rejected** — a `Cookie` header carrying the session name
   twice returns `null` from `readSessionFromCookieHeader`
   (`lib/auth/session-core.ts:118-140` documents this).
5. **Naive cookie still parses** — single well-formed cookie header returns a
   session.

**Verify**: `npm test` → all pass.

### Step 3: Write the origin tests

Create `lib/auth/origin.test.ts`. `isSameOrigin` reads `APP_ORIGIN` at module
scope, so set `process.env.APP_ORIGIN = "https://app-kiyu.test"` in a
`beforeAll` and import dynamically (same pattern as Step 2).

Cases:

1. GET with no `Origin` → `true` (non-state-changing is allowed).
2. POST with no `Origin` → `false`.
3. POST with `Origin: https://app-kiyu.test` → `true`.
4. POST with `Origin: https://evil.test` → `false`.
5. POST with a malformed `Origin` (e.g. `"not a url"`) → `false`.
6. `isStateChangingMethod("PATCH")` → `true`; `("GET")` → `false`.

Build requests with `new Request("https://app-kiyu.test/api/x", { method, headers })`
and cast to the parameter type with `as unknown as NextRequest` — the function
only touches `.headers.get()` and `.method`.

**Verify**: `npm test` → all pass.

### Step 4: Write the route-access tests

Create `lib/auth/route-access.test.ts`. No env needed, static import is fine.

Cases:

1. `isGatedPath("/admin")` → `true`; `"/admin/users"` → `true`.
2. `"/client/dashboard"` → `true`.
3. `"/login"`, `"/"`, `"/kiosk"`, `"/display"`, `"/track/abc"` → `false`.
4. Prefix-boundary: `"/administrator"` → `false` (must not match `/admin`).

**Verify**: `npm test` → all pass.

### Step 5: Make lint green

Add the vendored skill trees to `globalIgnores` in `eslint.config.mjs`:

```js
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored agent-skill trees: third-party JS, not application code.
    ".agents/**",
    ".claude/**",
    "skills/**",
  ]),
```

**Verify**: `npm run lint` → exit 0 (`echo $?` right after). Warnings are
acceptable; **errors must be 0**. Also confirm app code is still linted:
`npx eslint components/login-form.tsx` → runs (does not print "ignored").

## Test plan

- New files: `lib/auth/session-core.test.ts`, `lib/auth/origin.test.ts`,
  `lib/auth/route-access.test.ts`.
- There is no existing test to model after — this plan establishes the
  pattern: colocated `*.test.ts`, dynamic import after env setup for
  modules that read env at module scope, assert the behaviors the source
  comments already claim.
- Verification: `npm test` → 3 files, all pass; `npm run lint` → exit 0.

## Done criteria

ALL must hold:

- [ ] `npm test` exits 0 and reports at least 14 passing assertions across the three files
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0 (0 errors)
- [ ] `git status` shows no file modified outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `lib/auth/session-core.ts` no longer throws when `AUTH_SECRET` is empty, or
  no longer exports the four symbols Step 2 imports.
- `lib/auth/origin.ts` reads a different env var than `APP_ORIGIN`.
- Making lint green requires editing source files (it should only require the
  ignore list).
- `npm install -D vitest` pulls a dependency that fails to install on Windows
  or conflicts with React 19 / Next 16 peer ranges.

## Maintenance notes

- Future tests that touch modules reading env at import time must set the env
  in `beforeAll` and import dynamically — static imports run before
  `beforeAll`. This plan's files demonstrate the pattern; keep it.
- When CI is added (separate plan), the gates are: `npm run typecheck`,
  `npm test`, `npm run lint`, `npm run build`.
- The lint ignore list is deliberately narrow (vendored trees only). Do not
  widen it to silence real app-code warnings.
