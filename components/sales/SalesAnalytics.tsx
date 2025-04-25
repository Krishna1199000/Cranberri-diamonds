"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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

interface Employee {
  id: string
  name: string
  email?: string
}

interface SaleEntry {
  saleDate: string
  totalSaleValue: number
  isNoSale: boolean
  employee?: {
    name: string
  }
}

interface SalesAnalyticsProps {
  salesData: SaleEntry[]
  period: string
  setPeriod: (period: string) => void
  customPeriod: { start: string; end: string }
  setCustomPeriod: (period: { start: string; end: string }) => void
  selectedEmployee: string
  setSelectedEmployee: (employee: string) => void
}

export function SalesAnalytics({
  salesData,
  period,
  setPeriod,
  customPeriod,
  setCustomPeriod,
  selectedEmployee,
  setSelectedEmployee
}: SalesAnalyticsProps) {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "all", name: "All Employees" }
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/employees')
        
        if (!response.ok) {
          throw new Error('Failed to fetch employees')
        }
        
        const data = await response.json()
        
        if (data.success && data.employees) {
          // Add "All Employees" option along with fetched employees
          setEmployees([
            { id: "all", name: "All Employees" },
            ...data.employees
          ])
        } else {
          throw new Error(data.message || 'Failed to fetch employees')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching employees:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const timeRanges = [
    { value: "1", label: "Last 24 Hours" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last Quarter" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ]

  // Transform the sales data for the chart
  const chartData = salesData
    .filter(entry => !entry.isNoSale)
    .map(entry => ({
      date: new Date(entry.saleDate).toLocaleDateString(),
      value: entry.totalSaleValue || 0,
      employee: entry.employee?.name || "Unknown"
    }))
    // Sort by date
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Time Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Employee</label>
          <Select 
            value={selectedEmployee} 
            onValueChange={setSelectedEmployee}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading employees..." : "Select employee"} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      {period === "custom" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-6">
            <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={customPeriod.start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomPeriod({ ...customPeriod, start: e.target.value })
              }
            />
            </div>
            <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={customPeriod.end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomPeriod({ ...customPeriod, end: e.target.value })
              }
            />
            </div>
        </div>
      )}

      <div className="h-64 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="value" name="Sale Amount ($)" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}