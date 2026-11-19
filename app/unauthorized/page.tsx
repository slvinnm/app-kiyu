import { getSession } from "@/lib/auth/session"

export default async function UnauthorizedPage() {
  const session = await getSession()

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>

        <p className="mt-2 text-muted-foreground">
          Anda tidak memiliki akses ke halaman ini.
        </p>

        {user && (
          <pre className="mt-6 overflow-auto rounded-lg bg-muted p-4 text-left text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        )}
      </div>
    </main>
  )
}
