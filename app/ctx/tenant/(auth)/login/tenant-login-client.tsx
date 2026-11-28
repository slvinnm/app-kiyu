"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircleIcon } from "lucide-react"

interface TenantLoginClientProps {
  tenantName: string
  allowPublicRegistration: boolean
  initialTab?: "staff" | "customer"
}

export function TenantLoginClient({
  tenantName,
  allowPublicRegistration,
  initialTab = "staff",
}: TenantLoginClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToastManager()

  const requestedMode = searchParams.get("mode")
  const initialMode: "staff" | "customer" =
    requestedMode === "customer" ? "customer" : initialTab

  const [activeTab, setActiveTab] = useState<"staff" | "customer">(initialMode)
  const [customerMode, setCustomerMode] = useState<"login" | "register">(
    searchParams.get("register") === "1" ? "register" : "login"
  )

  // Staff form state
  const [staffEmail, setStaffEmail] = useState("")
  const [staffPassword, setStaffPassword] = useState("")
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState("")

  // Customer form state
  const [custName, setCustName] = useState("")
  const [custEmail, setCustEmail] = useState("")
  const [custPassword, setCustPassword] = useState("")
  const [custPasswordConfirm, setCustPasswordConfirm] = useState("")
  const [custLoading, setCustLoading] = useState(false)
  const [custError, setCustError] = useState("")

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault()
    setStaffError("")
    setStaffLoading(true)

    try {
      const res = await fetch("/api/session/tenant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staffEmail, password: staffPassword }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      toast.add({ title: "Signed in", type: "success" })

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
      const msg = err instanceof Error ? err.message : "Authentication failed"
      setStaffError(msg)
      toast.add({ title: "Sign in failed", description: msg, type: "error" })
    } finally {
      setStaffLoading(false)
    }
  }

  async function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCustError("")
    setCustLoading(true)

    try {
      const endpoint =
        customerMode === "register"
          ? "/api/session/customer/register"
          : "/api/session/customer/login"

      const body =
        customerMode === "register"
          ? {
              name: custName,
              email: custEmail,
              password: custPassword,
              password_confirmation: custPasswordConfirm,
            }
          : { email: custEmail, password: custPassword }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      toast.add({
        title: customerMode === "register" ? "Account created" : "Signed in",
        type: "success",
      })
      router.push("/customer")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed"
      setCustError(msg)
      toast.add({
        title:
          customerMode === "register"
            ? "Registration failed"
            : "Sign in failed",
        description: msg,
        type: "error",
      })
    } finally {
      setCustLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{tenantName}</CardTitle>
          <CardDescription>
            Select your account mode to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "staff" | "customer")}
            className="flex flex-col gap-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff">Staff / Admin</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="staff">
              <form onSubmit={handleStaffLogin} className="flex flex-col gap-4">
                {staffError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{staffError}</AlertDescription>
                  </Alert>
                )}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="staff-email">Work Email</FieldLabel>
                    <Input
                      id="staff-email"
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="staff@organization.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="staff-password">Password</FieldLabel>
                    <Input
                      id="staff-password"
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={staffLoading}
                >
                  {staffLoading && <Spinner data-icon="inline-start" />}
                  {staffLoading ? "Signing in..." : "Sign in as Staff"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Staff accounts are provisioned by your organization
                  administrator via invitation.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="customer">
              <form
                onSubmit={handleCustomerSubmit}
                className="flex flex-col gap-4"
              >
                {custError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{custError}</AlertDescription>
                  </Alert>
                )}
                <FieldGroup>
                  {customerMode === "register" && (
                    <Field>
                      <FieldLabel htmlFor="cust-name">Full Name</FieldLabel>
                      <Input
                        id="cust-name"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        required
                        placeholder="Jane Doe"
                      />
                    </Field>
                  )}
                  <Field>
                    <FieldLabel htmlFor="cust-email">Email</FieldLabel>
                    <Input
                      id="cust-email"
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cust-password">Password</FieldLabel>
                    <Input
                      id="cust-password"
                      type="password"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      required
                      minLength={customerMode === "register" ? 8 : undefined}
                      autoComplete={
                        customerMode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                    />
                    {customerMode === "register" && (
                      <FieldDescription>Minimum 8 characters.</FieldDescription>
                    )}
                  </Field>
                  {customerMode === "register" && (
                    <Field>
                      <FieldLabel htmlFor="cust-password-confirm">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="cust-password-confirm"
                        type="password"
                        value={custPasswordConfirm}
                        onChange={(e) => setCustPasswordConfirm(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </Field>
                  )}
                </FieldGroup>

                <Button type="submit" className="w-full" disabled={custLoading}>
                  {custLoading && <Spinner data-icon="inline-start" />}
                  {custLoading
                    ? customerMode === "register"
                      ? "Creating account..."
                      : "Signing in..."
                    : customerMode === "register"
                      ? "Create Customer Account"
                      : "Sign in as Customer"}
                </Button>

                {allowPublicRegistration ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {customerMode === "login" ? (
                      <>
                        New visitor?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setCustError("")
                            setCustomerMode("register")
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          Register account
                        </button>
                      </>
                    ) : (
                      <>
                        Already registered?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setCustError("")
                            setCustomerMode("login")
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Self-registration is currently disabled for this
                    organization.
                  </p>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
