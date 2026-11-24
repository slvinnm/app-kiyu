"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

export function StaffNotesDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  processing,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  processing: boolean
  onConfirm: (notes: string) => void
}) {
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      setNotes("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="ticket-notes">Catatan (opsional)</Label>

          <Textarea
            id="ticket-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Tambahkan catatan bila perlu"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Batal
          </Button>

          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => onConfirm(notes)}
            disabled={processing}
          >
            {processing ? (
              <>
                <Spinner />
                Memproses...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
