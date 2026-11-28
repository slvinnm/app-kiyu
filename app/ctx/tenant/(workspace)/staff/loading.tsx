import { Skeleton } from "@/components/ui/skeleton"

export default function StaffLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}
