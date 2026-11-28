"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircleIcon, MailCheckIcon } from "lucide-react"

export function InvitationAcceptClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToastManager()

  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    password_confirmation: "",
  })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is missing the required token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please check the invitation email for the correct link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/session/tenant/invitations-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...formData }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to accept invitation")
      }

      toast.add({
        title: "Invitation accepted",
        description: "Welcome to the team!",
        type: "success",
      })

      const role = data.user?.role
      if (role === "facility_admin") {
        router.push("/facility/dashboard")
      } else if (role === "operator") {
        router.push("/operator/reception")
      } else if (role === "staff") {
        router.push("/staff")
      } else {
        router.push("/workspace/dashboard")
      }
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to accept invitation"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <MailCheckIcon className="mx-auto size-12 text-primary" />
          <CardTitle className="mt-4">Accept Invitation</CardTitle>
          <CardDescription>
            Set up your account to join the organization
          </CardDescription>
        </CardHeader>
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
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Jane Doe"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password_confirmation">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_confirmation: e.target.value,
                    })
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner data-icon="inline-start" />}
              {isLoading ? "Accepting invitation..." : "Accept Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
