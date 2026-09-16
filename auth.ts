import "server-only"

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { authConfig } from "@/auth.config"
import type { LaravelAuthResponse } from "@/types/auth"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

const credentialsSchema = z.object({
  email: z.string().email("Invalid email address."),

  password: z.string().min(6, "Password must be at least 6 characters."),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)

        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
            cache: "no-store",
          })

          const payload = (await response.json()) as LaravelAuthResponse

          if (!response.ok || !payload.success) {
            return null
          }

          return {
            id: String(payload.data.user.id),
            name: payload.data.user.name,
            email: payload.data.user.email,
            role: payload.data.user.role,
            profile: payload.data.user.profile ?? null,
            accessToken: payload.data.token,
          }
        } catch (error) {
          console.error("[AUTH] Laravel request failed:", error)

          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.profile = user.profile
        token.accessToken = user.accessToken
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as UserRole
      session.user.profile = token.profile
      session.user.accessToken = token.accessToken as string

      return session
    },
  },
})
