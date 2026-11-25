/**
 * Human labels for plan feature codes (mirrors `App\Enums\Feature`).
 *
 * Shared by the tenant billing page and any other surface that renders
 * entitlements, so a feature's wording is defined once. Unknown codes fall back
 * to the raw code rather than disappearing.
 */
export const FEATURE_LABELS: Record<string, string> = {
  queue_management: "Manajemen Antrean",
  basic_reports: "Laporan Dasar",
  advanced_reports: "Laporan Lanjutan & Ekspor",
  whatsapp_notifications: "Notifikasi WhatsApp",
}

export const LIMIT_LABELS: Record<string, string> = {
  max_facilities: "Maks. Fasilitas",
  max_staff: "Maks. Staf",
  max_kiosk_devices: "Maks. Kiosk Aktif",
  max_display_devices: "Maks. Display Aktif",
}

/** Whether a feature code is a numeric limit rather than an on/off toggle. */
export function isLimitFeature(code: string): boolean {
  return code in LIMIT_LABELS
}

/** The label for a feature code, or the raw code if unknown. */
export function featureLabel(code: string): string {
  return FEATURE_LABELS[code] ?? LIMIT_LABELS[code] ?? code
}
