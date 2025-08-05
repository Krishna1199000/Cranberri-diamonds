"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog"

function SignInInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  useEffect(() => {
    if (searchParams.get("forcedLogout") === "1") {
      toast.error("You were logged out because your account was signed in from another device.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        // Check if customer needs approval
        if (data.requiresApproval) {
          toast.success("Signed in successfully")
          router.push("/customer-approval")
        } else {
          toast.success("Signed in successfully")

          // Check user role
          const statusRes = await fetch("/api/auth/status", {
            credentials: "include",
          })
          const statusData = await statusRes.json()

          // Redirect based on role
          if (statusData.role === "admin") {
            router.push("/Admins")
          } else if (statusData.role === "employee") {
            router.push("/employee")
          } else if (statusData.role === "customer") {
            router.push("/Customer")
          } else {
            router.push("/dashboard")
          }
        }
      } else {
        toast.error(data.message || "Invalid email or password")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("Failed to sign in")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-2 text-gray-600">Welcome back!</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>

      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  )
}