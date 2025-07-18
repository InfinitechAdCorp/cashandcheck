"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ABICLoader from "./abic-loader"

interface LoadingWrapperProps {
  children: React.ReactNode
  loadingTime?: number
}

export default function LoadingWrapper({ children, loadingTime = 3000 }: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, loadingTime)

    return () => clearTimeout(timer)
  }, [loadingTime])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <ABICLoader size="lg" text="Loading ABIC Accounting System..." />
      </div>
    )
  }

  return <>{children}</>
}
