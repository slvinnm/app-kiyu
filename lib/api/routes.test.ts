import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * The backend renamed its domain (`clients` → `customers`, `visits` →
 * `queue-sessions`, `referrals` → `service-transfers`, `/clinical/*` →
 * `/queue/*`). The frontend kept calling the old paths for a while, so 60 call
 * sites returned 404 while nothing failed to compile — a `fetch` string is not
 * type-checked against the API.
 *
 * This test is the guard: it scans the source for a request path built from a
 * retired prefix and fails. It deliberately only looks at string literals that
 * start with `/` inside a fetch call, so ordinary mentions of the words in
 * prose or file names do not trip it.
 */

const ROOTS = ["lib", "app", "components", "hooks"]
const EXTENSIONS = [".ts", ".tsx"]

/** Retired prefixes and what replaced them, for the failure message. */
const RETIRED: Record<string, string> = {
  "/clients": "/customers",
  "/visits": "/queue-sessions",
  "/referrals": "/service-transfers",
  "/clinical/": "/queue/",
  "/reports/visits/": "/reports/queue-sessions/",
}

function sourceFiles(dir: string): string[] {
  const out: string[] = []

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      out.push(...sourceFiles(path))
      continue
    }

    if (EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      out.push(path)
    }
  }

  return out
}

/**
 * Every `/path` literal that appears as the first argument of a fetch-style
 * call. Matches both `apiFetch("/x", …)` and backtick template literals.
 */
function requestPaths(source: string): string[] {
  const paths: string[] = []
  const pattern = /(?:apiFetch|serverApiFetch|postJson)<?[^(]*\(\s*[`"](\/[^`"]*)[`"]/g

  for (const match of source.matchAll(pattern)) {
    paths.push(match[1])
  }

  return paths
}

describe("API request paths", () => {
  it("never target a retired backend route", () => {
    const violations: string[] = []

    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        for (const path of requestPaths(readFileSync(file, "utf8"))) {
          for (const [retired, replacement] of Object.entries(RETIRED)) {
            if (path === retired || path.startsWith(`${retired}/`) || path.startsWith(`${retired}?`)) {
              violations.push(`${file}: "${path}" — use "${replacement}"`)
            }
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("finds the request paths it is supposed to check", () => {
    // A self-check: if the matcher stops matching (a refactor changes the call
    // shape), the guard above would pass vacuously and hide real regressions.
    const paths = sourceFiles("lib/api").flatMap((file) =>
      requestPaths(readFileSync(file, "utf8"))
    )

    expect(paths.length).toBeGreaterThan(30)
    expect(paths.some((path) => path.startsWith("/customers"))).toBe(true)
    expect(paths.some((path) => path.startsWith("/queue-sessions"))).toBe(true)
  })
})
