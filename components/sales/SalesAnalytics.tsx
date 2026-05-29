"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
} from "@/components/ui/card"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { SaleEntry } from "@/types/sales"

interface Employee {
  id: string
  name: string
  email?: string
}

interface SalesAnalyticsProps {
  data: SaleEntry[]
  period: string
  setPeriod: (period: string) => void
  customPeriod: { start: string; end: string }
  setCustomPeriod: (period: { start: string; end: string }) => void
  selectedEmployee: string
  setSelectedEmployee: (employee: string) => void
}

export function SalesAnalytics({
  data,
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

  // When a specific employee/admin is selected, scope the dataset to just them
  const scopedData = React.useMemo(() => {
    if (selectedEmployee === "all") return data
    return data.filter(entry => entry.employeeId === selectedEmployee)
  }, [data, selectedEmployee])

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

  // Transform the sales data for employee performance chart
  const employeeChartData = React.useMemo(() => {
    if (!Array.isArray(scopedData) || scopedData.length === 0) {
      return []
    }

    // Group sales by employee ID to avoid duplicates (even if names are similar)
    const employeeStats: Record<string, { name: string; sales: number; count: number }> = {}
    
    scopedData
      .filter(entry => entry && !entry.isNoSale && entry.saleValue > 0)
      .forEach(entry => {
        const employeeId = entry.employeeId || 'unknown'
        const employeeName = entry.employeeName || 'Unknown'
        
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            name: employeeName.split(' ')[0], // First name only
            sales: 0,
            count: 0
          }
        }
        
        employeeStats[employeeId].sales += Number(entry.saleValue || 0)
        employeeStats[employeeId].count += 1
      })

    // Convert to array and sort by sales
    return Object.values(employeeStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // Top 10 employees
  }, [scopedData])

  // Transform the sales data for sales amount ranges
  const salesAmountData = React.useMemo(() => {
    if (!Array.isArray(scopedData) || scopedData.length === 0) {
      return []
    }

    // Define sales amount ranges
    const ranges = [
      { range: '$0 - $1K', min: 0, max: 1000, count: 0 },
      { range: '$1K - $5K', min: 1000, max: 5000, count: 0 },
      { range: '$5K - $10K', min: 5000, max: 10000, count: 0 },
      { range: '$10K - $25K', min: 10000, max: 25000, count: 0 },
      { range: '$25K+', min: 25000, max: Infinity, count: 0 }
    ]
    
    scopedData
      .filter(entry => entry && !entry.isNoSale && entry.saleValue > 0)
      .forEach(entry => {
        const saleAmount = Number(entry.saleValue || 0)
        
        for (const range of ranges) {
          if (saleAmount >= range.min && saleAmount < range.max) {
            range.count += 1
            break
          }
        }
      })

    return ranges.filter(range => range.count > 0)
  }, [scopedData])

  // Transform the sales data for time-series chart (sales over time)
  const timeSeriesChartData = React.useMemo(() => {
    if (!Array.isArray(scopedData) || scopedData.length === 0) {
      return []
    }

    // Group sales by date
    const salesByDate: Record<string, { value: number; label: string }> = {}
    
    scopedData
      .filter(entry => entry && !entry.isNoSale && entry.saleValue > 0)
      .forEach(entry => {
        // Use rawDate if available, otherwise parse the date string
        const date = entry.rawDate 
          ? new Date(entry.rawDate)
          : new Date(entry.date)
        
        // Use shorter date format to prevent overlap: "MMM DD" instead of "MMM DD, YYYY"
        const dateKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        })
        
        // Store full date for sorting
        const fullDateKey = date.toISOString().split('T')[0]
        
        if (!salesByDate[fullDateKey]) {
          salesByDate[fullDateKey] = { value: 0, label: dateKey }
        }
        
        salesByDate[fullDateKey].value += Number(entry.saleValue || 0)
      })

    // Convert to array and sort by date
    return Object.entries(salesByDate)
      .map(([fullDate, data]: [string, any]) => ({ 
        date: data.label, 
        fullDate,
        value: data.value 
      }))
      .sort((a, b) => {
        const dateA = new Date(a.fullDate).getTime()
        const dateB = new Date(b.fullDate).getTime()
        return dateA - dateB
      })
  }, [scopedData])

  // Find the selected employee object to display their name
  const selectedEmployeeObject = employees.find(emp => emp.id === selectedEmployee);

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
              {/* Display name if an employee is selected, otherwise show placeholder via SelectValue */}
              {selectedEmployeeObject && selectedEmployeeObject.id !== "all" ? (
                selectedEmployeeObject.name
              ) : (
                <SelectValue placeholder={isLoading ? "Loading employees..." : "Select employee"} />
              )}
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

      {/* Sales Over Time Chart */}
      <div className="h-64 mt-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {selectedEmployee === "all" ? "Sales Over Time" : `Sales Over Time — ${selectedEmployeeObject?.name || "Selected"}`}
        </h3>
        {timeSeriesChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeSeriesChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={timeSeriesChartData.length > 10 ? Math.floor(timeSeriesChartData.length / 10) : 0}
                minTickGap={20}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => [
                  `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                  'Sales'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Sales ($)" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>No sales data available for this period</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Employee Performance Chart */}
        <div className="h-64">
          <h3 className="text-lg font-semibold mb-4">
            {selectedEmployee === "all" ? "Top Employees by Sales" : `Sales by ${selectedEmployeeObject?.name || "Selected"}`}
          </h3>
          {employeeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={employeeChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  minTickGap={15}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()}`, 
                    'Total Sales'
                  ]}
                  labelFormatter={(label) => `Employee: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="sales" 
                  name="Sales ($)" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">👥</div>
                <p>No employee data available</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            </div>
          )}
        </div>

        {/* Sales Amount Distribution Chart */}
        <div className="h-64">
          <h3 className="text-lg font-semibold mb-4">Sales Amount Distribution</h3>
          {salesAmountData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesAmountData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {salesAmountData.map((entry, index) => {
                    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} sales`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">💰</div>
                <p>No sales amount data available</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}