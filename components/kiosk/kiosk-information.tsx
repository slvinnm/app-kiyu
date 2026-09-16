import { Ticket } from "lucide-react"
import styles from "@/app/kiosk/kiosk-marquee.module.css"

const messages = [
  "Silakan pilih poliklinik sesuai dengan tujuan pelayanan Anda.",
  "Pastikan Anda mengambil satu nomor antrean untuk setiap kunjungan.",
  "Harap menunggu hingga nomor antrean Anda dipanggil.",
]

function InformationContent() {
  return (
    <>
      {messages.map((message, index) => (
        <span key={message} className="flex items-center">
          {index > 0 && <span className="px-8 text-border">•</span>}

          <span>{message}</span>
        </span>
      ))}
    </>
  )
}

export function KioskInformation() {
  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex h-12 items-center">
        <div className="z-10 flex h-full shrink-0 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground">
          <Ticket className="size-4" />
          INFORMASI
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className={styles.marquee}>
            <div className={styles.track}>
              <InformationContent />
              <InformationContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
