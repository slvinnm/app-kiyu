import Link from "next/link"
import { AlertCircleIcon, UserRoundPlusIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

export function ProfileRequired() {
  return (
    <Card className="mt-6">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border">
          <UserRoundPlusIcon className="size-5" />
        </div>

        <div>
          <CardTitle>Profil pasien belum terhubung</CardTitle>

          <CardDescription className="mt-2">
            Lengkapi profil pasien untuk melakukan booking online dan melihat
            antrian.
          </CardDescription>
        </div>

        <Link
          href="/client/profile"
          className={buttonVariants({ size: "lg" })}
        >
          Lengkapi Profil
        </Link>
      </CardContent>
    </Card>
  )
}

export function PatientLoadError({ message }: { message: string }) {
  return (
    <Card className="mt-6">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <AlertCircleIcon className="size-6 text-destructive" />

        <CardTitle>Tidak dapat memuat data</CardTitle>

        <CardDescription>{message}</CardDescription>
      </CardContent>
    </Card>
  )
}
