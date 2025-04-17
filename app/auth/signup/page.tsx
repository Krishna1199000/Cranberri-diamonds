"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isLongEnough = password.length >= 8

  const errors: string[] = []
  if (!hasUpperCase) errors.push("one uppercase letter")
  if (!hasLowerCase) errors.push("one lowercase letter")
  if (!hasNumber) errors.push("one number")
  if (!hasSpecialChar) errors.push("one special character")
  if (!isLongEnough) errors.push("minimum 8 characters")

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default function SignUp() {
  const router = useRouter()
  const [step, setStep] = useState("signup") // 'signup' or 'otp'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
  })
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const handlePasswordChange = (password: string) => {
    const validation = validatePassword(password)
    setPasswordErrors(validation.errors)
    setFormData({ ...formData, password })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validatePassword(formData.password)
    if (!validation.isValid) {
      toast.error(`Password must contain ${validation.errors.join(", ")}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStep("otp")
        toast.success("Please check your email for OTP")
      } else {
        toast.error(data.message || "Something went wrong")
      }
    } catch {
      toast.error("Failed to sign up")
    }

    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Account verified successfully")
        router.push("/dashboard")
      } else {
        toast.error(data.message || "Invalid OTP")
      }
    } catch {
      toast.error("Failed to verify OTP")
    }

    setLoading(false)
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Verify OTP</h2>
            <p className="mt-2 text-gray-600">Enter the OTP sent to your email</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign Up</h2>
          <p className="mt-2 text-gray-600">Create your account to get started</p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              {passwordErrors.length > 0 && (
                <div className="mt-2 text-sm text-red-500">
                  Password must contain:
                  <ul className="list-disc list-inside">
                    {passwordErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || passwordErrors.length > 0}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}