"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
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
} from "recharts"
import { Calendar, Download, Filter, TrendingUp, Users } from "lucide-react"

// Import components
import SalesTable from "@/components/SalesTable"
import ProfitAnalysis from "@/components/ProfitAnalysis"
import ProfitMetrics from "@/components/ProfitMetrics"

export default function AdminSalesReport() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  
  // Update the getProfitMetricsData function to match the expected SaleEntry type
  // First, add the correct interface definition for SaleEntry that matches what the ProfitMetrics component expects
  interface SaleEntry {
    id: string;
    date: string;
    rawDate: Date;
    employeeId: string;
    employeeName: string;
    trackingId: string;
    companyName: string;
    isNoSale: boolean;
    saleValue: number;
    purchaseValue: number;
    profit: number;  // Note: This is required, not optional
    profitMargin: number;  // Note: This is required, not optional
    shipmentCarrier: string;
    details: {
      carat?: string;
      color?: string;
      clarity?: string;
    };
    description: string;
  }

  const getProfitMetricsData = (): SaleEntry[] => {
    return salesData
      .filter(
        (entry): entry is SaleEntry & { profit: number; purchaseValue: number; profitMargin: number } =>
          !entry.isNoSale &&
          typeof entry.profit === 'number' && 
          typeof entry.purchaseValue === 'number' &&
          entry.purchaseValue !== null &&
          typeof entry.profitMargin === 'number'
      )
      .map(entry => ({
        ...entry,
        purchaseValue: entry.purchaseValue as number,
        profit: entry.profit as number,
        profitMargin: entry.profitMargin as number
      }));
  }
  
  const [salesData, setSalesData] = useState<SaleEntry[]>([])
  const [filteredData, setFilteredData] = useState<SaleEntry[]>([])
  const [period, setPeriod] = useState("30")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [purchaseValue, setPurchaseValue] = useState("")
  const [profitAnalysis, setProfitAnalysis] = useState({
    totalSales: 0,
    totalPurchase: 0,
    totalProfit: 0,
    profitMargin: 0,
    entriesWithProfit: 0,
    entriesWithLoss: 0,
  })
  const [showProfitAnalysis, setShowProfitAnalysis] = useState(false)
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([])
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" })

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

  const fetchSalesData = async () => {
    try {
      let url = `/api/sales?period=${period}`
      if (period === "custom" && customPeriod.start && customPeriod.end) {
        url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        const formattedData = data.entries.map((entry) => ({
          id: entry.id,
          date: new Date(entry.saleDate).toLocaleDateString(),
          rawDate: new Date(entry.saleDate),
          employeeId: entry.employee.id,
          employeeName: entry.employee.name,
          trackingId: entry.trackingId || "-",
          companyName: entry.companyName || "No Sale",
          isNoSale: entry.isNoSale,
          saleValue: entry.totalSaleValue || 0,
          purchaseValue: entry.purchaseValue || null,
          profit: entry.profit,
          profitMargin: entry.profitMargin,
          shipmentCarrier: entry.shipmentCarrier || "N/A",
          details: {
            carat: entry.carat,
            color: entry.color,
            clarity: entry.clarity,
          },
          description: entry.description || "",
        }))
        
        setSalesData(formattedData)
        applyFilters(formattedData, selectedEmployee)
        calculateEmployeeStats(formattedData)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      toast.error("Failed to fetch sales data")
    }
  }

  // New function to save purchase value to the backend
  const savePurchaseValue = async (id, value) => {
    try {
      const response = await fetch(`/api/sales/${id}/purchase-value`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseValue: value }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Purchase value saved successfully");
        return true;
      } else {
        toast.error(data.message || "Failed to save purchase value");
        return false;
      }
    } catch (error) {
      console.error("Error saving purchase value:", error);
      toast.error("Failed to save purchase value");
      return false;
    }
  }

  const applyFilters = (data, employeeId) => {
    let filtered = [...data]
    
    if (employeeId !== "all") {
      filtered = filtered.filter(item => item.employeeId === employeeId)
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      const aValue = sortConfig.key === 'date' ? a.rawDate : a[sortConfig.key]
      const bValue = sortConfig.key === 'date' ? b.rawDate : b[sortConfig.key]
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
    
    setFilteredData(filtered)
  }

  interface EmployeeStats {
    id: string
    name: string
    salesCount: number
    totalSales: number
  }

  const calculateEmployeeStats = (data) => {
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
  }

  const calculateProfit = () => {
    const purchase = parseFloat(purchaseValue)
    
    if (isNaN(purchase) || purchase <= 0) {
      toast.error("Please enter a valid purchase value")
      return
    }
    
    // Calculate totals only for non-NoSale entries
    const validSales = filteredData.filter(entry => !entry.isNoSale)
    const totalSales = validSales.reduce((sum, entry) => sum + entry.saleValue, 0)
    
    const totalProfit = totalSales - purchase
    const profitMargin = (totalProfit / totalSales) * 100
    
    setProfitAnalysis({
      totalSales,
      totalPurchase: purchase,
      totalProfit,
      profitMargin: profitMargin || 0,
      entriesWithProfit: validSales.filter(entry => entry.profit && entry.profit > 0).length,
      entriesWithLoss: validSales.filter(entry => entry.profit && entry.profit < 0).length,
    })
    
    setShowProfitAnalysis(true)
  }

  // Modified to save the purchase value to backend
  const updateEntryPurchaseValue = async (id, value) => {
    // First update local state for immediate UI feedback
    setSalesData(prevData => 
      prevData.map(entry => 
        entry.id === id 
          ? { ...entry, purchaseValue: value } 
          : entry
      )
    )
    
    // Then save to backend
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      await savePurchaseValue(id, parsedValue);
    }
  }

  // Modified to also save profit calculation to backend
  const calculateEntryProfit = async (id) => {
    // First find the entry
    const entry = salesData.find(e => e.id === id);
    
    if (entry && entry.purchaseValue !== null) {
      const profit = entry.saleValue - entry.purchaseValue;
      const profitMargin = (profit / entry.saleValue) * 100;
      
      // Update local state
      setSalesData(prevData => 
        prevData.map(entry => {
          if (entry.id === id && entry.purchaseValue !== null) {
            return { 
              ...entry, 
              profit, 
              profitMargin 
            }
          }
          return entry
        })
      )
      
      // Save profit calculation to backend
      try {
        const response = await fetch(`/api/sales/${id}/profit`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profit, profitMargin }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success("Profit calculated and saved for this entry");
        } else {
          toast.error(data.message || "Failed to save profit calculation");
        }
      } catch (error) {
        console.error("Error saving profit calculation:", error);
        toast.error("Failed to save profit calculation");
      }
    } else {
      toast.error("Entry must have a purchase value to calculate profit");
    }
  }

  // Modified to save all profit calculations to backend
  const calculateAllEntryProfits = async () => {
    const entriesWithPurchaseValue = salesData.filter(
      entry => !entry.isNoSale && entry.purchaseValue !== null
    )
    
    if (entriesWithPurchaseValue.length === 0) {
      toast.error("No entries have purchase values set")
      return
    }
    
    const updatedData = salesData.map(entry => {
      if (!entry.isNoSale && entry.purchaseValue !== null) {
        const profit = entry.saleValue - entry.purchaseValue
        const profitMargin = (profit / entry.saleValue) * 100
        
        return { 
          ...entry, 
          profit, 
          profitMargin 
        }
      }
      return entry
    })
    
    setSalesData(updatedData)
    
    // Save all profit calculations to backend
    try {
      const profitData = entriesWithPurchaseValue.map(entry => ({
        id: entry.id,
        profit: entry.saleValue - entry.purchaseValue,
        profitMargin: ((entry.saleValue - entry.purchaseValue) / entry.saleValue) * 100
      }));
      
      const response = await fetch('/api/sales/bulk-profit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: profitData }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.message || "Some profit calculations could not be saved");
      }
    } catch (error) {
      console.error("Error saving bulk profit calculations:", error);
      toast.error("Failed to save some profit calculations");
    }
    
    // Calculate overall profit metrics
    const validEntries = updatedData.filter(
      entry => !entry.isNoSale && entry.profit !== undefined
    )
    
    if (validEntries.length > 0) {
      const totalSales = validEntries.reduce((sum, entry) => sum + entry.saleValue, 0)
      const totalPurchase = validEntries.reduce((sum, entry) => sum + (entry.purchaseValue || 0), 0)
      const totalProfit = validEntries.reduce((sum, entry) => sum + (entry.profit || 0), 0)
      const profitMargin = (totalProfit / totalSales) * 100
      
      setProfitAnalysis({
        totalSales,
        totalPurchase,
        totalProfit,
        profitMargin: profitMargin || 0,
        entriesWithProfit: validEntries.filter(entry => entry.profit !== undefined && entry.profit > 0).length,
        entriesWithLoss: validEntries.filter(entry => entry.profit !== undefined && entry.profit < 0).length,
      })
      
      setShowProfitAnalysis(true)
      
      toast.success(`Profit calculated for ${validEntries.length} entries`);
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [period, customPeriod])

  useEffect(() => {
    applyFilters(salesData, selectedEmployee)
  }, [selectedEmployee, salesData, sortConfig])

  const getChartData = () => {
    // Group by date
    const grouped = {}
    
    filteredData.forEach(entry => {
      if (!entry.isNoSale) {
        if (!grouped[entry.date]) {
          grouped[entry.date] = { date: entry.date, sales: 0 }
        }
        grouped[entry.date].sales += entry.saleValue
      }
    })
    
    return Object.values(grouped)
  }
  
  const getEmployeeChartData = () => {
    return employeeStats.slice(0, 5).map(employee => ({
      name: employee.name.split(' ')[0], // Just first name for chart clarity
      sales: employee.totalSales
    }))
  }

  const exportToCSV = () => {
    // Prepare data
    const headers = [
      'Date', 
      'Employee', 
      'Company', 
      'Tracking ID', 
      'Shipment', 
      'Sale Value',
      'Purchase Value',
      'Profit',
      'Profit Margin (%)',
      'Carat', 
      'Color', 
      'Clarity',
      'Description'
    ]
    
    const rows = filteredData.map(item => [
      item.date,
      item.employeeName,
      item.companyName,
      item.trackingId,
      item.shipmentCarrier,
      item.isNoSale ? 0 : item.saleValue,
      item.purchaseValue || '',
      item.profit !== undefined ? item.profit : '',
      item.profitMargin !== undefined ? item.profitMargin.toFixed(2) : '',
      item.details.carat || '',
      item.details.color || '',
      item.details.clarity || '',
      item.description
    ])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(','))
    ].join('\n')
    
    // Create download link
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Report Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Total Sales</h3>
              <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </span>
            </div>
            <span className="text-3xl font-bold">${filteredData
              .filter(item => !item.isNoSale)
              .reduce((sum, item) => sum + item.saleValue, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredData.filter(item => !item.isNoSale).length} transactions
            </span>
          </Card>
          
          <Card className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Time Period</h3>
              <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </span>
            </div>
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
                  className="w-full"
                />
                <Input
                  type="date"
                  value={customPeriod.end}
                  onChange={(e) => setCustomPeriod(prev => ({ ...prev, end: e.target.value }))}
                  placeholder="End Date"
                  className="w-full"
                />
              </div>
            )}
          </Card>
          
          <Card className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Employee Filter</h3>
              <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </span>
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {selectedEmployee === "all" 
                ? `${employees.length} employees` 
                : `Filtering for 1 employee`}
            </span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Sales Performance</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Top Employees</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getEmployeeChartData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Bar dataKey="sales" name="Total Sales" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                    {getEmployeeChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <ProfitMetrics 
          salesData={getProfitMetricsData()} 
          showProfitAnalysis={showProfitAnalysis} 
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-1">
            <ProfitAnalysis 
              salesData={filteredData}
              purchaseValue={purchaseValue}
              setPurchaseValue={setPurchaseValue}
              profitAnalysis={profitAnalysis}
              showProfitAnalysis={showProfitAnalysis}
              setShowProfitAnalysis={setShowProfitAnalysis}
              calculateProfit={calculateProfit}
              calculateAllEntryProfits={calculateAllEntryProfits}
            />
          </div>
          
          <Card className="p-6 xl:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Sales Entries</h2>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  {filteredData.length} entries
                </Badge>
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <SalesTable 
              data={filteredData}
              sortConfig={sortConfig}
              handleSort={handleSort}
              updateEntryPurchaseValue={updateEntryPurchaseValue}
              calculateEntryProfit={calculateEntryProfit}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}