import { NextResponse } from "next/server"

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: Request) {
  const { otp, email, itemType, itemId } = await request.json()

  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }

  try {
    // Make an API call to your Laravel backend to verify the OTP
    const otpVerificationResponse = await fetch(`${LARAVEL_API_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ otp, email, itemType, itemId }),
    })

    // --- ADDED LOGGING HERE ---
    console.log("Laravel OTP Verification Response Status:", otpVerificationResponse.status)
    const otpResponseText = await otpVerificationResponse.text()
    console.log("Laravel OTP Verification Response Body:", otpResponseText)
    // --- END ADDED LOGGING ---

    if (!otpVerificationResponse.ok) {
      let errorData: any
      try {
        errorData = JSON.parse(otpResponseText)
      } catch (parseError) {
        console.error("Failed to parse Laravel OTP verification error response as JSON:", otpResponseText)
        errorData = { message: "Laravel OTP verification returned non-JSON error." }
      }
      return NextResponse.json(
        { message: errorData.message || "OTP verification failed on backend." },
        { status: otpVerificationResponse.status },
      )
    }
    // If the response is OK, it means OTP is valid.

    // ... (rest of the code for deletion remains the same)
    let deleteUrl = ""
    if (itemType === "cheque-voucher") {
      deleteUrl = `${LARAVEL_API_URL}/cheque-vouchers/${itemId}`
    } else if (itemType === "cash-voucher") {
      deleteUrl = `${LARAVEL_API_URL}/cash-vouchers/${itemId}`
    } else {
      return NextResponse.json({ message: "Invalid item type for deletion." }, { status: 400 })
    }

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { message: errorData.message || `Failed to delete ${itemType} ${itemId}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for DELETE ${deleteUrl}:`, errorText)
        return NextResponse.json(
          {
            message: "Laravel API returned an unexpected response format (expected JSON, got HTML/text).",
            rawResponse: errorText,
          },
          { status: 500 },
        )
      }
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ message: `${itemType} ${itemId} deleted successfully` }, { status: 200 })
    }
  } catch (error: any) {
    console.error(`Error during deletion of ${itemType} ${itemId}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}
