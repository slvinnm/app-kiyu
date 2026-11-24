import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type SimpleColumn<T> = {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

/**
 * Server-rendered read-only table for console lists that do not need
 * client-side paging or sorting (reports, webhook history, audit).
 * Interactive tenant/plan tables use the DataTable client component instead.
 */
export function SimpleTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "Tidak ada data.",
}: {
  columns: SimpleColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  emptyMessage?: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.header} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((column) => (
              <TableCell key={column.header} className={column.className}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
