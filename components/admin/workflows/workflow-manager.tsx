"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, PlusIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { WorkflowFormDialog } from "@/components/admin/workflows/workflow-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"

import type { Workflow } from "@/types/admin"
import type { Department } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Workflow>()

export function WorkflowManager({
  rows,
  total,
  lastPage,
  departments,
  state,
}: {
  rows: Workflow[]
  total: number
  lastPage: number
  departments: Department[]
  filters: Record<string, string>
  state: TableQueryState
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)

  const departmentFilter = state.filters?.department_id ?? "all"
  const parsedDepartment = Number(departmentFilter)
  const defaultDepartmentId = Number.isInteger(parsedDepartment)
    ? parsedDepartment
    : null

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
          enableSorting: false,
        }),
        columnHelper.display({
          id: "steps",
          header: "Langkah",
          cell: ({ row }) => row.original.steps?.length ?? 0,
          enableSorting: false,
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
          enableSorting: false,
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
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(workflow) => String(workflow.id)}
            emptyMessage="Workflow tidak ditemukan. Poli tanpa workflow tidak dapat menerima kunjungan."
            pageCount={lastPage}
            pageIndex={state.page - 1}
            pageSize={state.perPage}
            total={total}
            sorting={tq.sorting}
            onSortingChange={tq.setSorting}
            onPageChange={tq.setPageIndex}
            onPageSizeChange={tq.setPerPage}
            searchValue={tq.searchInput}
            onSearchChange={tq.setSearchInput}
            searching={tq.pending}
            searchPlaceholder="Cari nama workflow..."
            toolbar={
              <Select
                value={departmentFilter}
                onValueChange={(value) =>
                  tq.setFilter(
                    "department_id",
                    !value || value === "all" ? null : value
                  )
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
            }
          />
        </CardContent>
      </Card>

      <WorkflowFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        departments={departments}
        defaultDepartmentId={defaultDepartmentId}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
