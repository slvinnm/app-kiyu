import { redirect } from "next/navigation"

/**
 * The standalone "Create Queue" flow was merged into the Registration
 * (manual intake) and Queue workspaces. Keep the route as a redirect so old
 * links do not 404.
 */
export default function Page() {
  redirect("/receptionist/registration")
}
