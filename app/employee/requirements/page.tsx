"use client"

import { useState, useEffect } from "react"
import { EmployeeLayout } from "@/components/layout/EmployeeLayout"
import { RequirementsManager } from "@/components/RequirementsManager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EmployeeRequirementsPage() {
  const [currentUserId, setCurrentUserId] = useState("")

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const user = await response.json()
          setCurrentUserId(user.id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  return (
    <EmployeeLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/employee/sales">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Requirements</h1>
      </div>

      <RequirementsManager 
        userRole="employee" 
        currentUserId={currentUserId}
      />
    </EmployeeLayout>
  )
}
