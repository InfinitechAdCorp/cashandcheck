import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import LoadingWrapper from "@/components/loading-wrapper"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { Toaster } from "@/components/ui/toaster" // Add this import

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="font-sans antialiased">
        <LoadingWrapper>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-4 bg-white">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-slate-900">ABIC Accounting System</h1>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 bg-slate-50">{children}</div>
              <Toaster /> {/* Place it here to ensure it wraps the children */}
            </SidebarInset>
          </SidebarProvider>
        </LoadingWrapper>
      </body>
    </html>
  )
}
