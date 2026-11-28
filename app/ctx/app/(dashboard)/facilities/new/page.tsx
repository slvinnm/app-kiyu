"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

interface FacilityCreate {
  name: string
  code: string
  address?: string
  phone?: string
  timezone?: string
  is_active?: boolean
}

export default function NewFacilityPage() {
  const router = useRouter()
  const toast = useToastManager()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<FacilityCreate>({
    name: "",
    code: "",
    address: "",
    phone: "",
    timezone: "Asia/Jakarta",
    is_active: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const payload: FacilityCreate = {
        name: formData.name,
        code: formData.code,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        timezone: formData.timezone || "Asia/Jakarta",
        is_active: formData.is_active,
      }
      await browserApi("app", "/facilities", { method: "POST", body: payload })
      toast.add({ title: "Facility created", type: "success" })
      router.push("/facilities")
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create facility"
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
          render={<Link href="/facilities" />}
          nativeButton={false}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Facility</h1>
          <p className="text-sm text-muted-foreground">
            Add a new facility to your organization
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
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
                  placeholder="e.g. Main Branch"
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
                  placeholder="MAIN"
                  maxLength={50}
                />
                <FieldDescription>
                  Short unique code (uppercase, max 50 chars).
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  placeholder="Jl. Raya No. 123, Jakarta"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+62 21 1234 5678"
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
                  placeholder="Asia/Jakarta"
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
              <Link href="/facilities">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner data-icon="inline-start" />}
                {isLoading ? "Creating..." : "Create Facility"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
