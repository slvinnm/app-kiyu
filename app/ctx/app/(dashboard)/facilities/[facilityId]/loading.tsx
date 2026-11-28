import { Skeleton } from "@/components/ui/skeleton"

export default function FacilityDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
