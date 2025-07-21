"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import type { ActivityLog, ActivityLogResponse, ActivityLogSummary } from "@/types/activity-log"
import { RefreshCw, BarChart3, Users, Calendar, Activity, Receipt, CreditCard, FileText, User } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"

// Helper function for icons based on subject_type
const getIcon = (subjectType: string | null) => {
  if (subjectType?.includes("CashVoucher")) {
    return <Receipt className="w-4 h-4 text-green-600" />
  } else if (subjectType?.includes("ChequeVoucher")) {
    return <CreditCard className="w-4 h-4 text-purple-600" />
  }
  return <FileText className="w-4 h-4 text-blue-600" />
}

// Helper function for event colors
const getEventColor = (event: string | null) => {
  switch (event) {
    case "created":
      return "bg-green-100 text-green-800"
    case "updated":
      return "bg-blue-100 text-blue-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    case "status_changed":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper function for time ago formatting
const formatTimeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return "Unknown time"
  }
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [summary, setSummary] = useState<ActivityLogSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination and search state for DataTable
  const [pagination, setPagination] = useState({
    pageIndex: 0, // 0-indexed for internal use, convert to 1-indexed for API
    pageSize: 10,
  })
  const [search, setSearch] = useState("")
  const [totalLogs, setTotalLogs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(), // Convert to 1-indexed page
        per_page: pagination.pageSize.toString(),
        ...(search && { search: search }),
      })

      const response = await fetch(`/api/activity-logs?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs")
      }

      const data: ActivityLogResponse = await response.json()
      setLogs(data.data)
      setTotalLogs(data.total)
      setTotalPages(data.last_page)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, search])

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const response = await fetch("/api/activity-logs/summary")
      if (!response.ok) {
        throw new Error("Failed to fetch summary")
      }

      const data: ActivityLogSummary = await response.json()
      setSummary(data)
    } catch (err: any) {
      console.error("Failed to fetch summary:", err)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleRefresh = () => {
    fetchLogs()
    fetchSummary()
  }

  const columns = [
    {
      accessorKey: "description",
      header: "Activity",
      cell: (row: ActivityLog) => (
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 mt-1">{getIcon(row.subject_type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-medium text-gray-900 break-words min-w-0">
                {row.description}
              </p>
              {row.event && (
                <Badge 
                  variant="secondary" 
                  className={`flex-shrink-0 text-xs ${getEventColor(row.event)}`}
                >
                  {row.event}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
              {row.causer && (
                <div className="flex items-center gap-1 min-w-0">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium text-blue-600 truncate">
                    {row.causer.name || row.causer.email || "Unknown User"}
                  </span>
                  {row.causer.role && (
                    <span className="text-gray-400 hidden sm:inline">({row.causer.role})</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="whitespace-nowrap">{formatTimeAgo(row.created_at)}</span>
              </div>
              {row.subject && row.subject.voucher_no && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-gray-600">#{row.subject.voucher_no}</span>
                </div>
              )}
            </div>
            {row.properties && Object.keys(row.properties).length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <details>
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    View Details
                  </summary>
                  <pre className="mt-1 text-gray-700 whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(row.properties, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-red-500 text-center">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50/50">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl flex flex-col flex-1 min-h-0">
        {/* Header Section - Fixed height */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Logs</h1>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards - Fixed height */}
        {!summaryLoading && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 flex-shrink-0">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total Activities</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.total_logs}</p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Today</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.today_logs}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">This Week</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.this_week_logs}</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Active Users</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.top_users.length}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Table Card - Flexible height */}
        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-lg sm:text-xl">Recent Activities</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {totalLogs} total
                </Badge>
              </div>
              <Input
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 lg:w-80"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-6">
              <DataTable
                columns={columns}
                data={logs}
                pageCount={totalPages}
                currentPage={pagination.pageIndex + 1}
                perPage={pagination.pageSize}
                totalItems={totalLogs}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
                onPerPageChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
                loading={loading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
