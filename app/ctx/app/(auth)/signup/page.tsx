"use client"

import { useState } from "react"
import Link from "next/link"
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircleIcon } from "lucide-react"

export default function AppSignupPage() {
  const toast = useToastManager()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdTenant, setCreatedTenant] = useState<{
    name: string
    slug: string
  } | null>(null)

  const [formData, setFormData] = useState({
    organization_name: "",
    slug: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/session/app/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Signup failed")
      }

      setCreatedTenant({
        name: data.data.tenant.name,
        slug: data.data.tenant.slug,
      })
      setIsSuccess(true)
      toast.add({ title: "Organization created successfully", type: "success" })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed"
      setError(msg)
      toast.add({ title: "Signup failed", description: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess && createdTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Organization Created</CardTitle>
            <CardDescription>
              Your trial account for{" "}
              <span className="font-semibold text-foreground">
                {createdTenant.name}
              </span>{" "}
              is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Please sign in with your credentials to enter the App Console.
            </p>
            <Link href="/login" className="block w-full">
              <Button className="w-full">Continue to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Create your Organization</CardTitle>
          <CardDescription>
            Start your 14-day free trial of KIYU Queue Management
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
                <FieldLabel htmlFor="organization_name">
                  Organization Name
                </FieldLabel>
                <Input
                  id="organization_name"
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization_name: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. Rumah Sakit Medika"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="slug">Subdomain (optional)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="rs-medika"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>.kiyu.test</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="owner_name">Admin Name</FieldLabel>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) =>
                    setFormData({ ...formData, owner_name: e.target.value })
                  }
                  required
                  placeholder="Dr. John Doe"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="owner_email">Work Email</FieldLabel>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) =>
                    setFormData({ ...formData, owner_email: e.target.value })
                  }
                  required
                  placeholder="admin@rsmedika.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="owner_password">Password</FieldLabel>
                <Input
                  id="owner_password"
                  type="password"
                  value={formData.owner_password}
                  onChange={(e) =>
                    setFormData({ ...formData, owner_password: e.target.value })
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <FieldDescription>Minimum 8 characters.</FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner data-icon="inline-start" />}
              {isLoading ? "Creating organization..." : "Start Free Trial"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an organization?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
