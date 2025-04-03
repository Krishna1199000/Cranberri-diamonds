"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Edit2, Trash2, Award } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [isNoSale, setIsNoSale] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    companyName: "",
    carat: "",
    color: "",
    clarity: "",
    cut: "",
    totalSaleValue: "",
    totalProfit: "",
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
    profit: number
  }

  const [salesData, setSalesData] = useState<SalesEntry[]>([])
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all") // Changed default value
  interface EmployeeRanking {
    id: string
    name: string
    totalSales: number
    totalProfit: number
    salesCount: number
    avgProfit: number
  }
  const [rankings, setRankings] = useState<EmployeeRanking[]>([])
  const [showRankings, setShowRankings] = useState(false)

  const timeRanges = [
    { value: "1", label: "Last 24 Hours" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last Quarter" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ]

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      if (data.success) {
        setEmployees(data.employees)
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

  interface EmployeeStats {
    name: string;
    totalSales: number;
    totalProfit: number;
    salesCount: number;
  }

  const calculateRankings = (data: SalesEntry[]) => {
    const employeeStats: Record<string, EmployeeStats> = {}
    
    data.forEach((entry) => {
      if (!entry.isNoSale) {
        const employeeId = entry.employee.id
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            name: entry.employee.name,
            totalSales: 0,
            totalProfit: 0,
            salesCount: 0,
          }
        }
        employeeStats[employeeId].totalSales += entry.totalSaleValue || 0
        employeeStats[employeeId].totalProfit += entry.totalProfit || 0
        employeeStats[employeeId].salesCount += 1
      }
    })

    const rankings = Object.entries(employeeStats).map(([id, stats]) => ({
      id,
      name: stats.name,
      totalSales: stats.totalSales,
      totalProfit: stats.totalProfit,
      salesCount: stats.salesCount,
      avgProfit: stats.totalProfit / stats.salesCount,
    }))

    rankings.sort((a, b) => b.totalProfit - a.totalProfit)
    setRankings(rankings)
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
      
      if (data.success) {
        const formattedData = data.entries.map((entry) => ({
          ...entry,
          date: new Date(entry.saleDate).toLocaleDateString(),
          profit: entry.totalProfit || 0,
          sale: entry.totalSaleValue || 0,
          trackingId: entry.trackingId,
        }))
        setSalesData(formattedData)
        calculateRankings(data.entries)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      toast.error("Failed to fetch sales data")
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [period, customPeriod, selectedEmployee])

  const handleEdit = (entry) => {
    setIsEditing(true)
    setEditingId(entry.id)
    setFormData({
      companyName: entry.companyName || "",
      carat: entry.carat?.toString() || "",
      color: entry.color || "",
      clarity: entry.clarity || "",
      cut: entry.cut || "",
      totalSaleValue: entry.totalSaleValue?.toString() || "",
      totalProfit: entry.totalProfit?.toString() || "",
      description: entry.description || "",
      saleDate: new Date(entry.saleDate).toISOString().split("T")[0],
      isNoSale: entry.isNoSale,
    })
    setIsNoSale(entry.isNoSale)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await fetch("/api/sales", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          toast.success("Entry deleted successfully")
          fetchSalesData()
        } else {
          toast.error("Failed to delete entry")
        }
      } catch (error) {
        console.error("Error deleting entry:", error)
        toast.error("Failed to delete entry")
      }
    }
  }

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
          carat: "",
          color: "",
          clarity: "",
          cut: "",
          totalSaleValue: "",
          totalProfit: "",
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
          <h1 className="text-3xl font-bold text-gray-800">Admin Sales Dashboard</h1>
          <Button
            onClick={() => setShowRankings(!showRankings)}
            className="flex items-center gap-2"
          >
            <Award className="w-5 h-5" />
            {showRankings ? "Hide Rankings" : "Show Rankings"}
          </Button>
        </div>

        {showRankings && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Employee Rankings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rankings.map((employee, index) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${employee.totalSales.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${employee.totalProfit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{employee.salesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${employee.avgProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Entry Form */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">
              {isEditing ? "Edit Sales Entry" : "New Sales Entry"}
            </h2>
            
            {/* Form content - Same as employee form but with employee selection */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
                      carat: "",
                      color: "",
                      clarity: "",
                      cut: "",
                      totalSaleValue: "",
                      totalProfit: "",
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
                      <Select
                        value={formData.color}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Color" />
                        </SelectTrigger>
                        <SelectContent>
                          {["D", "E", "F", "G", "H", "I", "J"].map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Clarity</label>
                      <Select
                        value={formData.clarity}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, clarity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Clarity" />
                        </SelectTrigger>
                        <SelectContent>
                          {["IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"].map((clarity) => (
                            <SelectItem key={clarity} value={clarity}>
                              {clarity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Cut</label>
                      <Select
                        value={formData.cut}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, cut: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Cut" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Excellent", "Very Good", "Good", "Fair"].map((cut) => (
                            <SelectItem key={cut} value={cut}>
                              {cut}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium mb-1">Total Profit</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.totalProfit}
                        onChange={(e) => setFormData((prev) => ({ ...prev, totalProfit: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    isNoSale ? "Explain why there were no sales today..." : "Add any additional notes about the sale..."
                  }
                  className="min-h-[100px]"
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
                    <Bar dataKey="profit" name="Profit" fill="#82ca9d" />
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
                        Tracking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.trackingId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isNoSale ? "No Sale" : entry.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isNoSale ? "-" : `$${entry.sale.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isNoSale ? "-" : `$${entry.profit.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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