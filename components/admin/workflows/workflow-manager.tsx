"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { WorkflowFormDialog } from "@/components/admin/workflows/workflow-form-dialog"

import type { Workflow } from "@/types/admin"
import type { Department } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Workflow>()

export function WorkflowManager({
  workflows,
  departments,
  defaultDepartmentId,
}: {
  workflows: Workflow[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : "all"
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return workflows.filter((workflow) => {
      const matchesDepartment =
        departmentFilter === "all" ||
        workflow.department_id === Number(departmentFilter)

      if (!matchesDepartment) {
        return false
      }

      if (!keyword) {
        return true
      }

      return workflow.name.toLowerCase().includes(keyword)
    })
  }, [workflows, query, departmentFilter])

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Nama",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
          ),
        }),
        columnHelper.display({
          id: "department",
          header: "Poli",
          cell: ({ row }) =>
            row.original.department?.name ??
            departments.find((d) => d.id === row.original.department_id)
              ?.name ??
            "-",
        }),
        columnHelper.display({
          id: "steps",
          header: "Langkah",
          cell: ({ row }) => row.original.steps?.length ?? 0,
        }),
        columnHelper.accessor("is_active", {
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={row.original.is_active ? "default" : "outline"}>
              {row.original.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="text-right">
              <Link
                href={`/admin/workflows/${row.original.id}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              >
                Kelola Langkah
                <ArrowRightIcon />
              </Link>
            </div>
          ),
        }),
      ]),
    [departments]
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Daftar Workflow</CardTitle>

              <CardDescription>
                Urutan pelayanan per poli beserta langkah-langkahnya.
              </CardDescription>
            </div>

            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon />
              Tambah Workflow
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama workflow..."
                className="h-9 pl-9"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(value) => setDepartmentFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>

                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(workflow) => String(workflow.id)}
            emptyMessage="Workflow tidak ditemukan. Poli tanpa workflow tidak dapat menerima kunjungan."
          />
        </CardContent>
      </Card>

      <WorkflowFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        departments={departments}
        defaultDepartmentId={
          departmentFilter === "all" ? null : Number(departmentFilter)
        }
        onSaved={() => router.refresh()}
      />
    </>
  )
}
