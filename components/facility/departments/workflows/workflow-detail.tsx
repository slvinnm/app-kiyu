"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
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

import { WorkflowStepFormDialog } from "@/components/facility/departments/workflows/workflow-step-form-dialog"

import { getApiErrorMessage } from "@/lib/api/error"
import { deleteWorkflowStep } from "@/lib/api/admin"

import type { AdminStation, Workflow, WorkflowStep } from "@/types/admin"

const columnHelper = createDataTableColumnHelper<WorkflowStep>()

export function WorkflowDetail({
  workflow,
  stations,
}: {
  workflow: Workflow
  stations: AdminStation[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const steps = workflow.steps ?? []
  const nextSequence =
    steps.length > 0 ? Math.max(...steps.map((step) => step.sequence)) + 1 : 1

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkflowStep | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowStep | null>(null)
  const [processing, setProcessing] = useState(false)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(step: WorkflowStep) {
    setEditing(step)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setProcessing(true)

    try {
      const response = await deleteWorkflowStep(deleteTarget.id)
      toast.success(response.message ?? "Langkah workflow dihapus.")
    } catch (cause) {
      toast.error(
        getApiErrorMessage(cause, "Gagal menghapus langkah workflow.")
      )
    } finally {
      setDeleteTarget(null)
      setProcessing(false)
      router.refresh()
    }
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("sequence", {
          header: "Seq",
          cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.sequence}</span>
          ),
        }),
        columnHelper.accessor("name", {
          header: "Nama",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
          ),
        }),
        columnHelper.display({
          id: "station",
          header: "Station",
          cell: ({ row }) =>
            row.original.station?.name ??
            stations.find((station) => station.id === row.original.station_id)
              ?.name ??
            "-",
        }),
        columnHelper.display({
          id: "attributes",
          header: "Atribut",
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
              {row.original.is_optional && (
                <Badge variant="outline" className="text-[10px]">
                  Opsional
                </Badge>
              )}

              {row.original.is_repeatable && (
                <Badge variant="outline" className="text-[10px]">
                  Repeatable
                </Badge>
              )}

              {row.original.can_skip && (
                <Badge variant="outline" className="text-[10px]">
                  Bisa Skip
                </Badge>
              )}

              {!row.original.is_optional &&
                !row.original.is_repeatable &&
                !row.original.can_skip && (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
            </div>
          ),
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
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(row.original)}
              >
                <PencilIcon />
                Edit
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2Icon />
                Hapus
              </Button>
            </div>
          ),
        }),
      ]),
    [stations]
  )

  return (
    <>
      <div className="mb-4">
        <Link
          // Back to the department's Alur tab, not a standalone page.
          href={`${pathname}?tab=alur`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon />
          Kembali ke Daftar Workflow
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Langkah Workflow</CardTitle>

              <CardDescription>
                {workflow.department?.name ?? "Departemen"} · urutan pelayanan
                dari station ke station.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Langkah
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={steps}
            getRowId={(step) => String(step.id)}
            emptyMessage="Workflow belum memiliki langkah. Tambahkan langkah pertama untuk mengaktifkan alur."
          />
        </CardContent>
      </Card>

      <WorkflowStepFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workflowId={workflow.id}
        step={editing}
        stations={stations}
        existingSteps={steps}
        nextSequence={nextSequence}
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
            <AlertDialogTitle>Hapus langkah ini?</AlertDialogTitle>

            <AlertDialogDescription>
              Langkah {deleteTarget?.name ?? ""} akan dihapus dari workflow.
              Tiket yang sudah ada tidak berubah, tetapi alur baru tidak akan
              melewati langkah ini.
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
