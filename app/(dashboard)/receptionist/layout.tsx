import { requireRole } from "@/lib/auth/guard"

export default async function ReceptionistLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["tenant_admin", "facility_admin", "operator"])

  return children
}
