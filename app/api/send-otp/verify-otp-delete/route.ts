import { NextResponse } from "next/server"

// This should match the otpStore from send-otp route
// In production, use a shared storage like Redis
declare global {
  var otpStore: Map<string, { otp: string; expires: number; email: string }> | undefined
}

const getOtpStore = () => {
  if (!global.otpStore) {
    global.otpStore = new Map()
  }
  return global.otpStore
}

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: Request) {
  try {
    const { otp, email, itemType, itemId } = await request.json()

    if (!otp || !email || !itemType || !itemId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const otpStore = getOtpStore()

    // Find matching OTP - using Array.from for compatibility
    let validOtp = false
    let otpKeyToDelete = ""

    const otpEntries = Array.from(otpStore.entries())
    for (const [key, value] of otpEntries) {
      if (value.email === email && value.otp === otp && value.expires > Date.now()) {
        validOtp = true
        otpKeyToDelete = key
        break
      }
    }

    if (!validOtp) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 })
    }

    // Delete the OTP to prevent reuse
    otpStore.delete(otpKeyToDelete)

    // Proceed with actual deletion
    if (!LARAVEL_API_URL) {
      return NextResponse.json({ message: "Laravel API URL is not configured" }, { status: 500 })
    }

    const endpoint = itemType === "cash-voucher" ? "cash-vouchers" : "cheque-vouchers"
    const deleteResponse = await fetch(`${LARAVEL_API_URL}/${endpoint}/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!deleteResponse.ok) {
      let errorBody: any
      const contentType = deleteResponse.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        errorBody = await deleteResponse.json()
      } else {
        // If not JSON, read as text and provide a generic message
        errorBody = await deleteResponse.text()
        console.error("Laravel API returned non-JSON error:", errorBody) // Log the raw HTML/text for debugging
      }

      // Ensure message is always a string, even if errorBody is raw HTML
      const errorMessage =
        (contentType && contentType.includes("application/json") && errorBody.message) ||
        `Failed to delete item. Server responded with: ${deleteResponse.status} ${deleteResponse.statusText}. Please check Laravel logs.`

      return NextResponse.json(
        {
          message: errorMessage,
          details: contentType && contentType.includes("application/json") ? errorBody.errors : errorBody,
        },
        { status: deleteResponse.status },
      )
    }

    return NextResponse.json({
      message: "Item deleted successfully",
    })
  } catch (error: any) {
    console.error("Error verifying OTP and deleting:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
