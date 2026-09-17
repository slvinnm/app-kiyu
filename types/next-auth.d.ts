import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/types/auth"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
    profile?: unknown
    accessToken?: string
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      profile?: unknown
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
    profile?: unknown
    accessToken?: string
  }
}
