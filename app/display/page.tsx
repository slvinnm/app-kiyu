import { DisplayGate } from "@/components/display/display-gate"
import { PublicDisplay } from "@/components/display/public-display"

export const metadata = {
  title: "Antrian Layanan · Kiyu",
}

export default function DisplayPage() {
  return (
    <DisplayGate>
      <PublicDisplay />
    </DisplayGate>
  )
}
