import { NextResponse } from "next/server"

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params // Corrected: params is directly an object, no need to await
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cheque-vouchers/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Ensure fresh data
    })
    if (!response.ok) {
      const errorText = await response.text() // Read as text first
      try {
        const errorData = JSON.parse(errorText) // Try parsing as JSON
        return NextResponse.json(
          { message: errorData.message || `Failed to fetch cheque voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        // If parsing fails, it means it's not JSON (likely HTML)
        console.error(`Laravel API returned non-JSON error for GET /cheque-vouchers/${id}:`, errorText)
        return NextResponse.json(
          {
            message: "Laravel API returned an unexpected response format (expected JSON, got HTML/text).",
            rawResponse: errorText,
          },
          { status: 500 },
        )
      }
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error fetching cheque voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params // Corrected: params is directly an object, no need to await
  const body = await request.json() // For JSON payload (like status update)
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cheque-vouchers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { message: errorData.message || `Failed to update cheque voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for PUT /cheque-vouchers/${id}:`, errorText)
        return NextResponse.json(
          {
            message: "Laravel API returned an unexpected response format (expected JSON, got HTML/text).",
            rawResponse: errorText,
          },
          { status: 500 },
        )
      }
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error updating cheque voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

// This POST method is specifically for handling FormData with _method=PUT for file uploads
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params // Corrected: params is directly an object, no need to await
  const formData = await request.formData()
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cheque-vouchers/${id}`, {
      method: "POST", // Laravel expects POST for FormData with _method=PUT
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { message: errorData.message || `Failed to update cheque voucher ${id} with files`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(
          `Laravel API returned non-JSON error for POST (PUT simulation) /cheque-vouchers/${id}:`,
          errorText,
        )
        return NextResponse.json(
          {
            message: "Laravel API returned an unexpected response format (expected JSON, got HTML/text).",
            rawResponse: errorText,
          },
          { status: 500 },
        )
      }
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error updating cheque voucher ${id} with files:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

// DELETE a cheque voucher by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params // Corrected: params is directly an object, no need to await

  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }

  try {
    const response = await fetch(`${LARAVEL_API_URL}/cheque-vouchers/${id}`, {
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
          { message: errorData.message || `Failed to delete cheque voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for DELETE /cheque-vouchers/${id}:`, errorText)
        return NextResponse.json(
          {
            message: "Laravel API returned an unexpected response format (expected JSON, got HTML/text).",
            rawResponse: errorText,
          },
          { status: 500 },
        )
      }
    }

    // Laravel's destroy method typically returns 200 with a message, or 204 No Content.
    // Check content-type to avoid parsing empty responses.
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ message: `Cheque voucher ${id} deleted successfully` }, { status: 200 })
    }
  } catch (error: any) {
    console.error(`Error deleting cheque voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}
