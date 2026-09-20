import type { UserRole } from "@/types/auth"

export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "receptionist":
      return "/receptionist/dashboard"
    case "staff":
      return "/staff/dashboard"
    case "doctor":
      return "/doctor/dashboard"
    case "nurse":
      return "/nurse/dashboard"
    case "pharmacy":
      return "/pharmacy/dashboard"
    case "lab":
      return "/lab/dashboard"
    case "patient":
      return "/patient/dashboard"
    default:
      return "/unauthorized"
  }
}
