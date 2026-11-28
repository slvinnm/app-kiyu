import { Suspense } from "react"
import { headers } from "next/headers"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TenantLoginClient } from "./tenant-login-client"

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TenantLoginPage() {
  const headerStore = await headers()
  const tenantName = headerStore.get("x-kiyu-tenant-name") ?? "Organization"
  const allowPublicRegistration =
    headerStore.get("x-kiyu-tenant-allow-reg") === "1"

  return (
    <Suspense fallback={<LoginSkeleton />}>
      <TenantLoginClient
        tenantName={tenantName}
        allowPublicRegistration={allowPublicRegistration}
      />
    </Suspense>
  )
}
