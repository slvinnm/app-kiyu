"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authenticate } from "@/lib/actions/auth"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()

  const callbackUrl = searchParams.get("callbackUrl") || "/redirect"

  const action = authenticate.bind(null, callbackUrl)

  const [state, formAction, isPending] = useActionState(action, undefined)

  const [email, setEmail] = useState("")

  useEffect(() => {
    if (!state?.message) {
      return
    }

    toast.error(state.message, {
      description: "Login gagal",
    })
  }, [state])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Selamat datang kembali</CardTitle>

          <CardDescription>Masuk dengan akun Anda</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Memproses..." : "Masuk"}
                </Button>

                <FieldDescription className="text-center">
                  Belum punya akun? <Link href="/signup">Daftar</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
