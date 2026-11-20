import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"

export function AdminPaginationLinks({
  currentPage,
  lastPage,
  total,
  hrefFor,
}: {
  currentPage: number
  lastPage: number
  total: number
  hrefFor: (page: number) => string
}) {
  if (lastPage <= 1) {
    return <p className="text-xs text-muted-foreground">{total} data</p>
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Halaman {currentPage} dari {lastPage} · {total} data
      </p>

      <div className="flex gap-2">
        {currentPage <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            Sebelumnya
          </Button>
        ) : (
          <Link
            href={hrefFor(currentPage - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Sebelumnya
          </Link>
        )}

        {currentPage >= lastPage ? (
          <Button variant="outline" size="sm" disabled>
            Berikutnya
          </Button>
        ) : (
          <Link
            href={hrefFor(currentPage + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Berikutnya
          </Link>
        )}
      </div>
    </div>
  )
}
