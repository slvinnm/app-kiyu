import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { InvitationAcceptClient } from "./invitation-accept-client"

function InvitationLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto size-12 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-6 w-48" />
          <Skeleton className="mx-auto mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={<InvitationLoadingFallback />}>
      <InvitationAcceptClient />
    </Suspense>
  )
}
