"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
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

import { AdminPaginationLinks } from "@/components/admin/admin-pagination"
import { UserFormDialog } from "@/components/admin/users/user-form-dialog"

import {
  STAFF_ROLE_OPTIONS,
  staffRoleLabel,
} from "@/lib/admin/roles"
import { getApiErrorMessage } from "@/lib/api/error"
import { deleteUser } from "@/lib/api/admin"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

type UserFilters = {
  search?: string
  role?: string
  page?: number
}

function buildQuery(
  filters: UserFilters,
  overrides: Partial<UserFilters> = {}
): string {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (merged.search) params.set("search", merged.search)
  if (merged.role) params.set("role", merged.role)
  if (merged.page && merged.page > 1) params.set("page", String(merged.page))

  const query = params.toString()

  return query ? `/admin/users?${query}` : "/admin/users"
}

export function UserManager({
  users,
  pagination,
  departments,
  stations,
  filters,
  currentUserId,
}: {
  users: AdminUser[]
  pagination: Paginated<AdminUser>
  departments: Department[]
  stations: AdminStation[]
  filters: UserFilters
  currentUserId: number
}) {
  const router = useRouter()
  const [search, setSearch] = useState(filters.search ?? "")
  const [role, setRole] = useState(filters.role ?? "all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setSearch(filters.search ?? "")
    setRole(filters.role ?? "all")
  }, [filters.search, filters.role])

  function applyFilters() {
    router.push(
      buildQuery(
        {},
        {
          search: search.trim() || undefined,
          role: role === "all" ? undefined : role,
          page: 1,
        }
      )
    )
  }

  function resetFilters() {
    setSearch("")
    setRole("all")
    router.push("/admin/users")
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(user: AdminUser) {
    setEditing(user)
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    applyFilters()
                  }
                }}
                placeholder="Cari nama atau email..."
                className="h-9 pl-9"
              />
            </div>

            <Select
              value={role}
              onValueChange={(value) => setRole(value ?? "all")}
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

            <Button onClick={applyFilters}>Terapkan</Button>

            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>

                <TableHead>Role</TableHead>

                <TableHead>Department</TableHead>

                <TableHead>Station</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Pengguna tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>

                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {staffRoleLabel(user.role)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {user.department?.name ?? "-"}
                    </TableCell>

                    <TableCell>{user.station?.name ?? "-"}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(user)}
                        >
                          <PencilIcon />
                          Edit
                        </Button>

                        {user.id !== currentUserId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2Icon />
                            Hapus
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPaginationLinks
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        total={pagination.total}
        hrefFor={(page) => buildQuery({ ...filters, page })}
      />

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
