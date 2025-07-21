"use client"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, Shield, Trash, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OTPDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (otp: string) => Promise<void>
  itemType: "cash-voucher" | "cheque-voucher"
  itemName: string
  receiverEmail: string // This will now be read-only
}

export default function OTPDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  receiverEmail, // No longer mutable via onEmailChange
}: OTPDeleteModalProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { toast } = useToast()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOtp("")
      setOtpSent(false)
      setCountdown(0)
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const sendOTP = async () => {
    if (!receiverEmail || !receiverEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please ensure the default email address is valid.",
        variant: "destructive",
      })
      return
    }

    setIsSendingOTP(true)
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: receiverEmail,
          action: "delete",
          itemType,
          itemName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send OTP")
      }

      setOtpSent(true)
      setCountdown(60) // 60 second cooldown
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${receiverEmail}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleConfirm = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(otp)
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading && !isSendingOTP) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white text-black mx-auto">
        {" "}
        {/* Added mx-auto for better centering */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            You are about to permanently delete <strong>{itemName}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            For security purposes, we'll send a verification code to your email. Please enter the code to confirm
            deletion.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={receiverEmail}
              readOnly // Made read-only for security
              className="bg-gray-100 cursor-not-allowed" // Style to indicate it's read-only
            />
            <p className="text-xs text-gray-500">OTP will be sent to this email address for security verification</p>
          </div>

          {!otpSent ? (
            <Button
              onClick={sendOTP}
              disabled={isSendingOTP || !receiverEmail}
              className="w-full bg-transparent"
              variant="outline"
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                ✓ Verification code sent to {receiverEmail}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-Digit Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
              </div>

              <Button
                onClick={sendOTP}
                disabled={countdown > 0 || isSendingOTP}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : isSendingOTP ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isSendingOTP}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!otpSent || !otp || otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
