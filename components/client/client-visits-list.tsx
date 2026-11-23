"use client"

import { useState } from "react"
import { FileTextIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { PatientVisitDetailSheet } from "@/components/client/client-visit-detail-sheet"

import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { PatientVisit } from "@/types/client"

function isActive(status: string): boolean {
  return ["AWAITING_CHECKIN", "WAITING", "IN_PROGRESS"].includes(status)
}

export function PatientVisitsList({ visits }: { visits: PatientVisit[] }) {
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null)

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
          <FileTextIcon className="size-7 text-muted-foreground" />

          <p className="mt-3 text-sm font-medium">Belum ada kunjungan</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Kunjungan akan muncul di sini setelah Anda melakukan booking atau
            registrasi.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {visits.map((visit) => (
          <Card key={visit.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {visit.department?.name ?? "Kunjungan"}
                  </CardTitle>

                  <CardDescription className="font-mono">
                    {visit.visit_number}
                  </CardDescription>
                </div>

                <Badge variant={isActive(visit.status) ? "default" : "outline"}>
                  {visitStatusLabel(visit.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{channelLabel(visit.intake_channel)}</span>

                <span>{priorityLabel(visit.priority)}</span>

                <span>{formatDateTime(visit.created_at)}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVisitId(visit.id)}
              >
                Detail
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <PatientVisitDetailSheet
        visitId={selectedVisitId}
        open={selectedVisitId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVisitId(null)
          }
        }}
      />
    </>
  )
}
