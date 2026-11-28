import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PublicHomePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
        Queue Management
        <br />
        <span className="text-primary">Made Simple</span>
      </h1>
      <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
        KIYU helps organizations manage customer flow with intelligent queue
        management, real-time monitoring, and seamless self-service booking.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link
          href={`https://${process.env.NEXT_PUBLIC_APP_HOST}/signup`}
          className="w-full max-w-xs"
        >
          <Button size="lg" className="w-full">
            Start Free Trial
          </Button>
        </Link>
        <Link
          href={`https://${process.env.NEXT_PUBLIC_APP_HOST}/login`}
          className="w-full max-w-xs"
        >
          <Button size="lg" variant="outline" className="w-full">
            Log In
          </Button>
        </Link>
      </div>
    </div>
  )
}
