"use client"
import type * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useEffect } from "react"

// Define a base interface that all data objects must extend
interface Identifiable {
  id: string | number // id can be string or number
}

interface DataTableProps<TData extends Identifiable> {
  // TData must now extend Identifiable
  columns: {
    accessorKey: keyof TData | string
    header: string
    cell?: (row: TData) => React.ReactNode
  }[]
  data: TData[]
  pageCount: number
  currentPage: number
  perPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  loading: boolean
}

export function DataTable<TData extends Identifiable>({
  // TData must now extend Identifiable
  columns,
  data,
  pageCount,
  currentPage,
  perPage,
  totalItems,
  onPageChange,
  onPerPageChange,
  loading,
}: DataTableProps<TData>) {
  // Log the props received by DataTable for debugging
  useEffect(() => {
    console.log("DataTable received props - data:", data)
    console.log("DataTable received props - loading:", loading)
    console.log("DataTable received props - data.length:", data.length)
  }, [data, loading])

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalItems)
  return (
    <div className="space-y-4">
      {/* Table Container - This div will handle horizontal scrolling */}
      <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
        <Table className="w-full">
          {" "}
          {/* Ensure this is w-full, not min-w-full */}
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  // Apply text-right conditionally for 'actions' column, otherwise keep text-left
                  className={`font-semibold text-gray-900 whitespace-nowrap px-4 py-3 ${
                    column.accessorKey === "actions" ? "text-right" : "text-left"
                  }`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton loading rows
              [...Array(perPage)].map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-4">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length ? (
              data.map((row) => (
                <TableRow
                  key={row.id} // Now 'id' is guaranteed to exist on 'row'
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-4 align-top">
                      {column.cell ? column.cell(row) : (row as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500 px-4 py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-gray-400">No activities found</div>
                    <div className="text-sm text-gray-400">Try adjusting your search criteria</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          <span className="hidden sm:inline">
            Showing {startItem} to {endItem} of {totalItems} activities
          </span>
          <span className="sm:hidden">
            {startItem}-{endItem} of {totalItems}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 order-1 sm:order-2">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Rows per page</span>
            <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 15, 20, 25].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Page info */}
          <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Page {currentPage} of {pageCount}
          </div>
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || loading}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pageCount || loading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(pageCount)}
              disabled={currentPage === pageCount || loading}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
