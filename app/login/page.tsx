"use client"

import { Suspense } from "react"
import { GalleryVerticalEndIcon } from "lucide-react"

import { LoginForm } from "@/components/login-form"
import { Spinner } from "@/components/ui/spinner"

function LoginFormFallback() {
  return (
    <div className="flex h-[420px] items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Acme Inc.
        </a>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
