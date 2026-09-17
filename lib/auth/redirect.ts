import type { UserRole } from "@/types/auth"

export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"

    case "staff":
    case "doctor":
    case "receptionist":
    case "nurse":
    case "pharmacy":
    case "lab":
      return "/staff/dashboard"

    case "patient":
      return "/patient/dashboard"

    default:
      return "/unauthorized"
  }
}
