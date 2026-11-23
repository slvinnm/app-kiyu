"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { FacilityFormDialog } from "@/components/admin/facilities/facility-form-dialog"

import type { Facility } from "@/types/reception"

export function FacilityManager({ rows }: { rows: Facility[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Fasilitas</CardTitle>
          <CardDescription>
            Unit fisik tempat poli dan antrian berjalan.
          </CardDescription>
        </div>

        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          Tambah Fasilitas
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada fasilitas.
          </p>
        ) : (
          rows.map((facility) => (
            <div
              key={facility.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
                  <Building2 className="size-4" />
                </div>

                <div>
                  <p className="font-medium">{facility.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {facility.code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{facility.address ?? "Alamat belum diisi"}</span>

                <Badge variant={facility.is_active ? "default" : "outline"}>
                  {facility.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <FacilityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => router.refresh()}
      />
    </Card>
  )
}
