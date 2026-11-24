"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import { NewCustomerForm } from "@/components/receptionist/client/new-client-form"
import {
  CustomerModeTabs,
  type CustomerMode,
} from "@/components/receptionist/client/client-mode-tabs"
import { CustomerSearch } from "@/components/receptionist/client/client-search"
import { CustomerSummary } from "@/components/receptionist/client/client-summary"
import { CompleteRegistrationSuccess as CompleteRegistrationSuccessView } from "@/components/receptionist/queue/complete-registration-success"

import { useCustomerSearch } from "@/hooks/use-client-search"

import {
  getApiErrorMessage,
  getApiErrorType,
  getApiValidationErrors,
} from "@/lib/api/error"
import {
  completeRegistration,
  type CompleteRegistrationPayload,
} from "@/lib/api/reception"
import {
  clearAcquisitionCache,
  resolveAcquisitionForVisit,
} from "@/lib/reception/acquisition"
import { channelLabel, priorityLabel } from "@/lib/reception/format"

import type {
  CompleteRegistrationPatientData,
  CompleteRegistrationResult,
  CustomerInput,
  Customer,
  Priority,
  QueueAcquisition,
  QueueTicket,
} from "@/types/reception"

const initialPatient: CustomerInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
}

function toPatientData(input: CustomerInput): CompleteRegistrationPatientData {
  const data: CompleteRegistrationPatientData = {
    name: input.name.trim(),
  }

  const phone = (input.phone ?? "").trim()
  if (phone) data.phone = phone

  const email = (input.email ?? "").trim()
  if (email) data.email = email

  const address = (input.address ?? "").trim()
  if (address) data.address = address

  return data
}

