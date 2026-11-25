import Link from "next/link"
import { ArrowLeftIcon, Building2 } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getApiErrorMessage } from "@/lib/api/error"
import { getTenantDetailServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let tenant = null
  let error: string | null = null

  try {
    tenant = await getTenantDetailServer(Number(id))
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat detail tenant.")
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <ConsolePageHeader
          context="Platform"
          title="Detail Tenant"
          description={error ?? "Tenant tidak ditemukan."}
          icon={<Building2 className="size-5" />}
          actions={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/platform/tenants" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
          }
        />
      </div>
    )
  }

  const subscription = tenant.subscriptions[0] ?? null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title={tenant.name}
        description={`${tenant.slug} · ${tenant.timezone}`}
        icon={<Building2 className="size-5" />}
        actions={
          <>
            <Badge
              variant={tenant.status === "ACTIVE" ? "secondary" : "destructive"}
            >
              {tenant.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/platform/tenants" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Organisasi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Status" value={tenant.status} />
            <Row label="Email Penagihan" value={tenant.billing_email ?? "-"} />
            <Row label="Email Kontak" value={tenant.contact_email ?? "-"} />
            <Row label="Terdaftar" value={formatDateTime(tenant.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Pemilik</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Nama" value={tenant.owner?.name ?? "-"} />
            <Row label="Email" value={tenant.owner?.email ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Langganan</CardTitle>
            <CardDescription>
              {subscription
                ? (subscription.plan?.name ?? "-")
                : "Belum berlangganan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Status" value={subscription?.status ?? "-"} />
            <Row
              label="Interval"
              value={subscription?.billing_interval ?? "-"}
            />
            <Row
              label="Akhir Periode"
              value={
                subscription?.current_period_end
                  ? formatDateTime(subscription.current_period_end)
                  : "-"
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Fasilitas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.facilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Belum ada fasilitas.
                    </TableCell>
                  </TableRow>
                )}
                {tenant.facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">
                      {facility.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {facility.code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={facility.is_active ? "secondary" : "outline"}
                      >
                        {facility.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penggunaan Perangkat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Row
              label="Kiosk"
              value={String(tenant.kiosk_devices_count ?? 0)}
            />
            <Row
              label="Display"
              value={String(tenant.display_devices_count ?? 0)}
            />
            <Row label="Pengguna" value={String(tenant.users_count ?? 0)} />
            <Row
              label="Pelanggan"
              value={String(tenant.customers_count ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
