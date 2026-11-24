# Plan 005: Remove clinical terminology and medical-only fields

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 44df395..HEAD -- lib types app components hooks README.md`
> If anything changed, diff the "Current state" excerpts against live code
> before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/003-api-alignment.md
- **Category**: tech-debt / direction
- **Planned at**: commit `44df395`, 2026-11-24

## Why this matters

PRD §1.2 and §5 make "not a clinic" a hard product constraint: the UI must use
industry-neutral terms and must not collect MRN, NIK, date of birth, or gender
in the core intake flow. The current frontend is a clinic app:

- **Role vocabulary** in forms: `nurse`, `doctor`, `pharmacist`, `lab`,
  `billing`, `patient` (`lib/admin/roles.ts` — plan 002 already reduced the
  *assignable* set; this plan removes the display vocabulary and the leftover
  helpers).
- **Station types** the UI offers: `REGISTRATION`, `NURSE`, `DOCTOR`,
  `LABORATORY`, `PHARMACY`, `BILLING` (`lib/reception/format.ts:40-47`,
  `components/admin/stations/station-form-dialog.tsx:35-36`). The backend
  accepts only `INTAKE`, `SERVICE`, `CASHIER`, `COUNTER`
  (`backend/app/Enums/StationType.php`). Creating a station with the UI's
  default `REGISTRATION` returns 422 today.
- **Customer fields** the UI collects: NIK, MRN, date of birth, gender
  (`components/admin/clients/client-form-dialog.tsx:65-68`,
  `types/client.ts:49-57`, `app/client/onboarding/page.tsx:86-97`). The
  `customers` table has none of them (`name`, `phone`, `email`, `address`,
  `user_id` only).
- **Copy**: "Klinik", "rekam medis", "Poli", "Pasien", "Kunjungan",
  "Referral", "Station" across navigation, pages, and empty states.
- **Types**: `Patient*` aliases and a `Visit` model that plan 003 already
  aliased to `QueueSession`.

After this plan: the UI's vocabulary matches the backend's, the intake form
collects only what the API stores, and creating a station from the UI succeeds.

## Current state

- `lib/admin/roles.ts` — after plan 002: `ASSIGNABLE_ROLE_OPTIONS` (good) plus
  `staffRoleLabel` over six API roles (good). Confirm nothing clinical remains.
- `lib/reception/format.ts:40-47`:
  ```ts
  const STATION_TYPE_LABELS: Record<string, string> = {
    REGISTRATION: "Registrasi", NURSE: "Perawat", DOCTOR: "Dokter",
    LABORATORY: "Laboratorium", PHARMACY: "Farmasi", BILLING: "Kasir",
  }
  ```
  Also `genderLabel()` at `:73-90` — no backend consumer.
- `components/admin/stations/station-form-dialog.tsx:35-36` — `STATION_TYPES`
  list and `useState("REGISTRATION")` default; `:61`, `:82`, `:250`.
- `components/admin/stations/station-manager.tsx:40-41` — duplicate list.
- `components/admin/clients/client-form-dialog.tsx` — inputs `patient-nik`,
  `patient-mrn`, `date_of_birth`, `gender`; `PatientPayload` built at `:114-122`.
- `types/client.ts:49-57` — `ClientProfileInput` requires `nik`,
  `date_of_birth`, `gender`; `:59-65` — `Patient*` aliases.
- `app/client/onboarding/page.tsx:86-97` — copy mentions "rekam medis",
  "NIK", "MRN".
- `app/(dashboard)/client/dashboard/page.tsx:265-281` — renders `profile.mrn`,
  `profile.nik`, `profile.date_of_birth`.
- `lib/navigation.tsx` — labels `Poli`, `Station`, `Kunjungan`, `Referral`,
  `Klien`.
- `app/(dashboard)/receptionist/clients/page.tsx:53` — heading "Pasien".
- `app/(dashboard)/admin/queue/page.tsx` description — "data pribadi pasien".
- `types/reception.ts` — `StationType` union with clinical members; `Visit`
  alias (from plan 003).
- `README.md:3-5, 40-49` — "clinic queue system", "clinical station workspace",
  "patient portal".
- `components/staff/notes-dialog.tsx:55-58` — `htmlFor="clinical-notes"`.

PRD §5 mapping to apply: Patient→Customer, Clinical Queue→Queue Operations,
Clinical Department→Department, Station→Service Point, Receptionist→Operator,
Kunjungan→Queue Session, Referral→Service Transfer, Poli→Department.

Backend `StationType` values to use instead: `INTAKE` (Intake/registration),
`SERVICE` (general service), `CASHIER` (payment point), `COUNTER` (any other).

Repo conventions: Indonesian UI copy, English identifiers. Keep that split.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests     | `npm test`          | all pass |
| Lint      | `npm run lint`      | exit 0, 0 errors |
| Audit     | `grep -rniE 'pasien\|patient\|klinik\|clinic\|rekam medis\|mrn\|nik\|dokter\|perawat\|farmasi\|laboratorium' app components lib types` | no matches (allowed: README history, plan docs) |

## Scope

**In scope**:

- `lib/admin/roles.ts`, `lib/reception/format.ts`
- `components/admin/stations/station-form-dialog.tsx`,
  `components/admin/stations/station-manager.tsx`
- `components/admin/clients/client-form-dialog.tsx`,
  `components/admin/clients/client-manager.tsx`
- `components/receptionist/clients/client-directory.tsx`,
  `components/receptionist/clients/client-detail-sheet.tsx`
- `components/client/profile-form.tsx`
- `types/client.ts`, `types/reception.ts`, `types/admin.ts`
- `app/client/onboarding/page.tsx`
- `app/(dashboard)/client/dashboard/page.tsx`,
  `app/(dashboard)/client/profile/page.tsx`
- `app/(dashboard)/receptionist/clients/page.tsx`,
  `app/(dashboard)/receptionist/dashboard/page.tsx`
- `app/(dashboard)/admin/{clients,visits,referrals,queue,dashboard}/page.tsx`
  (headings/descriptions only)
- `lib/navigation.tsx` (labels only)
- `components/staff/notes-dialog.tsx` (id/label only)
- `README.md`
- `lib/reception/format.test.ts` (create)

**Out of scope** (do NOT touch):

- `C:\laragon\www\kiyu` — read-only. Do not add or remove columns.
- API URLs and fetcher shapes — plan 003 owns them.
- Role/capability logic — plan 002.
- Session/facility/realtime — plan 004.
- Renaming page route paths (`/admin/visits` → `/admin/queue-sessions`). PRD
  route naming is a separate decision; this plan changes copy and fields, not
  URLs.

## Git workflow

- Branch: `advisor/005-terminology`
- Commit per area (station types / customer fields / copy / README).
- Conventional commits. Do NOT push or open a PR.

## Steps

### Step 1: Station types

1. `lib/reception/format.ts`: replace `STATION_TYPE_LABELS` with the backend
   enum and neutral Indonesian labels:
   ```ts
   const STATION_TYPE_LABELS: Record<string, string> = {
     INTAKE: "Intake",
     SERVICE: "Layanan",
     CASHIER: "Kasir",
     COUNTER: "Loket",
   }
   ```
   Delete `genderLabel()` and its import sites (grep first: only
   `client-form-dialog.tsx` and the client detail sheet read it — those fields
   are removed in Step 2).
2. `components/admin/stations/station-form-dialog.tsx`: `STATION_TYPES` list →
   the four values above; default `"REGISTRATION"` → `"INTAKE"` at `:61`,
   `:82`, `:250`.
3. `components/admin/stations/station-manager.tsx:40-41`: same list — import
   the shared const from `lib/reception/format.ts` instead of redeclaring it.
4. `types/reception.ts`: `StationType` union → the four backend values.

**Verify**: `npm run typecheck` → 0 errors; `grep -n "REGISTRATION\|NURSE\|DOCTOR\|PHARMACY\|LABORATORY" lib components types` → no matches.

### Step 2: Customer fields

1. `types/client.ts`: `ClientProfileInput` → `{ name, phone, email, address }`
   (all `string`, `name` required). Delete the `Patient*` alias block
   (`:59-65`).
2. `components/admin/clients/client-form-dialog.tsx`: delete the NIK, MRN,
   date-of-birth, and gender inputs and their state; payload becomes
   `{ name, phone?, email?, address? }`. Remove the gender normalization
   helpers.
3. `components/client/profile-form.tsx`: same removal.
4. `app/client/onboarding/page.tsx:86-97`: rewrite the two cards' copy —
   "Profil menghubungkan akun Anda dengan data pelanggan Anda." and
   "Booking online dan antrian memerlukan profil yang terhubung." Drop the
   NIK/MRN sentences entirely.
5. `app/(dashboard)/client/dashboard/page.tsx:265-281`: remove the MRN, NIK,
   date-of-birth rows; keep name, phone, email.
6. `components/receptionist/clients/client-detail-sheet.tsx`: same.
7. `types/reception.ts`: remove `nik`/`mrn`/`date_of_birth`/`gender` from the
   `Client` type (plan 003 made them optional; now delete them so the
   compiler forces every reader out).

**Verify**: `npm run typecheck` → 0 errors; `grep -rniE 'mrn|nik|date_of_birth|gender' types components/admin/clients components/client app/client` → no matches.

### Step 3: Copy and headings

Apply PRD §5 mapping, keeping Indonesian:

| Where | From | To |
|---|---|---|
| `lib/navigation.tsx` | `Poli` | `Departemen` |
| | `Station` | `Loket` |
| | `Kunjungan` | `Sesi Antrean` |
| | `Referral` | `Transfer Layanan` |
| | `Klien` | `Pelanggan` |
| `receptionist/clients/page.tsx:53` | `Pasien` | `Pelanggan` |
| `admin/queue/page.tsx` desc | `data pribadi pasien` | `data pribadi pelanggan` |
| `admin/facilities/page.tsx` desc | `tempat poli dan antrian berjalan` | `tempat departemen dan antrean berjalan` |
| `receptionist/registration/page.tsx:60`+ | `poli` | `departemen` |
| any "Kunjungan" heading | | `Sesi Antrean` |
| any "Referral" | | `Transfer Layanan` |
| `components/staff/notes-dialog.tsx` | `id="clinical-notes"` | `id="ticket-notes"` |

Grep for each before editing; report the full list of files you changed so
the reviewer can see the copy diff in one place.

**Verify**: the audit grep in "Commands you will need" returns no matches
outside `README.md` (fixed next) and the PRD.

### Step 4: README

Rewrite `README.md` intro and entry-point table with neutral terms:
"queue management system", "queue operator workspace", "customer portal",
"service point". Keep the architecture and scripts sections as they are.

**Verify**: `grep -niE 'clinic|clinical|patient' README.md` → no matches.

### Step 5: Lock the vocabulary with a test

Create `lib/reception/format.test.ts`:
- `stationTypeLabel("INTAKE")` → `"Intake"`; `stationTypeLabel("NURSE")` →
  `"NURSE"` (unknown value falls through unchanged — proves the clinical
  labels are gone, not merely unmapped).
- Assert the label table has exactly the four backend values.

Also add a source-scan test (same pattern as plan 003's `routes.test.ts`) that
walks `app/ components/ lib/ types/` and fails if any file contains
case-insensitive `pasien`, `patient`, `rekam medis`, `mrn`, or `nik `. Keep an
explicit allowlist for `types/reception.ts`'s historical comments if any
remain, or remove them.

**Verify**: `npm test` → all pass.

## Test plan

- New: `lib/reception/format.test.ts` (enum labels + vocabulary scan).
- Pattern: plan 003's source-scan test.
- Verification: `npm test` → exit 0.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0
- [ ] `npm run lint` exits 0
- [ ] `grep -rniE 'pasien|patient|klinik|rekam medis|mrn|\bnik\b|dokter|perawat|farmasi|laboratorium|clinical' app components lib types README.md` returns no matches
- [ ] `grep -rn "REGISTRATION\|NURSE\|DOCTOR\|PHARMACY\|LABORATORY" lib components types` returns no matches
- [ ] No files under `C:\laragon\www\kiyu` modified
- [ ] No file outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- A clinical field removed in Step 2 turns out to be submitted to a backend
  endpoint that validates it (re-check `CustomerController`; it validates
  `name/phone/email/address/user_id` only). If the backend changed, report.
- A copy change requires renaming a route path.
- The vocabulary scan matches a file whose content is generated or vendored —
  add it to the scan's ignore list only if it is genuinely third-party, and
  say which.
- A test fixture (not covered by the scope list) references a clinical term in
  a way that would break at runtime — report it rather than editing outside
  scope.

## Maintenance notes

- The vocabulary scan test is the durable guard: PRD §11.3 Scenario E and
  §14 item 14 require no active screen, route, message, or fixture to use a
  clinical term. Extend its allowlist only for documentation that quotes the
  forbidden terms (this plan, the PRD).
- When the customer form gains a field, add it to `ClientProfileInput` and the
  backend validation in the same PR — the type no longer has clinical
  leftovers masking a mismatch.
- Page routes `\/admin/visits`, `\/admin/clients`, `\/admin/referrals` still
  carry the old names; if the product owner approves renaming URLs, that is a
  follow-up plan (`FRONTEND_ROUTE_MAP.md` records the mapping).
