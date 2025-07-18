"use client"

import { useState, useEffect } from "react" // Import useState and useEffect [^1]
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, CreditCard, BarChart3, FileText } from "lucide-react"
import Link from "next/link"
import LoadingWrapper from "@/components/loading-wrapper"

function DashboardContent() {
  const [stats, setStats] = useState([
    { title: "Total Vouchers", value: "...", icon: FileText, color: "text-blue-600" },
    { title: "Cash Vouchers", value: "...", icon: Receipt, color: "text-green-600" },
    { title: "Cheque Vouchers", value: "...", icon: CreditCard, color: "text-purple-600" },
    { title: "This Month", value: "...", icon: BarChart3, color: "text-orange-600" },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVoucherCounts() {
      try {
        // Fetch from the Next.js API route
        const response = await fetch("/api/vouchers/counts")
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || "Unknown error"}`)
        }
        const data = await response.json()

        setStats([
          { title: "Total Vouchers", value: data.total_vouchers.toString(), icon: FileText, color: "text-blue-600" },
          { title: "Cash Vouchers", value: data.cash_vouchers.toString(), icon: Receipt, color: "text-green-600" },
          {
            title: "Cheque Vouchers",
            value: data.cheque_vouchers.toString(),
            icon: CreditCard,
            color: "text-purple-600",
          },
          {
            title: "This Month",
            value: data.vouchers_this_month.toString(),
            icon: BarChart3,
            color: "text-orange-600",
          },
        ])
      } catch (e: any) {
        console.error("Failed to fetch voucher counts:", e)
        setError(e.message)
        // Optionally, set values to "N/A" or keep "..." on error
        setStats((prevStats) => prevStats.map((stat) => ({ ...stat, value: "N/A" })))
      } finally {
        setLoading(false)
      }
    }

    fetchVoucherCounts()
  }, []) // Empty dependency array means this runs once on mount [^1]

  const quickActions = [
    { title: "Create Cash Voucher", href: "/cash-voucher", icon: Receipt, color: "bg-green-500" },
    { title: "Create Cheque Voucher", href: "/cheque-voucher", icon: CreditCard, color: "bg-purple-500" },
  ]

  if (error) {
    return <div className="container mx-auto p-4 max-w-6xl text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="flex flex-row items-center gap-4 p-6">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-medium">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      {/* Recent Activity */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Cash Voucher #CV-001</p>
                <p className="text-sm text-gray-600">Created 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">Cheque Voucher #CHQ-005</p>
                <p className="text-sm text-gray-600">Created 5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Cash Voucher #CV-002</p>
                <p className="text-sm text-gray-600">Created yesterday</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}

export default function Dashboard() {
  return (
    <LoadingWrapper>
      <DashboardContent />
    </LoadingWrapper>
  )
}
