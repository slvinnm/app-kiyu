import { requireRole } from "@/lib/auth/guard"

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["client"])

  return children
}
