"use client"

import { useEffect, useState } from "react"
import { ClipboardPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ManualIntakeForm } from "@/components/operator/registration/manual-intake-form"

import { getApiErrorMessage } from "@/lib/api/error"
import { getDepartmentOptions } from "@/lib/api/reception"

import type { Department } from "@/types/reception"

/**
 * Manual registration as a modal inside Antrean (PRD §8.4).
 *
 * It is an action, not a sidebar route: the operator registers a walk-in and
 * the queue refreshes behind the dialog. Uses the same intake endpoint and
 * idempotency rules as the standalone form, with the channel recorded as
 * MANUAL by the API.
 */
export function ManualRegistrationDialog({
  defaultDepartmentId,
  actorEmail,
  onRegistered,
}: {
  defaultDepartmentId: number | null
  actorEmail: string
  onRegistered: () => void
}) {
  const [open, setOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load departments lazily when the dialog opens (the page may not have sent
  // any, e.g. an operator whose station carries the department).
  useEffect(() => {
    if (!open || departments.length > 0) {
      return
    }

    let cancelled = false

    getDepartmentOptions()
      .then((response) => {
        if (!cancelled) {
          setDepartments(response.data)
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setLoadError(
            getApiErrorMessage(cause, "Gagal memuat daftar departemen.")
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, departments.length])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ClipboardPlusIcon data-icon="inline-start" />
        Registrasi Manual
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrasi Manual</DialogTitle>
            <DialogDescription>
              Daftarkan pelanggan walk-in ke antrean departemen.
            </DialogDescription>
          </DialogHeader>

          <ManualIntakeForm
            departments={departments}
            defaultDepartmentId={defaultDepartmentId}
            actorEmail={actorEmail}
            loadError={loadError}
            onRegistered={() => {
              onRegistered()
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
