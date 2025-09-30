"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { Calendar, Download, TrendingUp, Users } from "lucide-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import Link from "next/link"
import { SaleEntry, EmployeeStats } from "@/types/sales"

// Import components
import SalesTable from "@/components/SalesTable"

export default function AdminSalesReport() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [salesData, setSalesData] = useState<SaleEntry[]>([])
  const [filteredData, setFilteredData] = useState<SaleEntry[]>([])
  const [period, setPeriod] = useState("30")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]
  
  const timeRanges = [
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

  const applyFilters = useCallback((data: SaleEntry[], employeeId: string) => {
    let filtered = [...data]
    if (employeeId !== "all") {
      filtered = filtered.filter(item => item.employeeId === employeeId)
    }
    filtered.sort((a, b) => {
      const aValue = a.rawDate.getTime()
      const bValue = b.rawDate.getTime()
      
      if (aValue < bValue) return -1
      if (aValue > bValue) return 1
      return 0
    })
    setFilteredData(filtered)
  }, [])

  const calculateEmployeeStats = useCallback((data: SaleEntry[]) => {
    const stats: Record<string, EmployeeStats> = {}
    data.forEach(entry => {
      if (!entry.isNoSale) {
        if (!stats[entry.employeeId]) {
          stats[entry.employeeId] = {
            id: entry.employeeId,
            name: entry.employeeName,
            salesCount: 0,
            totalSales: 0,
          }
        }
        stats[entry.employeeId].salesCount++
        stats[entry.employeeId].totalSales += entry.saleValue
      }
    })
    const statsArray = Object.values(stats)
    statsArray.sort((a, b) => b.totalSales - a.totalSales)
    setEmployeeStats(statsArray)
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const performFetch = async () => {
      try {
        let url = `/api/sales?period=${period}`
        if (period === "custom" && customPeriod.start && customPeriod.end) {
          url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
        }
        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          // Define the shape of the raw API entry more completely if possible
          interface ApiSaleEntry {
            id: string
            saleDate: string
            employee: { id: string; name: string }
            trackingId?: string
            companyName?: string
            isNoSale: boolean
            totalSaleValue?: number
            purchaseValue?: number | null
            profit?: number | null
            profitMargin?: number | null
            shipmentCarrier?: string
            // Assume items might exist for details
            saleItems?: { carat?: string | number, color?: string, clarity?: string }[]
            description?: string
            paymentReceived: boolean; // Ensure this is expected from API
          }
          const formattedData = data.entries.map((entry: ApiSaleEntry): SaleEntry => {
            // Extract details from the first sale item if available
            const firstItem = entry.saleItems?.[0];
            return {
              id: entry.id,
              date: new Date(entry.saleDate).toLocaleDateString(),
              rawDate: new Date(entry.saleDate), // Keep raw date for sorting
              employeeId: entry.employee.id,
              employeeName: entry.employee.name,
              trackingId: entry.trackingId || "-",
              companyName: entry.companyName || "No Sale",
              isNoSale: entry.isNoSale,
              saleValue: entry.totalSaleValue || 0,
              purchaseValue: entry.purchaseValue !== undefined ? entry.purchaseValue : null,
              profit: entry.profit !== undefined ? entry.profit : null,
              profitMargin: entry.profitMargin !== undefined ? entry.profitMargin : null,
              shipmentCarrier: entry.shipmentCarrier || "N/A",
              details: { // Populate details from the first item
                carat: firstItem?.carat,
                color: firstItem?.color,
                clarity: firstItem?.clarity,
              },
              description: entry.description || "",
              paymentReceived: entry.paymentReceived, // Ensure this line exists and is correct
            }
           })
          setSalesData(formattedData)
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
        toast.error("Failed to fetch sales data")
        setSalesData([])
      }
    }
    performFetch()
  }, [period, customPeriod])

  useEffect(() => {
    if (salesData.length > 0) {
      applyFilters(salesData, selectedEmployee)
      calculateEmployeeStats(salesData)
    } else {
      setFilteredData([])
      setEmployeeStats([])
    }
  }, [salesData, selectedEmployee, applyFilters, calculateEmployeeStats])

  const getChartData = () => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return []
    }

    const grouped: Record<string, { date: string; sales: number; count: number }> = {}
    
    filteredData.forEach(entry => {
      if (entry && !entry.isNoSale && entry.saleValue > 0) {
        const dateKey = new Date(entry.rawDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = { 
            date: dateKey, 
            sales: 0, 
            count: 0 
          }
        }
        grouped[dateKey].sales += Number(entry.saleValue || 0)
        grouped[dateKey].count += 1
      }
    })
    
    return Object.values(grouped).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  
  const getEmployeeChartData = () => {
    if (!Array.isArray(employeeStats) || employeeStats.length === 0) {
      return []
    }
    
    return employeeStats.slice(0, 5).map(employee => ({
      name: employee.name.split(' ')[0], // Just first name for chart clarity
      sales: employee.totalSales,
      count: employee.salesCount
    }))
  }

  const getPieChartData = () => {
    if (!Array.isArray(employeeStats) || employeeStats.length === 0) {
      return []
    }
    
    return employeeStats.slice(0, 6).map((employee, index) => ({
      name: employee.name.split(' ')[0],
      value: employee.totalSales,
      fill: COLORS[index % COLORS.length]
    }))
  }

  const exportToCSV = () => {
    const headers = [
      'Date', 'Employee', 'Company', 'Tracking ID',
      'Sale Value', 'Carat', 'Color', 'Clarity', 'Description'
    ]
    const rows = filteredData.map(item => [
      item.date,
      item.employeeName,
      item.companyName,
      item.trackingId,
      item.isNoSale ? 0 : item.saleValue,
      item.details.carat || '',
      item.details.color || '',
      item.details.clarity || '',
      item.description
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell.replace(/"/g, '""')}"` // Escape double quotes
          : cell
      ).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminLayout>
       <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Report Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/Admins/sales">
              <Button variant="outline">Back to Sales</Button>
            </Link>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
               <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">
                  ${filteredData
                    .filter(item => !item.isNoSale)
                    .reduce((sum, item) => sum + item.saleValue, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               <p className="text-xs text-muted-foreground">
                 {filteredData.filter(item => !item.isNoSale).length} transactions
               </p>
             </CardContent>
          </Card>
          
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Period</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
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
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="date"
                      value={customPeriod.start}
                      onChange={(e) => setCustomPeriod(prev => ({ ...prev, start: e.target.value }))}
                      placeholder="Start Date"
                      className="w-full text-xs p-2"
                    />
                    <Input
                      type="date"
                      value={customPeriod.end}
                      onChange={(e) => setCustomPeriod(prev => ({ ...prev, end: e.target.value }))}
                      placeholder="End Date"
                      className="w-full text-xs p-2"
                    />
                  </div>
                )}
              </CardContent>
          </Card>
          
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Employee Filter</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                 <SelectTrigger>
                   <SelectValue placeholder="All Employees" />
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
             </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
             <CardHeader>
                  <CardTitle>Sales Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px]">
                   {getChartData().length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={getChartData()}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                         <XAxis 
                           dataKey="date" 
                           tick={{ fontSize: 12 }}
                           tickLine={{ stroke: '#ccc' }}
                           axisLine={{ stroke: '#ccc' }}
                         />
                         <YAxis 
                           tick={{ fontSize: 12 }}
                           tickLine={{ stroke: '#ccc' }}
                           axisLine={{ stroke: '#ccc' }}
                           tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                         />
                         <Tooltip 
                           formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']} 
                           labelFormatter={(label: string) => `Date: ${label}`}
                           contentStyle={{
                             backgroundColor: 'white',
                             border: '1px solid #ccc',
                             borderRadius: '6px',
                             boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                           }}
                         />
                         <Legend />
                         <Bar dataKey="sales" name="Sales ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                       </BarChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                       <div className="text-center">
                         <div className="text-4xl mb-2">📊</div>
                         <p>No sales data available</p>
                         <p className="text-sm mt-1">Try adjusting your filters or time period</p>
                       </div>
                     </div>
                   )}
                 </div>
              </CardContent>
          </Card>

          <Card>
             <CardHeader>
                  <CardTitle>Top Employees by Sales</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px]">
                   {getEmployeeChartData().length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={getEmployeeChartData()} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                         <XAxis 
                           type="number" 
                           tick={{ fontSize: 12 }}
                           tickLine={{ stroke: '#ccc' }}
                           axisLine={{ stroke: '#ccc' }}
                           tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                         />
                         <YAxis 
                           type="category" 
                           dataKey="name" 
                           width={80} 
                           tick={{ fontSize: 12 }}
                           tickLine={{ stroke: '#ccc' }}
                           axisLine={{ stroke: '#ccc' }}
                         />
                         <Tooltip 
                           formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Sales']}
                           contentStyle={{
                             backgroundColor: 'white',
                             border: '1px solid #ccc',
                             borderRadius: '6px',
                             boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                           }}
                         />
                         <Bar dataKey="sales" name="Total Sales ($)" radius={[0, 4, 4, 0]}>
                           {getEmployeeChartData().map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                       <div className="text-center">
                         <div className="text-4xl mb-2">👥</div>
                         <p>No employee data available</p>
                         <p className="text-sm mt-1">Try adjusting your filters or time period</p>
                       </div>
                     </div>
                   )}
                 </div>
              </CardContent>
          </Card>

          <Card>
             <CardHeader>
                  <CardTitle>Sales Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px]">
                   {getPieChartData().length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={getPieChartData()}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                         >
                           {getPieChartData().map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} />
                           ))}
                         </Pie>
                         <Tooltip 
                           formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
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
                         <div className="text-4xl mb-2">🥧</div>
                         <p>No sales data available</p>
                         <p className="text-sm mt-1">Try adjusting your filters or time period</p>
                       </div>
                     </div>
                   )}
                 </div>
              </CardContent>
          </Card>
        </div>

        <Card>
             <CardHeader>
                 <div className="flex justify-between items-center">
                     <CardTitle>Sales Entries</CardTitle>
                     <Badge variant="outline">{filteredData.length} entries</Badge>
                 </div>
                 <CardDescription>Detailed view of individual sales entries.</CardDescription>
             </CardHeader>
            <CardContent>
                 <SalesTable 
                    salesData={filteredData}
                  />
            </CardContent>
          </Card>
    </AdminLayout>
  )
}