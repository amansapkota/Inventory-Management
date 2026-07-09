'use client'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './table'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (item: any) => React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps {
  columns: Column[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  total?: number
  page?: number
  limit?: number
  search?: string
  loading?: boolean
  onSearch?: (value: string) => void
  onPageChange?: (page: number) => void
  onSort?: (key: string) => void
}

export function DataTable({
  columns, data, total = 0, page = 1, limit = 20,
  search, loading, onSearch, onPageChange, onSort,
}: DataTableProps) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    {col.label}
                    {col.sortable && <ArrowUpDown size={14} />}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow key={(item.id as string) ?? String(idx)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Select
              value={String(page)}
              onChange={(e) => onPageChange(Number(e.target.value))}
              options={Array.from({ length: totalPages }, (_, i) => ({
                label: String(i + 1),
                value: String(i + 1),
              }))}
              className="w-16 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
