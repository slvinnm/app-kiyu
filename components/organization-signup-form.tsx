"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

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
import { Spinner } from "@/components/ui/spinner"

import { signupOrganization } from "@/lib/actions/signup"

export function OrganizationSignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(
    signupOrganization,
    undefined
  )

  useEffect(() => {
    if (state?.message) {
      toast.error(state.message, { description: "Pendaftaran gagal" })
    }
  }, [state])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Mulai dengan KIYU</CardTitle>

          <CardDescription>
            Buat organisasi Anda dan mulai uji coba gratis 14 hari.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="organization_name">Nama Organisasi</FieldLabel>
                <Input
                  id="organization_name"
                  name="organization_name"
                  type="text"
                  placeholder="PT Contoh Layanan"
                  autoComplete="organization"
                  required
                />
                <FieldDescription>
                  Nama ini menjadi alamat organisasi Anda di KIYU.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="owner_name">Nama Anda</FieldLabel>
                <Input
                  id="owner_name"
                  name="owner_name"
                  type="text"
                  placeholder="Nama lengkap"
                  autoComplete="name"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="owner_email">Email</FieldLabel>
                <Input
                  id="owner_email"
                  name="owner_email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="owner_password">Password</FieldLabel>
                <Input
                  id="owner_password"
                  name="owner_password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password_confirmation">
                  Konfirmasi Password
                </FieldLabel>
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                <FieldDescription>Minimal 8 karakter.</FieldDescription>
              </Field>

              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner data-icon="inline-start" />}
                  {isPending ? "Membuat organisasi..." : "Buat Organisasi"}
                </Button>

                <FieldDescription className="text-center">
                  Sudah punya akun? <Link href="/login">Masuk</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
