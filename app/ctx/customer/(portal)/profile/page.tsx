"use client"

import { useState } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastManager } from "@/components/ui/toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { ApiException } from "@/lib/api/transport"
import { AlertCircleIcon, UserIcon } from "lucide-react"

interface CustomerProfile {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export default function CustomerProfilePage() {
  const toast = useToastManager()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const profileQuery = useAsyncData<{
    profile: CustomerProfile | null
    exists: boolean
  }>(async () => {
    try {
      const p = await browserApi<CustomerProfile>("customer", "/profile")
      return { profile: p, exists: true }
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 404) {
        return { profile: null, exists: false }
      }
      throw err
    }
  }, [])

  const existing = profileQuery.data?.profile ?? null

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })
  const [hydrated, setHydrated] = useState(false)

  if (profileQuery.data && !hydrated) {
    const p = profileQuery.data.profile
    setHydrated(true)
    if (p) {
      setForm({
        name: p.name ?? "",
        phone: p.phone ?? "",
        email: p.email ?? "",
        address: p.address ?? "",
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name,
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.email ? { email: form.email } : {}),
        ...(form.address ? { address: form.address } : {}),
      }
      if (profileQuery.data?.exists) {
        await browserApi("customer", "/profile", {
          method: "PUT",
          body: payload,
        })
      } else {
        await browserApi("customer", "/profile", {
          method: "POST",
          body: payload,
        })
      }
      toast.add({ title: "Profile saved", type: "success" })
      await profileQuery.reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile"
      setError(msg)
      toast.add({ title: "Save failed", description: msg, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          {existing
            ? "Update your contact details"
            : "Complete your profile to book visits"}
        </p>
      </div>

      {(error || profileQuery.error) && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error || profileQuery.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="size-4" />
            {existing ? "Your Details" : "Create Profile"}
          </CardTitle>
          <CardDescription>
            These details are used to identify you at the service desk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="p_name">Full Name</FieldLabel>
                <Input
                  id="p_name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="p_phone">Phone</FieldLabel>
                <Input
                  id="p_phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="p_email">Email</FieldLabel>
                <Input
                  id="p_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="p_address">Address</FieldLabel>
                <Textarea
                  id="p_address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  rows={3}
                />
                <FieldDescription>
                  Optional. Used for visit records.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.name}
            >
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isSubmitting
                ? "Saving..."
                : existing
                  ? "Save Changes"
                  : "Create Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
