"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

export default function NewDepartmentPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastManager()
  const facilityId = Number(params.facilityId)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    is_active: true,
    display_in_kiosk: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await browserApi("app", "/departments", {
        method: "POST",
        body: {
          facility_id: facilityId,
          ...formData,
        },
      })
      toast.add({ title: "Department created", type: "success" })
      router.push(`/facilities/${facilityId}`)
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create department"
      setError(msg)
      toast.add({ title: "Create failed", description: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-2xl font-bold tracking-tight">
            Create Department
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a service category to this facility
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code">Department Code</FieldLabel>
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
                  placeholder="POLI-UMUM"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Department Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="General Clinic"
                />
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_active: c })
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="is_active">Active</FieldLabel>
                  <FieldDescription>
                    Inactive departments cannot accept new visits.
                  </FieldDescription>
                </div>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="display_in_kiosk"
                  checked={formData.display_in_kiosk}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, display_in_kiosk: c })
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="display_in_kiosk">
                    Display in Kiosk
                  </FieldLabel>
                  <FieldDescription>
                    Show this department as a choice on kiosk devices.
                  </FieldDescription>
                </div>
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
                {isLoading ? "Creating..." : "Create Department"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
