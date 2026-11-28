"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

interface Facility {
  id: number
  name: string
  code: string
  address: string | null
  phone: string | null
  timezone: string
  is_active: boolean
}

export default function EditFacilityPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastManager()
  const facilityId = Number(params.facilityId)

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Omit<Facility, "id">>({
    name: "",
    code: "",
    address: "",
    phone: "",
    timezone: "Asia/Jakarta",
    is_active: true,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const f = await browserApi<Facility>("app", `/facilities/${facilityId}`)
        if (cancelled) return
        setFormData({
          name: f.name,
          code: f.code,
          address: f.address ?? "",
          phone: f.phone ?? "",
          timezone: f.timezone,
          is_active: f.is_active,
        })
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load facility"
          )
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [facilityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await browserApi("app", `/facilities/${facilityId}`, {
        method: "PUT",
        body: {
          name: formData.name,
          code: formData.code,
          address: formData.address || null,
          phone: formData.phone || null,
          timezone: formData.timezone,
          is_active: formData.is_active,
        },
      })
      toast.add({ title: "Facility updated", type: "success" })
      router.push(`/facilities/${facilityId}`)
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update facility"
      setError(msg)
      toast.add({ title: "Update failed", description: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/facilities/${facilityId}`} />}
          nativeButton={false}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Facility</h1>
          <p className="text-sm text-muted-foreground">
            Update facility details
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Facility Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code">Code</FieldLabel>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea
                  id="address"
                  value={formData.address ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="is_active">Active</FieldLabel>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_active: c })
                  }
                />
                <FieldDescription>
                  Inactive facilities are hidden from the workspace.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                render={<Link href={`/facilities/${facilityId}`} />}
                nativeButton={false}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner data-icon="inline-start" />}
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
