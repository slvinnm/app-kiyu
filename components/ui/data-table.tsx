"use client"

import * as React from "react"
import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  FlexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Shared TanStack Table v9 feature set. Registering features keeps the bundle
 * small and lets every table share one configuration.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
})

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>()
}

type ColumnHelper<TData extends RowData> = ReturnType<
  typeof createDataTableColumnHelper<TData>
>

export type DataTableColumns<TData extends RowData> = ReturnType<
  ColumnHelper<TData>["columns"]
>

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = "Tidak ada data.",
  getRowId,
  toolbar,
  pageCount,
  pageIndex = 0,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari…",
  searching,
  className,
}: {
  columns: DataTableColumns<TData>
  data: TData[]
  emptyMessage?: string
  getRowId?: (row: TData) => string
  /** Optional content rendered on the left of the toolbar. */
  toolbar?: React.ReactNode
  /**
   * When `pageCount` is provided the table is server-paginated: the parent
   * owns paging (usually via the URL) and `data` is already the current page.
   */
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  total?: number
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  /**
   * Server-side sorting state. When provided the table stops sorting its own
   * rows (which are only the current page) and asks the parent instead.
   */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /**
   * Server-side search. Passing `onSearchChange` renders a debounced input in
   * the toolbar (no search button); the parent owns the debounce.
   */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Shows a spinner inside the search input while a request is in flight. */
  searching?: boolean
  className?: string
}) {
  const manual = typeof pageCount === "number"
  const manualSorting = onSortingChange !== undefined

  const [clientSorting, setClientSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [clientPageSize, setClientPageSize] = React.useState(
    pageSize ?? PAGE_SIZE_OPTIONS[0]
  )
  const [clientPageIndex, setClientPageIndex] = React.useState(0)

  const resolvedSorting = sorting ?? clientSorting
  const resolvedOnSortingChange = onSortingChange ?? setClientSorting

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    ...(getRowId ? { getRowId } : {}),
    manualSorting,
    state: { sorting: resolvedSorting, columnVisibility },
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(resolvedSorting) : updater

      resolvedOnSortingChange(next)
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const rows = table.getRowModel().rows

  // Client pagination slices the sorted rows; server pagination trusts `data`.
  const effectivePageSize = manual
    ? (pageSize ?? (rows.length || PAGE_SIZE_OPTIONS[0]))
    : clientPageSize
  const effectivePageIndex = manual ? 0 : clientPageIndex
  const pageRows = manual
    ? rows
    : rows.slice(
        effectivePageIndex * effectivePageSize,
        effectivePageIndex * effectivePageSize + effectivePageSize
      )

  const resolvedPageCount = manual
    ? Math.max(pageCount ?? 1, 1)
    : Math.max(Math.ceil(rows.length / effectivePageSize), 1)
  const resolvedPageIndex = manual ? pageIndex : clientPageIndex
  const resolvedTotal = manual ? (total ?? rows.length) : rows.length

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(next, 0), resolvedPageCount - 1)

    if (manual) {
      onPageChange?.(clamped)
      return
    }

    setClientPageIndex(clamped)
  }

  function changePageSize(next: number) {
    if (manual) {
      onPageSizeChange?.(next)
      return
    }

    setClientPageSize(next)
    setClientPageIndex(0)
  }

  const showToolbar =
    toolbar !== undefined ||
    onSearchChange !== undefined ||
    table.getAllLeafColumns().length > 0

  return (
    <div className={className}>
      {showToolbar && (
        <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {onSearchChange !== undefined && (
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchValue ?? ""}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-8"
                  aria-label={searchPlaceholder}
                />

                {searching && (
                  <Spinner className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            )}

            {toolbar}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon />
              Columns
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Kolom</DropdownMenuLabel>

                <DropdownMenuSeparator />

                {table.getAllLeafColumns().map((column) => {
                  if (!column.getCanHide()) {
                    return null
                  }

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="p-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()

                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 font-medium hover:text-foreground"
                          >
                            <FlexRender header={header} />

                            {sorted === "asc" ? (
                              <ArrowUpIcon className="size-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDownIcon className="size-3.5" />
                            ) : (
                              <ArrowUpDownIcon className="size-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          <FlexRender header={header} />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length || 1}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Baris per halaman</span>

            <Select
              value={String(effectivePageSize)}
              onValueChange={(value) =>
                changePageSize(Number(value) || PAGE_SIZE_OPTIONS[0])
              }
            >
              <SelectTrigger size="sm" className="w-[72px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="ml-2">
              {resolvedTotal} data · halaman {resolvedPageIndex + 1} dari{" "}
              {resolvedPageCount}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(resolvedPageIndex - 1)}
              disabled={resolvedPageIndex <= 0}
            >
              <ChevronLeftIcon />
              Sebelumnya
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(resolvedPageIndex + 1)}
              disabled={resolvedPageIndex >= resolvedPageCount - 1}
            >
              Berikutnya
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { ColumnHelper }
