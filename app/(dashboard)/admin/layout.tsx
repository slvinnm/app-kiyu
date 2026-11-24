import { requireRole } from "@/lib/auth/guard"

/**
 * Defense in depth: the Proxy also gates `/admin`, but a matcher miss or a
 * future ungated server action must not render the console for the wrong role.
 * `requireRole` reads the role from the API, not the cookie snapshot.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["admin"])

  return children
}
