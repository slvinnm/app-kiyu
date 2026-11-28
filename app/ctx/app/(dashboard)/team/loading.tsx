import { Skeleton } from "@/components/ui/skeleton"

export default function TeamLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
