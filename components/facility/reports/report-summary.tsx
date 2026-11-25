"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

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
import { Label } from "@/components/ui/label"

import { getApiErrorMessage } from "@/lib/api/error"
import { requestReportExport } from "@/lib/api/admin"

import type { ReportSummary } from "@/lib/api/admin-server"

export function ReportSummaryView({
  summary,
  canExport = false,
}: {
  summary: ReportSummary
  /** Requires the `advanced_reports` entitlement; the API enforces it too. */
  canExport?: boolean
}) {
  const [from, setFrom] = useState(summary.queue_sessions.period.from)
  const [to, setTo] = useState(summary.queue_sessions.period.to)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)

    try {
      const response = await requestReportExport("xlsx", { from, to })

      // The URL is API-supplied; only follow http(s) so a compromised response
      // cannot turn this into a `javascript:` navigation.
      const downloadUrl = new URL(
        response.data.download_url,
        window.location.href
      )

      if (
        downloadUrl.protocol !== "https:" &&
        downloadUrl.protocol !== "http:"
      ) {
        throw new Error("URL unduhan tidak valid.")
      }

      window.open(downloadUrl.toString(), "_blank", "noopener")
      toast.success("Ekspor siap diunduh.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal membuat ekspor."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total Sesi Antrean"
          value={summary.queue_sessions.total_sessions}
        />
        <Stat
          label="Selesai"
          value={summary.queue_sessions.completed_sessions}
        />
        <Stat
          label="Rasio Selesai"
          value={`${summary.queue_sessions.completion_rate}%`}
        />
        <Stat
          label="Rata-rata Tunggu"
          value={
            summary.queue_sessions.average_wait_minutes === null
              ? "—"
              : `${summary.queue_sessions.average_wait_minutes} menit`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sesi Antrean per Status</CardTitle>
            <CardDescription>
              {summary.queue_sessions.period.from} –{" "}
              {summary.queue_sessions.period.to}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(summary.queue_sessions.by_status).map(
              ([status, total]) => (
                <Badge key={status} variant="outline">
                  {status}: {total}
                </Badge>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Antrian</CardTitle>
            <CardDescription>
              {summary.queue.total_tickets} tiket · {summary.queue.served}{" "}
              dilayani
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(summary.queue.by_status).map(([status, total]) => (
              <Badge key={status} variant="outline">
                {status}: {total}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      {canExport ? (
        <Card>
          <CardHeader>
            <CardTitle>Ekspor Laporan</CardTitle>
            <CardDescription>
              Unduh data sesi antrean dalam rentang tanggal (Laporan Lanjutan).
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="report-from">Dari</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-to">Sampai</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>

            <Button onClick={handleExport} disabled={busy}>
              <Download />
              Ekspor XLSX
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ekspor Laporan</CardTitle>
            <CardDescription>
              Ekspor tersedia pada paket dengan Laporan Lanjutan.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
