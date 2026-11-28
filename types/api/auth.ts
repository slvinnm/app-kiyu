import { User, TenantPublic } from "@/types/domain"
import { ApiResponse } from "@/types/api/common"

// App context auth
export interface AppSignupPayload {
  organization_name: string
  slug?: string
  timezone?: string
  plan_code?: string
  owner_name: string
  owner_email: string
  owner_password: string
}

export interface AppSignupResponse {
  message: string
  data: {
    tenant: {
      id: number
      name: string
      slug: string
      status: string
    }
    subscription: {
      status: string
      trial_ends_at: string
    } | null
    owner: {
      id: number
      name: string
      email: string
    }
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  data: {
    token: string
    context: string
    user: User
  }
}

// Tenant workforce auth
export interface InvitationAcceptPayload {
  token: string
  name: string
  password: string
  password_confirmation: string
}

// Customer auth
export interface CustomerRegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

// Public tenant resolution
export type PublicTenantResponse = ApiResponse<TenantPublic>
