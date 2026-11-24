import { requireRole } from "@/lib/auth/guard"

export default async function StaffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["admin", "staff"])

  return children
}
