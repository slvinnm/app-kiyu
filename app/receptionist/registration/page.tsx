import {
  ClipboardPlusIcon,
  ScanLineIcon,
  UserRoundPlusIcon,
} from "lucide-react"

import { RegistrationWalkIn } from "@/components/receptionist/registration-walk-in"
import { RegistrationKiosk } from "@/components/receptionist/registration-kiosk"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto w-full p-4 md:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Reception</Badge>
              <span className="text-xs text-muted-foreground">
                Patient Registration
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardPlusIcon className="size-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Registrasi
                </h1>

                <p className="text-sm text-muted-foreground">
                  Daftarkan pasien walk-in atau proses pasien dari kiosk.
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <Tabs defaultValue="walk-in" className="w-full">
              <CardHeader className="border-b">
                <TabsList className="grid h-11 w-full max-w-md grid-cols-2">
                  <TabsTrigger value="walk-in" className="gap-2">
                    <UserRoundPlusIcon className="size-4" />
                    Walk-in
                  </TabsTrigger>

                  <TabsTrigger value="kiosk" className="gap-2">
                    <ScanLineIcon className="size-4" />
                    Kiosk
                  </TabsTrigger>
                </TabsList>

                <CardDescription>
                  Pilih alur registrasi sesuai sumber pasien.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <TabsContent value="walk-in" className="m-0">
                  <RegistrationWalkIn />
                </TabsContent>

                <TabsContent value="kiosk" className="m-0">
                  <RegistrationKiosk />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
