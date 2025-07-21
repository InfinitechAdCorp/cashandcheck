"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, X, Trash } from "lucide-react"
import OTPDeleteModal from "@/components/otp-delete-modal"
import { DataTable } from "@/components/data-table" // Import DataTable

interface CashVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  total_amount: number
  status: string
}

export default function CashVoucherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vouchers, setVouchers] = useState<CashVoucher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    voucher: CashVoucher | null
  }>({
    isOpen: false,
    voucher: null,
  })
  const [receiverEmail] = useState("decastrojustin321@gmail.com")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const fetchVouchers = async () => {
    try {
      setIsLoading(true)
      // Note: If your Laravel backend is truly returning a direct array and not a paginated object,
      // then the `page` and `per_page` query parameters might not be fully utilized by the backend.
      // This frontend code will now handle a direct array response.
      const response = await fetch(`/api/cash-vouchers?page=${currentPage}&per_page=${perPage}`)
      if (!response.ok) {
        throw new Error("Failed to fetch cash vouchers")
      }
      const data = await response.json()
      console.log("Full API Response Object (from fetchVouchers):", data) // This will show the exact structure

      // Adjusting based on the screenshot: API returns a direct array, not { data: [...] }
      const fetchedVouchers = Array.isArray(data) ? data : []

      setVouchers(fetchedVouchers)
      setTotalItems(fetchedVouchers.length) // Total items is the length of the fetched array
      setPageCount(Math.ceil(fetchedVouchers.length / perPage)) // Calculate page count based on fetched data
      setCurrentPage(1) // Reset to first page as we're getting a full array for the current "view"
      setPerPage(perPage) // Keep current perPage setting
    } catch (error: any) {
      console.error("Error fetching cash vouchers:", error)
      toast({
        title: "Error",
        description: `Failed to load vouchers: ${error.message || "An unexpected error occurred."}`,
        variant: "destructive",
      })
      setVouchers([]) // Reset to empty array on error
      setTotalItems(0)
      setPageCount(1)
      setCurrentPage(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [currentPage, perPage]) // Re-fetch when page or perPage changes

  // Log state changes for debugging
  useEffect(() => {
    console.log("Current Vouchers state (from useEffect):", vouchers)
    console.log("Is Loading (from useEffect):", isLoading)
  }, [vouchers, isLoading])

  const handleView = (id: string) => {
    router.push(`/admin/cashvoucher/view/${id}`)
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this voucher? This will update its status to 'cancelled'.")) {
      return
    }

    try {
      const response = await fetch(`/api/cash-vouchers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to cancel cash voucher")
      }

      toast({
        title: "Success",
        description: "Cash voucher status updated to 'cancelled'.",
      })
      fetchVouchers()
    } catch (error: any) {
      console.error("Error cancelling cash voucher:", error)
      toast({
        title: "Error",
        description: `Failed to cancel voucher: ${error.message || "An unexpected error occurred."}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (voucher: CashVoucher) => {
    setDeleteModal({
      isOpen: true,
      voucher,
    })
  }

  const handleDeleteConfirm = async (otp: string) => {
    if (!deleteModal.voucher) return

    try {
      const response = await fetch("/api/verify-otp-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp,
          email: receiverEmail,
          itemType: "cash-voucher",
          itemId: deleteModal.voucher.id,
        }),
      })

      if (!response.ok) {
        let errorData: any
        const contentType = response.headers.get("content-type")

        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
        } else {
          const rawErrorText = await response.text()
          console.error("Next.js API route returned non-JSON error:", rawErrorText)
          errorData = {
            message: `Server error: ${response.status} ${response.statusText}. Please check server logs.`,
          }
        }
        throw new Error(errorData.message || "An unknown error occurred during deletion.")
      }

      toast({
        title: "Success",
        description: "Cash voucher deleted successfully.",
      })

      fetchVouchers()
    } catch (error: any) {
      console.error("Error during delete confirmation:", error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      voucher: null,
    })
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "voucher_no",
        header: "Voucher No",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (row: any) => new Date(row.date).toLocaleDateString(),
      },
      {
        accessorKey: "paid_to",
        header: "Paid To",
      },
      {
        accessorKey: "total_amount",
        header: "Total Amount",
        cell: (row: any) => `₱${Number.parseFloat(row.total_amount.toString()).toFixed(2)}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (row: any) => <span className="capitalize">{row.status}</span>,
      },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: (row: any) => (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleView(row.id)} title="View Voucher">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCancel(row.id)}
              className="hover:bg-orange-50 hover:border-orange-300"
              title="Cancel Voucher"
            >
              <X className="h-4 w-4 text-orange-600" />
              <span className="sr-only">Cancel</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDeleteClick(row)}
              className="hover:bg-red-50 hover:border-red-300"
              title="Delete Voucher Permanently"
            >
              <Trash className="h-4 w-4 text-red-600" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [], // Dependencies for useMemo. Functions like handleView, handleCancel, handleDeleteClick are stable.
  )

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Cash Vouchers</h1>
        {/* <Button onClick={() => router.push("/admin/cashvoucher/new")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Voucher
        </Button> */}
      </div>
      <DataTable
        columns={columns}
        data={vouchers}
        pageCount={pageCount}
        currentPage={currentPage}
        perPage={perPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        loading={isLoading}
      />

      <OTPDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        itemType="cash-voucher"
        itemName={deleteModal.voucher ? `Cash Voucher ${deleteModal.voucher.voucher_no}` : ""}
        receiverEmail={receiverEmail}
      />
    </div>
  )
}
