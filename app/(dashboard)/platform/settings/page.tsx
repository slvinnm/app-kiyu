import { Settings2 } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformSettingsServer } from "@/lib/api/platform-server"

export default async function Page() {
  let settings = null
  let error: string | null = null

  try {
    settings = await getPlatformSettingsServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat pengaturan platform.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Pengaturan Platform"
        description="Kebijakan registrasi dan daftar subdomain yang dicadangkan."
        icon={<Settings2 className="size-5" />}
      />

      {error || !settings ? (
        <Alert variant="destructive">
          <AlertTitle>Pengaturan tidak tersedia</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Registrasi</CardTitle>
              <CardDescription>
                Apakah pendaftaran organisasi baru dibuka secara publik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge
                variant={settings.allow_public_signup ? "secondary" : "outline"}
              >
                {settings.allow_public_signup ? "Terbuka" : "Ditutup"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reserved Subdomain</CardTitle>
              <CardDescription>
                Label ini tidak pernah diperlakukan sebagai slug tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {settings.reserved_subdomains.map((label) => (
                <Badge key={label} variant="outline" className="font-mono">
                  {label}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
