export const STAFF_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Resepsionis" },
  { value: "nurse", label: "Perawat" },
  { value: "doctor", label: "Dokter" },
  { value: "pharmacist", label: "Farmasi" },
  { value: "lab", label: "Laboratorium" },
  { value: "billing", label: "Kasir" },
  { value: "patient", label: "Pasien" },
] as const

/**
 * Backend seeds use `pharmacist`; the frontend normalises it to `pharmacy`.
 * The admin form uses `pharmacist` as the canonical staff value.
 */
export function normalizeStaffRole(role: string): string {
  return role === "pharmacy" ? "pharmacist" : role
}

export function staffRoleLabel(role: string): string {
  const normalized = normalizeStaffRole(role)

  return (
    STAFF_ROLE_OPTIONS.find((option) => option.value === normalized)?.label ??
    role
  )
}
