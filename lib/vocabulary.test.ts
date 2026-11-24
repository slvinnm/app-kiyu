import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * PRD §1.2 / §14: the product is a general-purpose queue system, not a clinic.
 * No screen, route, message or fixture may use clinical vocabulary or collect
 * MRN / NIK / birth date / gender.
 *
 * This scan covers source (string literals AND identifiers) so a reintroduced
 * `Patient` type or "Pasien" label fails the build. It intentionally does not
 * cover docs, which quote the forbidden terms on purpose.
 */

const ROOTS = ["app", "components", "lib", "types"]

/** Matched case-insensitively against every source line. */
const FORBIDDEN = [
  /\bpasien\b/i,
  /\bpatient\b/i,
  /\bklinik\b/i,
  /\bclinic\b/i,
  /\brekam medis\b/i,
  /\bmrn\b/i,
  /\bnik\b/i,
  /\bdokter\b/i,
  /\bperawat\b/i,
  /\bfarmasi\b/i,
  /\blaboratorium\b/i,
  /\bclinical\b/i,
]

/**
 * Lines allowed to contain a forbidden token because they are a deliberate,
 * non-clinical use: the word "patient" in a comment about HTTP request
 * patience does not exist in this codebase, and identifiers such as
 * `patientId` are gone — so this list is intentionally empty. Add an entry only
 * with a reason.
 */
const ALLOWED_LINE_PATTERNS: RegExp[] = []

function sourceFiles(dir: string): string[] {
  const out: string[] = []

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      out.push(...sourceFiles(path))
      continue
    }

    if (
      (entry.endsWith(".ts") || entry.endsWith(".tsx")) &&
      !entry.includes(".test.")
    ) {
      out.push(path)
    }
  }

  return out
}

describe("product vocabulary", () => {
  it("contains no clinical terminology in source", () => {
    const violations: string[] = []

    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        const lines = readFileSync(file, "utf8").split("\n")

        lines.forEach((line, index) => {
          if (ALLOWED_LINE_PATTERNS.some((pattern) => pattern.test(line))) {
            return
          }

          for (const pattern of FORBIDDEN) {
            if (pattern.test(line)) {
              violations.push(
                `${file}:${index + 1}  ${pattern}  →  ${line.trim().slice(0, 90)}`
              )
            }
          }
        })
      }
    }

    expect(violations).toEqual([])
  })

  it("offers only the backend's station types", () => {
    // Guard against a future clinical enum creeping back into the form.
    const labels = readFileSync("lib/reception/format.ts", "utf8")

    for (const clinical of [
      "REGISTRATION",
      "NURSE",
      "DOCTOR",
      "LABORATORY",
      "PHARMACY",
      "BILLING",
    ]) {
      expect(labels).not.toContain(clinical)
    }
  })
})
