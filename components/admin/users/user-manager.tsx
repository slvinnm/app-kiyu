"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"

import { UserFormDialog } from "@/components/admin/users/user-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"
import { STAFF_ROLE_OPTIONS, staffRoleLabel } from "@/lib/admin/roles"
import { getApiErrorMessage } from "@/lib/api/error"
import { deleteUser } from "@/lib/api/admin"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<AdminUser>()

export function UserManager({
  rows,
  total,
  lastPage,
  state,
  departments,
  stations,
  currentUserId,
}: {
  rows: AdminUser[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
  departments: Department[]
  stations: AdminStation[]
  currentUserId: number
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [processing, setProcessing] = useState(false)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setProcessing(true)

    try {
      const response = await deleteUser(deleteTarget.id)
      toast.success(response.message ?? "Pengguna dihapus.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal menghapus pengguna."))
    } finally {
      setDeleteTarget(null)
      setProcessing(false)
      router.refresh()
    }
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Nama",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.name}</p>

              <p className="text-xs text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("role", {
          header: "Role",
          cell: ({ row }) => (
            <Badge variant="outline">{staffRoleLabel(row.original.role)}</Badge>
          ),
        }),
        columnHelper.display({
          id: "department",
          header: "Department",
          cell: ({ row }) => row.original.department?.name ?? "-",
          enableSorting: false,
        }),
        columnHelper.display({
          id: "station",
          header: "Station",
          cell: ({ row }) => row.original.station?.name ?? "-",
          enableSorting: false,
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="flex justify-end gap-2 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(row.original)
                  setDialogOpen(true)
                }}
              >
                <PencilIcon />
                Edit
              </Button>

              {row.original.id !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2Icon />
                  Hapus
                </Button>
              )}
            </div>
          ),
          enableSorting: false,
        }),
      ]),
    [currentUserId]
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Staff & Pengguna</CardTitle>

              <CardDescription>
                Kelola akun, role, serta penempatan department dan station.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Pengguna
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="Pengguna tidak ditemukan."
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
            searchPlaceholder="Cari nama atau email..."
            toolbar={
              <Select
                value={state.filters?.role ?? "all"}
                onValueChange={(value) =>
                  tq.setFilter("role", value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>

                  {STAFF_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        departments={departments}
        stations={stations}
        onSaved={() => router.refresh()}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>

            <AlertDialogDescription>
              Akun {deleteTarget?.name ?? ""} akan dihapus. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={processing}
            >
              {processing ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
