import { NextResponse } from "next/server"

interface RouteSegmentContext {
  params: {
    id: string;
  };
}

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request, context: RouteSegmentContext) {
  const { id } = context.params;
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cash-vouchers/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Ensure fresh data
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { message: errorData.message || `Failed to fetch cash voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for GET /cash-vouchers/${id}:`, errorText)
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
    console.error(`Error fetching cash voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteSegmentContext) {
  const { id } = context.params;
  const body = await request.json() // For JSON payload (like status update)
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cash-vouchers/${id}`, {
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
          { message: errorData.message || `Failed to update cash voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for PUT /cash-vouchers/${id}:`, errorText)
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
    console.error(`Error updating cash voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

// This POST method is specifically for handling FormData with _method=PUT for file uploads
export async function POST(request: Request, context: RouteSegmentContext) {
  const { id } = context.params;
  const formData = await request.formData()
  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }
  try {
    const response = await fetch(`${LARAVEL_API_URL}/cash-vouchers/${id}`, {
      method: "POST", // Laravel expects POST for FormData with _method=PUT
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { message: errorData.message || `Failed to update cash voucher ${id} with files`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for POST (PUT simulation) /cash-vouchers/${id}:`, errorText)
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
    console.error(`Error updating cash voucher ${id} with files:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}

// DELETE a cash voucher by ID
export async function DELETE(request: Request, context: RouteSegmentContext) {
  const { id } = context.params;

  if (!LARAVEL_API_URL) {
    return NextResponse.json({ message: "Laravel API URL is not configured." }, { status: 500 })
  }

  try {
    const response = await fetch(`${LARAVEL_API_URL}/cash-vouchers/${id}`, {
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
          { message: errorData.message || `Failed to delete cash voucher ${id}`, details: errorData },
          { status: response.status },
        )
      } catch (parseError) {
        console.error(`Laravel API returned non-JSON error for DELETE /cash-vouchers/${id}:`, errorText)
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
      return NextResponse.json({ message: `Cash voucher ${id} deleted successfully` }, { status: 200 })
    }
  } catch (error: any) {
    console.error(`Error deleting cash voucher ${id}:`, error)
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 })
  }
}
