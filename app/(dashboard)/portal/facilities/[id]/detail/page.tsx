import Link from "next/link"
import { ArrowLeftIcon, Building2 } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { DepartmentManager } from "@/components/facility/departments/department-manager"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  getDepartmentsServer,
  getFacilityDetailByIdServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { parseTableParams } from "@/lib/table-params"

import type { Department, Facility, Paginated } from "@/types/reception"

const SORTABLE = ["code", "name", "is_active", "created_at"]

/**
 * Facility detail inside the TenantAdmin Portal (PRD §8.2).
 *
 * Facility → departments → department detail, nested by URL. The department
 * detail page is `/portal/facilities/[id]/detail/departments/[departmentId]/detail`;
 * Loket and Alur Layanan live as tabs inside that department detail, never as
 * separate sidebar entries.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const facilityId = Number(id)
  const rawParams = await searchParams

  const { table } = parseTableParams(rawParams, {
    sortable: SORTABLE,
    defaultPerPage: 10,
  })

  let facility: Facility | null = null
  let departments: Paginated<Department> | null = null
  let error: string | null = null

  try {
    ;[facility, departments] = await Promise.all([
      getFacilityDetailByIdServer(facilityId),
      getDepartmentsServer({ ...table }),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat detail fasilitas.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title={facility?.name ?? "Fasilitas"}
        description={
          facility
            ? `${facility.code}${facility.address ? ` · ${facility.address}` : ""}`
            : (error ?? "Detail fasilitas")
        }
        icon={<Building2 className="size-5" />}
        actions={
          <>
            {facility && (
              <Badge variant={facility.is_active ? "default" : "outline"}>
                {facility.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/portal/facilities" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
          </>
        }
      />

      {error || !departments ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Data tidak tersedia</AlertTitle>
          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat departemen."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Fasilitas</CardTitle>
              <CardDescription>Informasi dasar lokasi ini.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Kode" value={facility?.code ?? "-"} />
              <Row label="Telepon" value={facility?.phone ?? "-"} />
              <Row label="Alamat" value={facility?.address ?? "-"} />
              <Row
                label="Zona Waktu"
                value={facility?.timezone ?? "Ikut tenant"}
              />
            </CardContent>
          </Card>

          <DepartmentManager
            rows={departments.data}
            total={departments.total}
            lastPage={departments.last_page}
            filters={{}}
            state={{
              search: table.search ?? "",
              page: table.page,
              perPage: table.per_page,
              sort: table.sort ?? "",
              direction: table.direction,
            }}
            detailPathPrefix={`/portal/facilities/${facilityId}/detail/departments`}
          />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
