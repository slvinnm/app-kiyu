const REFERRAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  ACCEPTED: "Diterima",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

export function referralStatusLabel(status: string): string {
  return REFERRAL_STATUS_LABELS[status] ?? status
}
