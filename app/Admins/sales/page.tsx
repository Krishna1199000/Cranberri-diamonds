"use client"

import { useState, useEffect,useCallback } from "react"
import { SalesEntryForm } from "@/components/sales/SalesEntryForm"
import { SalesAnalytics } from "@/components/sales/SalesAnalytics"
import { SalesTable } from "@/components/sales/SalesTable"
import { EmployeeRankings } from "@/components/sales/EmployeeRankings"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function SalesPage() {
  const [showRankings, setShowRankings] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all")

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

      {showRankings && (
        <div className="mb-6">
          <EmployeeRankings salesData={salesData} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesEntryForm refreshData={refreshData} />
        
        <div className="space-y-6">
          <SalesAnalytics 
            salesData={salesData}
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
      </div>
    </AdminLayout>
  )
}