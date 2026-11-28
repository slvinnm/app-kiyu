import Link from "next/link"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const appHost = process.env.NEXT_PUBLIC_APP_HOST ?? "app.kiyu.test"
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold">
            KIYU
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href={`http://${appHost}/signup`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href={`http://${appHost}/login`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} KIYU. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