export function CompleteRegistrationDialog({
  ticket,
  actorEmail,
  open,
  onOpenChange,
  onCompleted,
}: {
  ticket: QueueTicket | null
  actorEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
}) {
  const [acquisition, setAcquisition] = useState<QueueAcquisition | null>(null)
  const [loadingAcquisition, setLoadingAcquisition] = useState(false)
  const [acquisitionError, setAcquisitionError] = useState<string | null>(null)

  const [mode, setMode] = useState<CustomerMode>("existing")
  const [priority, setPriority] = useState<Priority>(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [search, setSearch] = useState("")
  const [newPatient, setNewPatient] = useState<CustomerInput>(initialPatient)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<CompleteRegistrationResult | null>(null)

  const existingPatient = ticket?.visit?.client ?? null
  const searchEnabled =
    open && !existingPatient && mode === "existing" && search.trim().length >= 2

  const {
    results,
    searching,
    error: searchError,
  } = useCustomerSearch(search, {
    enabled: searchEnabled,
    perPage: 10,
  })

  useEffect(() => {
    if (!open || !ticket) {
      return
    }

    setAcquisition(null)
    setLoadingAcquisition(true)
    setAcquisitionError(null)
    setMode("existing")
    setPriority(ticket.priority)
    setSelectedCustomer(null)
    setSearch("")
    setNewPatient(initialPatient)
    setFieldErrors({})
    setSubmitting(false)
    setSubmitError(null)
    setResult(null)

    let active = true

    resolveAcquisitionForVisit(ticket.visit_id)
      .then((resolved) => {
        if (!active) return

        setAcquisition(resolved)

        if (!resolved) {
          setAcquisitionError(
            "Acquisition aktif tidak ditemukan. Kemungkinan registrasi sudah diproses petugas lain."
          )
        }
      })
      .catch((cause) => {
        if (!active) return

        setAcquisitionError(
          getApiErrorMessage(cause, "Gagal memuat data registrasi.")
        )
      })
      .finally(() => {
        if (active) setLoadingAcquisition(false)
      })

    return () => {
      active = false
    }
    // `ticket` is memoised by `id`/`visit_id`; depending on the object identity
    // would reset the dialog on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?.id, ticket?.visit_id])

  function handleSwitchMode(nextMode: CustomerMode) {
    setMode(nextMode)
    setFieldErrors({})
    setSubmitError(null)

    if (nextMode === "existing") {
      setSearch("")
      setSelectedCustomer(null)
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setSelectedCustomer(null)
  }

  function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setSearch("")
    setFieldErrors({})
  }

  function handlePriorityChange(nextValue: string | null) {
    const parsed = Number(nextValue)

    if (parsed === 1 || parsed === 2 || parsed === 3) {
      setPriority(parsed)
    }
  }

  function handleNewPatientChange(value: Partial<CustomerInput>) {
    setNewPatient((current) => ({ ...current, ...value }))
  }

  async function handleSubmit() {
    if (!ticket || !acquisition || submitting) {
      return
    }

    if (!existingPatient) {
      if (mode === "existing" && !selectedCustomer) {
        toast.error("Pilih pelanggan terlebih dahulu.")
        return
      }

      if (mode === "new" && !newPatient.name.trim()) {
        setFieldErrors({ name: "Nama pelanggan wajib diisi." })
        toast.error("Nama pelanggan wajib diisi.")
        return
      }
    }

    setSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    const payload: CompleteRegistrationPayload = {
      acquisition_id: acquisition.id,
      priority,
    }

    if (!existingPatient) {
      if (mode === "existing" && selectedCustomer) {
        payload.customer_id = selectedCustomer.id
      } else {
        payload.customer_data = toPatientData(newPatient)
      }
    }

    try {
      const response = await completeRegistration(payload)

      setResult(response.data)
      clearAcquisitionCache(ticket.visit_id)
      toast.success(response.message ?? "Registrasi selesai.")
    } catch (cause) {
      const type = getApiErrorType(cause)
      const message = getApiErrorMessage(
        cause,
        "Gagal menyelesaikan registrasi."
      )

      if (type === "BUSINESS_CONFLICT") {
        if (/phone|email/i.test(message)) {
          setMode("existing")
          setSearch((newPatient.phone ?? newPatient.email ?? "").trim())
          setSubmitError(message)
          toast.error(message)
        } else {
          toast.error(message)
          onCompleted()
          onOpenChange(false)
        }
      } else if (type === "INVALID_STATE") {
        toast.error(message)
        onCompleted()
        onOpenChange(false)
      } else if (type === "INVALID_WORKFLOW") {
        setSubmitError(message)
        toast.error(message)
      } else {
        const validationErrors = getApiValidationErrors(cause)

        if (Object.keys(validationErrors).length > 0) {
          const mapped: Record<string, string> = {}

          for (const [key, messages] of Object.entries(validationErrors)) {
            const field = key.replace(/^patient_data\./, "")
            mapped[field] = messages[0] ?? "Nilai tidak valid."
          }

          setFieldErrors(mapped)
          toast.error(message)
        } else {
          setSubmitError(message)
          toast.error(message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleDone() {
    if (ticket) {
      clearAcquisitionCache(ticket.visit_id)
    }

    onCompleted()
    onOpenChange(false)
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && result) {
      handleDone()
      return
    }

    onOpenChange(nextOpen)
  }

  const canSubmit =
    acquisition !== null &&
    !loadingAcquisition &&
    !submitting &&
    (existingPatient !== null ||
      (mode === "existing"
        ? selectedCustomer !== null
        : newPatient.name.trim() !== ""))

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
        {result ? (
          <CompleteRegistrationSuccessView
            result={result}
            onDone={handleDone}
          />
        ) : (
          <>
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle>Selesaikan Registrasi</DialogTitle>

              <DialogDescription>
                {ticket
                  ? `${ticket.queue_number} · ${ticket.visit?.visit_number ?? "-"}`
                  : "Pilih antrian terlebih dahulu."}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[calc(90vh-160px)] overflow-y-auto px-6 py-5">
              {ticket && (
                <div className="space-y-5">
                  <div className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Antrian</p>

                        <p className="text-lg font-semibold">
                          {ticket.queue_number}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Channel</p>

                        <p className="font-medium">
                          {ticket.visit
                            ? channelLabel(ticket.visit.intake_channel)
                            : "-"}
                        </p>
                      </div>

                      <Badge variant="outline">
                        {priorityLabel(ticket.priority)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Kunjungan
                        </p>

                        <p className="mt-1 font-mono text-sm font-medium">
                          {ticket.visit?.visit_number ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Workflow
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {ticket.workflow_step?.name ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Status Visit
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {ticket.visit?.status ?? "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioritas</Label>

                    <Select
                      value={String(priority)}
                      onValueChange={handlePriorityChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="1">Normal</SelectItem>

                        <SelectItem value="2">Prioritas</SelectItem>

                        <SelectItem value="3">Darurat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingAcquisition && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner />
                      Memuat data registrasi...
                    </div>
                  )}

                  {acquisitionError && (
                    <Alert variant="destructive">
                      <AlertTitle>Tidak dapat melanjutkan</AlertTitle>

                      <AlertDescription>{acquisitionError}</AlertDescription>
                    </Alert>
                  )}

                  {submitError && (
                    <Alert variant="destructive">
                      <AlertTitle>Registrasi gagal</AlertTitle>

                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {!loadingAcquisition && acquisition && (
                    <div className="space-y-4">
                      {existingPatient ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">
                            Pelanggan sudah terhubung
                          </p>

                          <CustomerSummary customer={existingPatient} />

                          <p className="text-xs text-muted-foreground">
                            Pelanggan dari booking online ini diverifikasi saat
                            registrasi.
                          </p>
                        </div>
                      ) : (
                        <>
                          <CustomerModeTabs
                            value={mode}
                            onChange={handleSwitchMode}
                          />

                          {mode === "existing" ? (
                            <CustomerSearch
                              search={search}
                              results={results}
                              selected={selectedCustomer}
                              searching={searching}
                              error={searchError}
                              onSearchChange={handleSearchChange}
                              onSelect={handleSelectCustomer}
                              onClear={() => setSelectedCustomer(null)}
                            />
                          ) : (
                            <NewCustomerForm
                              value={newPatient}
                              errors={fieldErrors}
                              onChange={handleNewPatientChange}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Batal
              </Button>

              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? (
                  <>
                    <Spinner />
                    Menyimpan...
                  </>
                ) : (
                  "Selesaikan Registrasi"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
