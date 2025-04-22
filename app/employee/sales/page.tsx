"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

import { toast } from "sonner"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"


export default function AdminDashboard() {
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([])
  const [isNoSale, setIsNoSale] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    companyName: "",
    trackingId: "",
    carat: "",
    color: "",
    clarity: "",
    shipmentCarrier: "",
    totalSaleValue: "",
    description: "",
    saleDate: new Date().toISOString().split("T")[0],
    isNoSale: false,
  })

  interface SalesEntry {
    id: string
    date: string
    employee: { id: string; name: string }
    trackingId: string
    companyName: string
    isNoSale: boolean
    sale: number
    saleDate: string
    shipmentCarrier: string
  }

  const [salesData, setSalesData] = useState<SalesEntry[]>([])
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee] = useState("all")

 


  const timeRanges = [
    { value: "1", label: "Last 24 Hours" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last Quarter" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ]

  const shipmentCarriers = [
    { value: "UPS", label: "UPS" },
    { value: "FedEx", label: "FedEx" },
    { value: "USPS", label: "USPS" },
    { value: "DHL", label: "DHL" },
  ]

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      if (data.success) {
        
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Failed to fetch employees")
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to fetch companies")
    }
  }



  const fetchSalesData = async () => {
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
        const formattedData = data.entries.map((entry) => {
          // Ensure all properties exist before accessing them
          return {
            id: entry.id || "",
            date: entry.saleDate ? new Date(entry.saleDate).toLocaleDateString() : "",
            rawDate: entry.saleDate ? new Date(entry.saleDate) : new Date(),
            employee: entry.employee || { id: "", name: "" },
            trackingId: entry.trackingId || "-",
            companyName: entry.companyName || "No Sale",
            isNoSale: !!entry.isNoSale,
            sale: parseFloat(entry.totalSaleValue || 0),
            shipmentCarrier: entry.shipmentCarrier || "N/A",
            details: {
              carat: entry.carat || "",
              color: entry.color || "",
              clarity: entry.clarity || "",
            },
            description: entry.description || "",
          };
        });
        
        setSalesData(formattedData);
   
      } else {
        setSalesData([]);
    
        console.error("Invalid data format received:", data);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      toast.error("Failed to fetch sales data")
      setSalesData([]);
     
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [period, customPeriod, selectedEmployee])

  
 

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const method = isEditing ? "PUT" : "POST"
      const formattedData = {
        ...formData,
        ...(isEditing && { id: editingId }),
      }

      const response = await fetch("/api/sales", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Sales entry ${isEditing ? "updated" : "submitted"} successfully`)
        setFormData({
          companyName: "",
          trackingId: "",
          carat: "",
          color: "",
          clarity: "",
          shipmentCarrier: "",
          totalSaleValue: "",
          description: "",
          saleDate: new Date().toISOString().split("T")[0],
          isNoSale: false,
        })
        setIsNoSale(false)
        setIsEditing(false)
        setEditingId("")
        fetchSalesData()
      } else {
        toast.error(data.message || `Failed to ${isEditing ? "update" : "submit"} sales entry`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(`Failed to ${isEditing ? "update" : "submit"} sales entry`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Employee Sales Dashboard</h1>
        </div>
          

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Entry Form */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">
              {isEditing ? "Edit Sales Entry" : "New Sales Entry"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              
              <div className="mb-4 flex gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsNoSale(false)
                    setFormData((prev) => ({ ...prev, isNoSale: false }))
                  }}
                  className={`flex-1 ${!isNoSale ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  Regular Sale
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsNoSale(true)
                    setFormData((prev) => ({
                      ...prev,
                      isNoSale: true,
                      companyName: "",
                      trackingId: "",
                      carat: "",
                      color: "",
                      clarity: "",
                      shipmentCarrier: "",
                      totalSaleValue: "",
                    }))
                  }}
                  className={`flex-1 ${isNoSale ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  No Sale
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sale Date</label>
                <Input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, saleDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              {!isNoSale && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <Select
                      value={formData.companyName}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, companyName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.companyName}>
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Select Shipment</label>
                    <Select
                      value={formData.shipmentCarrier}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, shipmentCarrier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipmentCarriers.map((carrier) => (
                          <SelectItem key={carrier.value} value={carrier.value}>
                            {carrier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking ID</label>
                    <Input
                      type="text"
                      value={formData.trackingId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trackingId: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Carat</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.carat}
                        onChange={(e) => setFormData((prev) => ({ ...prev, carat: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Clarity</label>
                    <Input
                      type="text"
                      value={formData.clarity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clarity: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Total Sale Value</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalSaleValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, totalSaleValue: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    isNoSale ? "Explain why there were no sales today..." : "Add any additional notes about the sale..."
                  }
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isSubmitting ? "Submitting..." : isEditing ? "Update Entry" : "Submit Entry"}
              </Button>
            </form>
          </Card>

          {/* Sales Analytics */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>
              
              {/* Time period selection */}
              <div className="flex items-center gap-4 mb-4">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {period === "custom" && (
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={customPeriod.start}
                      onChange={(e) =>
                        setCustomPeriod((prev) => ({ ...prev, start: e.target.value }))
                      }
                    />
                    <Input
                      type="date"
                      value={customPeriod.end}
                      onChange={(e) =>
                        setCustomPeriod((prev) => ({ ...prev, end: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Sales Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sale" name="Sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Sales Table */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Sales Entries</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Value
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.length > 0 ? (
                      salesData.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.employee?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.isNoSale ? "No Sale" : entry.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.shipmentCarrier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.isNoSale ? "-" : `$${entry.sale.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                            
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No sales data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}