import { requireRole } from "@/lib/auth/guard"

export default async function ReceptionistLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["admin", "receptionist"])

  return children
}
