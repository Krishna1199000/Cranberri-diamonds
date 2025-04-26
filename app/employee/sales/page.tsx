"use client"

import { useState, useEffect } from "react"
import { SalesEntryForm } from "@/components/employee/sales/SalesEntryForm"
import { SalesAnalytics } from "@/components/employee/sales/SalesAnalytics"
import { SalesTable } from "@/components/employee/sales/SalesTable"
import { EmployeeLayout } from "@/components/layout/EmployeeLayout"
import { SaleEntry } from "@/types/sales"



export default function EmployeeSalesPage() {
  const [salesData, setSalesData] = useState<SaleEntry[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const fetchSalesData = async () => {
    try {
      let url = `/api/sales?period=${period}`
      if (period === "custom" && customPeriod.start && customPeriod.end) {
        url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
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
  }

  useEffect(() => {
    fetchSalesData()
  }, [period, customPeriod, refreshTrigger, fetchSalesData])

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesEntryForm refreshData={refreshData} />

          <div className="space-y-6">
            <SalesAnalytics
              salesData={salesData.map(sale => ({
                saleDate: sale.date, // map date to saleDate
                totalSaleValue: sale.saleValue, // map saleValue to totalSaleValue
                // include other required properties
                ...sale
              }))}
              period={period}
              setPeriod={setPeriod}
              customPeriod={customPeriod}
              setCustomPeriod={setCustomPeriod}
            />

            <SalesTable salesData={salesData.map(sale => ({
              saleDate: sale.date,
              totalSaleValue: sale.saleValue,
              saleItems: sale.details ? [{
                // Add the missing required properties
                certificateNo: sale.trackingId || 'N/A',
                pricePerCarat: sale.saleValue / (parseFloat(sale.details.carat?.toString() || '1') || 1),
                totalValue: sale.saleValue,
                // Fix the carat type issue - ensure it's number | null
                carat: typeof sale.details.carat === 'string'
                  ? parseFloat(sale.details.carat) || null
                  : sale.details.carat || null,
                // Include other properties from details but exclude carat which we've handled above
                color: sale.details.color || null,
                clarity: sale.details.clarity || null
              }] : [],
              ...sale
            }))} />
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}