"use client"

import { useState, useEffect, useCallback } from "react"
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

  const fetchSalesData = useCallback(async () => {
    try {
      let url = `/api/sales?period=${period}`
      if (period === "custom" && customPeriod.start && customPeriod.end) {
        url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success && Array.isArray(data.entries)) {
        // Define the structure of the data coming from the API
        interface ApiSaleEntry {
          id: string
          saleDate: string // API uses saleDate
          employee: { id: string; name: string } // API includes employee object
          trackingId?: string
          companyName?: string
          isNoSale: boolean
          totalSaleValue?: number // API uses totalSaleValue
          purchaseValue?: number | null
          profit?: number | null
          profitMargin?: number | null
          shipmentCarrier?: string
          saleItems?: { // API has saleItems array
             carat?: string | number | null
             color?: string | null
             clarity?: string | null
             certificateNo?: string | null
             pricePerCarat?: number | null
             totalValue?: number | null
          }[]
          description?: string
        }

        // Format the API data into the SaleEntry structure
        const formattedData: SaleEntry[] = data.entries.map((entry: ApiSaleEntry) => {
          const firstItem = entry.saleItems?.[0];
          return {
            id: entry.id,
            date: new Date(entry.saleDate).toLocaleDateString(), // Format to string date
            rawDate: new Date(entry.saleDate), // Keep raw date for potential sorting
            employeeId: entry.employee.id,
            employeeName: entry.employee.name,
            trackingId: entry.trackingId || "-",
            companyName: entry.companyName || "No Sale",
            isNoSale: entry.isNoSale,
            saleValue: entry.totalSaleValue || 0, // Map totalSaleValue to saleValue
            purchaseValue: entry.purchaseValue !== undefined ? entry.purchaseValue : null,
            profit: entry.profit !== undefined ? entry.profit : null,
            profitMargin: entry.profitMargin !== undefined ? entry.profitMargin : null,
            shipmentCarrier: entry.shipmentCarrier || "N/A",
            // Create the details object from the first sale item
            details: {
              carat: firstItem?.carat,
              color: firstItem?.color,
              clarity: firstItem?.clarity,
            },
            description: entry.description || "",
          };
        });
        
        setSalesData(formattedData) // Set the correctly formatted data

      } else {
        setSalesData([])
        console.error("Invalid data format received:", data)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      setSalesData([])
    }
  }, [period, customPeriod])

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
              salesData={salesData}
              period={period}
              setPeriod={setPeriod}
              customPeriod={customPeriod}
              setCustomPeriod={setCustomPeriod}
            />

            <SalesTable salesData={salesData} />
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}