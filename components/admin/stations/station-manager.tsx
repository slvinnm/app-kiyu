"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { StationFormDialog } from "@/components/admin/stations/station-form-dialog"

import { stationTypeLabel } from "@/lib/reception/format"

import type { AdminStation } from "@/types/admin"
import type { Department } from "@/types/reception"

export function StationManager({
  stations,
  departments,
  defaultDepartmentId,
}: {
  stations: AdminStation[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : "all"
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStation | null>(null)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return stations.filter((station) => {
      const matchesDepartment =
        departmentFilter === "all" ||
        station.department_id === Number(departmentFilter)

      if (!matchesDepartment) {
        return false
      }

      if (!keyword) {
        return true
      }

      return (
        station.name.toLowerCase().includes(keyword) ||
        station.code.toLowerCase().includes(keyword)
      )
    })
  }, [stations, query, departmentFilter])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(station: AdminStation) {
    setEditing(station)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Daftar Station</CardTitle>

              <CardDescription>
                Titik pelayanan yang terhubung dengan poli dan workflow.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Station
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kode atau nama station..."
                className="h-9 pl-9"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(value) =>
                setDepartmentFilter(value ?? "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>

                {departments.map((department) => (
                  <SelectItem
                    key={department.id}
                    value={String(department.id)}
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>

                <TableHead>Nama</TableHead>

                <TableHead>Tipe</TableHead>

                <TableHead>Poli</TableHead>

                <TableHead>Prefix</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Station tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-mono text-xs">
                      {station.code}
                    </TableCell>

                    <TableCell className="font-medium">
                      {station.name}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {stationTypeLabel(station.type)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {station.department?.name ??
                        departments.find(
                          (d) => d.id === station.department_id
                        )?.name ??
                        "-"}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {station.queue_prefix}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={station.is_active ? "default" : "outline"}
                      >
                        {station.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(station)}
                      >
                        <PencilIcon />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        station={editing}
        departments={departments}
        defaultDepartmentId={
          departmentFilter === "all" ? null : Number(departmentFilter)
        }
        onSaved={() => router.refresh()}
      />
    </>
  )
}
