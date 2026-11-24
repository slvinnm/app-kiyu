import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shown while a dashboard route streams in, so navigations feel responsive
 * instead of freezing on the previous page.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />

        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}