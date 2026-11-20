"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DepartmentFormDialog } from "@/components/admin/departments/department-form-dialog"

import type { Department } from "@/types/reception"

export function DepartmentManager({
  departments,
}: {
  departments: Department[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) {
      return departments
    }

    return departments.filter(
      (department) =>
        department.name.toLowerCase().includes(keyword) ||
        department.code.toLowerCase().includes(keyword)
    )
  }, [departments, query])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(department: Department) {
    setEditing(department)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Daftar Poli</CardTitle>

              <CardDescription>
                Kelola unit pelayanan beserta status aktifnya.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Poli
            </Button>
          </div>

          <div className="relative mt-3 max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kode atau nama poli..."
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>

                <TableHead>Nama</TableHead>

                <TableHead>Station</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Poli tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-mono text-xs">
                      {department.code}
                    </TableCell>

                    <TableCell className="font-medium">
                      {department.name}
                    </TableCell>

                    <TableCell>
                      {department.stations?.length ?? 0}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={department.is_active ? "default" : "outline"}
                      >
                        {department.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/stations?department_id=${department.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Station
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(department)}
                        >
                          <PencilIcon />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
