"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
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
import { Button, buttonVariants } from "@/components/ui/button"
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

import { WorkflowStepFormDialog } from "@/components/admin/workflows/workflow-step-form-dialog"

import { getApiErrorMessage } from "@/lib/api/error"
import { deleteWorkflowStep } from "@/lib/api/admin"

import type { AdminStation, Workflow, WorkflowStep } from "@/types/admin"

export function WorkflowDetail({
  workflow,
  stations,
}: {
  workflow: Workflow
  stations: AdminStation[]
}) {
  const router = useRouter()
  const steps = workflow.steps ?? []
  const nextSequence =
    steps.length > 0
      ? Math.max(...steps.map((step) => step.sequence)) + 1
      : 1

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

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/workflows"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon />
          Kembali ke Workflow
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Langkah Workflow</CardTitle>

              <CardDescription>
                {workflow.department?.name ?? "Poli"} · urutan pelayanan dari
                station ke station.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Langkah
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seq</TableHead>

                <TableHead>Nama</TableHead>

                <TableHead>Station</TableHead>

                <TableHead>Atribut</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {steps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Workflow belum memiliki langkah. Tambahkan langkah pertama
                    untuk mengaktifkan alur.
                  </TableCell>
                </TableRow>
              ) : (
                steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-mono text-xs">
                      {step.sequence}
                    </TableCell>

                    <TableCell className="font-medium">
                      {step.name}
                    </TableCell>

                    <TableCell>
                      {step.station?.name ??
                        stations.find(
                          (station) => station.id === step.station_id
                        )?.name ??
                        "-"}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {step.is_optional && (
                          <Badge variant="outline" className="text-[10px]">
                            Opsional
                          </Badge>
                        )}

                        {step.is_repeatable && (
                          <Badge variant="outline" className="text-[10px]">
                            Repeatable
                          </Badge>
                        )}

                        {step.can_skip && (
                          <Badge variant="outline" className="text-[10px]">
                            Bisa Skip
                          </Badge>
                        )}

                        {!step.is_optional &&
                          !step.is_repeatable &&
                          !step.can_skip && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={step.is_active ? "default" : "outline"}
                      >
                        {step.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(step)}
                        >
                          <PencilIcon />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(step)}
                        >
                          <Trash2Icon />
                          Hapus
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
