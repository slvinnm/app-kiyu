import { auth } from "@/auth"

export default async function UnauthorizedPage() {
  const session = await auth()

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>

        <p className="mt-2 text-muted-foreground">
          Anda tidak memiliki akses ke halaman ini.
        </p>

        <pre className="mt-6 overflow-auto rounded-lg bg-muted p-4 text-left text-sm">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </main>
  )
}
