import { headers } from "next/headers"
import { TenantLoginClient } from "./tenant-login-client"

export default async function TenantLoginPage() {
  const headerStore = await headers()
  const tenantName = headerStore.get("x-kiyu-tenant-name") ?? "Organization"
  const allowPublicRegistration =
    headerStore.get("x-kiyu-tenant-allow-reg") === "1"

  return (
    <TenantLoginClient
      tenantName={tenantName}
      allowPublicRegistration={allowPublicRegistration}
    />
  )
}
