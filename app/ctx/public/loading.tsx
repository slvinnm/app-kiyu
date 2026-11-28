import { Skeleton } from "@/components/ui/skeleton"

export default function PublicLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Skeleton className="mx-auto mb-6 h-12 w-64" />
      <Skeleton className="mx-auto mb-4 h-6 w-80" />
      <Skeleton className="mx-auto mb-4 h-4 w-64" />
      <Skeleton className="mx-auto mb-4 h-4 w-48" />
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Skeleton className="h-12 w-full max-w-xs" />
        <Skeleton className="h-12 w-full max-w-xs" />
      </div>
    </div>
  )
}
