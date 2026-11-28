import { Skeleton } from "@/components/ui/skeleton"

export default function FacilitiesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  )
}
