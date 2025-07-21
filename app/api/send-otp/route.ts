import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import crypto from "crypto"

// In-memory OTP storage (in production, use Redis or database)
declare global {
  var otpStore: Map<string, { otp: string; expires: number; email: string }> | undefined
}

const getOtpStore = () => {
  if (!global.otpStore) {
    global.otpStore = new Map()
  }
  return global.otpStore
}

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your email password or app password
    },
  })
}

export async function POST(request: Request) {
  try {
    const { email, action, itemType, itemName } = await request.json()

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const expires = Date.now() + 5 * 60 * 1000 // 5 minutes

    // Store OTP
    const otpStore = getOtpStore()
    const otpKey = `${email}-${action}-${Date.now()}`
    otpStore.set(otpKey, { otp, expires, email })

    // Clean up expired OTPs - using Array.from for compatibility
    const otpEntries = Array.from(otpStore.entries())
    for (const [key, value] of otpEntries) {
      if (value.expires < Date.now()) {
        otpStore.delete(key)
      }
    }

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Verification Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Security Verification</h1>
              <p>Verification code for secure deletion</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You have requested to <strong>permanently delete</strong> the following item:</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
                <strong>Item:</strong> ${itemName}<br>
                <strong>Type:</strong> ${itemType.replace("-", " ").toUpperCase()}<br>
                <strong>Action:</strong> Permanent Deletion
              </div>

              <p>For security purposes, please use the verification code below to confirm this action:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666;">This code expires in 5 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This action will permanently delete the item and cannot be undone. If you did not request this deletion, please ignore this email and contact your system administrator immediately.
              </div>

              <p>If you have any questions or concerns, please contact your system administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated security email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Voucher Management System</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Create transporter and send email
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"Voucher Management System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🔐 Security Code: ${otp} - Confirm Deletion`,
      html: emailHtml,
      text: `Your verification code for deleting ${itemName} is: ${otp}. This code expires in 5 minutes.`,
    })

    return NextResponse.json({
      message: "OTP sent successfully",
      otpKey, // Return key for verification
    })
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ message: "Failed to send OTP", error: error.message }, { status: 500 })
  }
}
