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
} from "recharts"
import { Calendar, Download, TrendingUp, Users, DollarSign, Hourglass } from "lucide-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { SaleEntry, EmployeeStats } from "@/types/sales"

// Import components
import SalesTable from "@/components/SalesTable"
import ProfitAnalysis from "@/components/ProfitAnalysis"
import ProfitMetrics from "@/components/ProfitMetrics"

export default function AdminSalesReport() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [salesData, setSalesData] = useState<SaleEntry[]>([])
  const [filteredData, setFilteredData] = useState<SaleEntry[]>([])
  const [period, setPeriod] = useState("30")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [purchaseValue, setPurchaseValue] = useState("") // This seems related to overall ProfitAnalysis, keep it there?
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
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

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

    // Recalculate totals based on the *filtered* data
    const outstanding = filtered.filter((e: SaleEntry) => !e.paymentReceived && !e.isNoSale).reduce((sum, e) => sum + e.saleValue, 0);
    const profit = filtered.filter((e: SaleEntry) => typeof e.purchaseValue === 'number' && e.purchaseValue !== null && typeof e.profit === 'number')
                         .reduce((sum, e) => sum + e.profit!, 0);
    setTotalOutstanding(outstanding);
    setTotalProfit(profit);
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
      setTotalOutstanding(0);
      setTotalProfit(0);
    }
  }, [salesData, selectedEmployee, applyFilters, calculateEmployeeStats])

  const calculateProfit = () => {
    const purchase = parseFloat(purchaseValue)
    if (isNaN(purchase) || purchase <= 0) {
      toast.error("Please enter a valid overall purchase value for this analysis")
      return
    }
    const validSales = filteredData.filter(entry => !entry.isNoSale)
    const totalSales = validSales.reduce((sum, entry) => sum + entry.saleValue, 0)
    const totalProfit = totalSales - purchase
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
    setProfitAnalysis({
      totalSales,
      totalPurchase: purchase,
      totalProfit,
      profitMargin: profitMargin || 0,
      entriesWithProfit: validSales.filter(entry => entry.profit !== undefined && entry.profit !== null && entry.profit > 0).length,
      entriesWithLoss: validSales.filter(entry => entry.profit !== undefined && entry.profit !== null && entry.profit < 0).length,
    })
    setShowProfitAnalysis(true)
  }

  const calculateAllEntryProfits = async () => {
    const entriesWithPurchaseValue = salesData.filter(
      entry => !entry.isNoSale && entry.purchaseValue !== null
    )
    if (entriesWithPurchaseValue.length === 0) {
      toast.warning("Set purchase values for entries to calculate profit")
      return
    }
    let successfulUpdates = 0;
    const profitData = entriesWithPurchaseValue.map(entry => {
      const profit = entry.saleValue - (entry.purchaseValue ?? 0);
      const profitMargin = entry.saleValue !== 0 ? (profit / entry.saleValue) * 100 : 0;
      return { id: entry.id, profit, profitMargin }
    });
    // Update local state optimistically
     setSalesData(prevData => 
        prevData.map(entry => {
            const update = profitData.find(pd => pd.id === entry.id);
            return update ? { ...entry, profit: update.profit, profitMargin: update.profitMargin } : entry;
        })
    );
    try {
      const response = await fetch('/api/sales/bulk-profit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: profitData }),
      });
      const data = await response.json();
      if (data.success) {
          successfulUpdates = profitData.length; // Assume all succeeded if API returns success
          toast.success(`Profit calculated and saved for ${successfulUpdates} entries`);
           // Trigger recalculation of overall Profit Analysis if needed
           // This might depend on whether `ProfitAnalysis` uses the state directly
            // You might need to pass updatedProfitMetrics to the ProfitAnalysis component
            // or update the state it relies on.
      } else {
        toast.error(data.message || "Some profit calculations failed to save");
        // Optionally refetch data to reconcile state if bulk update partially fails
        // fetchSalesData(); 
      }
    } catch (error) {
      console.error("Error saving bulk profit calculations:", error);
      toast.error("Failed to save profit calculations");
       // Optionally refetch data
        // fetchSalesData();
    }
    // Calculate overall analysis based on potentially updated local state
    // This recalculates based on the optimistic update
    const validEntries = salesData.filter(entry => !entry.isNoSale && entry.profit !== undefined && entry.profit !== null);
    if (validEntries.length > 0) {
      const totalSales = validEntries.reduce((sum, entry) => sum + entry.saleValue, 0);
      const totalPurchase = validEntries.reduce((sum, entry) => sum + (entry.purchaseValue || 0), 0);
      const totalProfit = validEntries.reduce((sum, entry) => sum + (entry.profit || 0), 0);
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
      setProfitAnalysis({
        totalSales,
        totalPurchase,
        totalProfit,
        profitMargin: profitMargin || 0,
        entriesWithProfit: validEntries.filter(entry => (entry.profit ?? 0) > 0).length,
        entriesWithLoss: validEntries.filter(entry => (entry.profit ?? 0) < 0).length,
      });
      setShowProfitAnalysis(true);
    }
  }

  const getChartData = () => {
    const grouped: Record<string, { date: string; sales: number }> = {}
    filteredData.forEach(entry => {
      if (!entry.isNoSale) {
        if (!grouped[entry.date]) {
          grouped[entry.date] = { date: entry.date, sales: 0 }
        }
        grouped[entry.date].sales += entry.saleValue
      }
    })
    return Object.values(grouped).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chart data by date
  }
  
  const getEmployeeChartData = () => {
    return employeeStats.slice(0, 5).map(employee => ({
      name: employee.name.split(' ')[0], // Just first name for chart clarity
      sales: employee.totalSales
    }))
  }

  const getProfitMetricsData = (currentSalesData: SaleEntry[]): SaleEntry[] => {
    // Ensure profit is a number, defaulting null/undefined to 0
    return currentSalesData.map(entry => ({
      ...entry,
      profit: entry.profit ?? 0, // Use nullish coalescing operator
      // Ensure purchaseValue is also handled if needed by ProfitMetrics (it expects number)
      purchaseValue: entry.purchaseValue ?? 0,
      // Explicitly handle profitMargin if ProfitMetrics expects it as number
      profitMargin: entry.profitMargin ?? 0,
    }));
  }

  const exportToCSV = () => {
    const headers = [
      'Date', 'Employee', 'Company', 'Tracking ID', 'Shipment', 
      'Sale Value', 'Purchase Value', 'Profit', 'Profit Margin (%)',
      'Carat', 'Color', 'Clarity', 'Description'
    ]
    const rows = filteredData.map(item => [
      item.date,
      item.employeeName,
      item.companyName,
      item.trackingId,
      item.shipmentCarrier,
      item.isNoSale ? 0 : item.saleValue,
      item.purchaseValue ?? '',
      item.profit !== undefined && item.profit !== null ? item.profit : '',
      item.profitMargin !== undefined && item.profitMargin !== null ? item.profitMargin.toFixed(2) : '',
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

  // ---> START: Handler for updating payment status <--- 
  const handleUpdatePaymentStatus = useCallback(async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    console.log(`Attempting to update payment status for ID ${id} to ${newStatus}`);

    // Optimistic UI Update
    const originalSalesData = [...salesData];
    const originalFilteredData = [...filteredData];

    setSalesData(prev => prev.map(entry => entry.id === id ? { ...entry, paymentReceived: newStatus } : entry));
    setFilteredData(prev => prev.map(entry => entry.id === id ? { ...entry, paymentReceived: newStatus } : entry));
    
    // Recalculate totals optimistically
    const updatedFiltered = filteredData.map(entry => entry.id === id ? { ...entry, paymentReceived: newStatus } : entry);
    const outstanding = updatedFiltered.filter((e: SaleEntry) => !e.paymentReceived && !e.isNoSale).reduce((sum, e) => sum + e.saleValue, 0);
    setTotalOutstanding(outstanding); // Profit doesn't change with payment status

    try {
      const response = await fetch(`/api/sales/${id}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReceived: newStatus }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update status on server");
      }
      toast.success(`Payment status updated successfully for entry ${id}`);

    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update payment status");
      // Revert Optimistic Update on failure
      setSalesData(originalSalesData);
      setFilteredData(originalFilteredData);
       // Recalculate totals based on reverted data
      const revertedOutstanding = originalFilteredData.filter((e: SaleEntry) => !e.paymentReceived && !e.isNoSale).reduce((sum, e) => sum + e.saleValue, 0);
      setTotalOutstanding(revertedOutstanding);
    }
  }, [salesData, filteredData]);
  // ---> END: Handler for updating payment status <--- 

  return (
    <AdminLayout>
       <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Report Dashboard</h1>
          <div className="flex gap-2">
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
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
               <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
               <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
               </div>
               <p className="text-xs text-muted-foreground">
                 Sum of calculated profit for entries with purchase value set.
               </p>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
               <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
               <div className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                 {totalOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
               </div>
                <p className="text-xs text-muted-foreground">
                 Based on sales entries marked as not received.
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
                    {/* Find selected employee and display name, or show placeholder */}
                    {selectedEmployee === "all" 
                      ? <SelectValue placeholder="All Employees" />
                      : employees.find(emp => emp.id === selectedEmployee)?.name || <SelectValue placeholder="Select Employee" />
                    }
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
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedEmployee === "all" 
                    ? `Viewing all ${employees.length} employees` 
                    : `Filtering for 1 employee`}
                </p>
             </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
              <CardHeader>
                  <CardTitle>Sales Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={getChartData()}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false}/>
                       <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`}/>
                       <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} labelFormatter={(label: string) => `Date: ${label}`} />
                       <Legend />
                       <Bar dataKey="sales" name="Sales" fill="var(--color-sales, #8884d8)" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </CardContent>
          </Card>

          <Card>
             <CardHeader>
                  <CardTitle>Top Employees by Sales</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={getEmployeeChartData()} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`}/>
                       <YAxis type="category" dataKey="name" width={60} fontSize={10} tickLine={false} axisLine={false}/>
                       <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                       <Bar dataKey="sales" name="Total Sales" radius={[0, 4, 4, 0]}>
                         {getEmployeeChartData().map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </CardContent>
          </Card>
        </div>

        <ProfitMetrics 
          salesData={getProfitMetricsData(salesData)} 
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
          
          <Card className="xl:col-span-2">
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
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  />
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  )
}


 