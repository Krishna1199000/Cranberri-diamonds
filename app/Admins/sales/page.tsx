"use client"

import { useState, useEffect,useCallback } from "react"
import { SalesAnalytics } from "@/components/sales/SalesAnalytics"
import { SalesTable } from "@/components/sales/SalesTable"
import { EmployeeRankings } from "@/components/sales/EmployeeRankings"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { RequirementsManager } from "@/components/RequirementsManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function SalesPage() {
  const router = useRouter()
  const [showRankings, setShowRankings] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [currentUserId, setCurrentUserId] = useState("")

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const fetchSalesData = useCallback(async () => {
    try {
      let url = `/api/sales?period=${period}`
      if (period === "custom" && customPeriod.start && customPeriod.end) {
        url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
      }
      if (selectedEmployee && selectedEmployee !== "all") {
        url += `&employeeId=${selectedEmployee}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && Array.isArray(data.entries)) {
        setSalesData(data.entries)
      } else {
        setSalesData([])
        console.error("Invalid data format received:", data)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      setSalesData([])
    }
  }, [period, customPeriod, selectedEmployee])

  // Fetch current user ID for RequirementsManager
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

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData, refreshTrigger])

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Diamond Sales Dashboard</h1>
        <Button
          onClick={() => setShowRankings(!showRankings)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Award className="w-5 h-5" />
          {showRankings ? "Hide Rankings" : "Show Rankings"}
        </Button>
      </div>

      {/* Top-level tabs to unify Sales, Reports, Performance. Navigation preserves existing pages/logic. */}
      <Tabs defaultValue="sales" className="w-full mb-4" onValueChange={(val) => {
        if (val === 'sales') return
        if (val === 'reports') router.push('/Admins/sales-report')
        if (val === 'performance') router.push('/Admins/performance')
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales & Requirements</TabsTrigger>
          <TabsTrigger value="reports">Sales Report</TabsTrigger>
          <TabsTrigger value="performance">Performance Reports</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Inner tabs for the first section: keep existing Sales Dashboard + Requirements tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sales">Sales Dashboard</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          {showRankings && (
            <div className="mb-6">
              <EmployeeRankings salesData={salesData} />
            </div>
          )}
            
          <div className="space-y-6">
            <SalesAnalytics 
            data={salesData}
              period={period}
              setPeriod={setPeriod}
              customPeriod={customPeriod}
              setCustomPeriod={setCustomPeriod}
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={setSelectedEmployee}
            />
            
            <SalesTable 
              salesData={salesData} 
              refreshData={refreshData} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="requirements">
          <RequirementsManager 
            userRole="admin" 
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}