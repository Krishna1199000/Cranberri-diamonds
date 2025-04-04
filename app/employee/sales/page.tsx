"use client"

import type React from "react"
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
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function EmployeeDashboard() {
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([])
  const [isNoSale, setIsNoSale] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [salesData, setSalesData] = useState<
    {
      date: string;
      profit: number;
      sale: number;
      company: string;
      isNoSale: boolean;
      description: string;
      details: {
        carat: string | null;
        color: string | null;
        clarity: string | null;
        cut: string | null;
      };
    }[]
  >([])
  const [period, setPeriod] = useState("7")
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" })
  const [selectedDataPoint, setSelectedDataPoint] = useState<{
    date: string;
    profit: number;
    sale: number;
    company: string;
    isNoSale: boolean;
    description: string;
    details: {
      carat: string | null;
      color: string | null;
      clarity: string | null;
      cut: string | null;
    };
  } | null>(null)
  const [showPieChart, setShowPieChart] = useState(false)

  const timeRanges = [
    { value: "1", label: "Last 24 Hours" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last Quarter" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ]

  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies...');
      const response = await fetch("/api/companies")
      const data = await response.json()
      console.log('Companies response:', data);
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to fetch companies")
    }
  }
  useEffect(()=>{
    const fetchSalesData = async () => {
      try {
        console.log('Fetching sales data...');
        let url = `/api/sales?period=${period}`
        if (period === "custom" && customPeriod.start && customPeriod.end) {
          url = `/api/sales?start=${customPeriod.start}&end=${customPeriod.end}`
        }
        console.log('Fetching from URL:', url);
  
        const response = await fetch(url)
        const data = await response.json()
        console.log('Sales data response:', data);
        
        if (data.success) {
          const formattedData = data.entries.map((entry) => ({
            date: new Date(entry.saleDate).toLocaleDateString(),
            profit: entry.totalProfit || 0,
            sale: entry.totalSaleValue || 0,
            company: entry.companyName || "No Sale",
            isNoSale: entry.isNoSale,
            description: entry.description,
            details: {
              carat: entry.carat,
              color: entry.color,
              clarity: entry.clarity,
              cut: entry.cut,
            },
          }))
          console.log('Formatted sales data:', formattedData);
          setSalesData(formattedData)
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
        toast.error("Failed to fetch sales data")
      }
    }
    fetchSalesData()
  },[period, customPeriod])
  

  useEffect(() => {
    fetchCompanies()
  }, [])



  const validateForm = () => {
    if (!isNoSale) {
      if (!formData.companyName) {
        toast.error("Please select a company")
        return false
      }
      if (!formData.totalSaleValue) {
        toast.error("Please enter total sale value")
        return false
      }
      if (!formData.totalProfit) {
        toast.error("Please enter total profit")
        return false
      }
      if (parseFloat(formData.totalProfit) > parseFloat(formData.totalSaleValue)) {
        toast.error("Profit cannot be greater than sale value")
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Starting form submission with data:', formData);

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const formattedData = {
        ...formData,
        carat: formData.carat ? Number.parseFloat(formData.carat) : null,
        totalSaleValue: formData.totalSaleValue ? Number.parseFloat(formData.totalSaleValue) : null,
        totalProfit: formData.totalProfit ? Number.parseFloat(formData.totalProfit) : null,
        saleDate: new Date(formData.saleDate).toISOString(),
      }
      
      console.log('Sending formatted data to API:', formattedData);
      
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('Successfully submitted sales entry');
        toast.success("Sales entry submitted successfully")
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
      
      } else {
        console.error('Error response:', data);
        toast.error(data.message || "Failed to submit sales entry")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit sales entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNoSaleClick = () => {
    console.log('Switching to no-sale mode');
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
  }

  const handleChartClick = (data) => {
    console.log('Chart clicked with data:', data);
    setSelectedDataPoint(data)
    setShowPieChart(true)
  }

  const getPieChartData = () => {
    if (!selectedDataPoint || selectedDataPoint.isNoSale) return []
    return [
      { name: "Profit", value: selectedDataPoint.profit },
      { name: "Cost", value: selectedDataPoint.sale - selectedDataPoint.profit },
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-2xl font-bold mb-6 text-gray-800">Today&#39;s Date: {new Date().toLocaleDateString()}</div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <Card className="p-6 bg-white shadow-lg rounded-xl">
            <motion.h2
              className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              New Sales Entry
            </motion.h2>

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
                onClick={handleNoSaleClick}
                className={`flex-1 ${isNoSale ? "bg-blue-600" : "bg-gray-300"}`}
              >
                No Sale
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
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
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Total Profit</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.totalProfit}
                        onChange={(e) => setFormData((prev) => ({ ...prev, totalProfit: e.target.value }))}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
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

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isSubmitting ? "Submitting..." : "Submit Entry"}
                </Button>
              </motion.div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-white shadow-lg rounded-xl">
              <div className="flex flex-col space-y-4">
                <motion.h2
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Sales Performance
                </motion.h2>

                <div className="flex items-center gap-4">
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
                        onChange={(e) => setCustomPeriod((prev) => ({ ...prev, start: e.target.value }))}
                        className="w-auto"
                      />
                      <Input
                        type="date"
                        value={customPeriod.end}
                        onChange={(e) => setCustomPeriod((prev) => ({ ...prev, end: e.target.value }))}
                        className="w-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              <motion.div
                className="h-[300px] mt-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesData}
                    onClick={(data) => data && data.activePayload && handleChartClick(data.activePayload[0].payload)}
                  >
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="saleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666" }} />
                    <YAxis stroke="#666" tick={{ fill: "#666" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#profitGradient)"
                      strokeWidth={2}
                      name="Profit"
                    />
                    <Area
                      type="monotone"
                      dataKey="sale"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#saleGradient)"
                      strokeWidth={2}
                      name="Sale"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </Card>

            {showPieChart && selectedDataPoint && (
              <Card className="p-6 bg-white shadow-lg rounded-xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {selectedDataPoint.isNoSale ? "No Sale" : "Sale"} Details for {selectedDataPoint.date}
                  </h3>

                  {selectedDataPoint.isNoSale ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedDataPoint.description || "No description provided"}</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPieChartData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label
                            >
                              {getPieChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Sale Information</h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Company:</span> {selectedDataPoint.company}
                            </p>
                            <p>
                              <span className="font-medium">Total Sale:</span> ${selectedDataPoint.sale.toFixed(2)}
                            </p>
                            <p>
                              <span className="font-medium">Total Profit:</span> ${selectedDataPoint.profit.toFixed(2)}
                            </p>
                            <p>
                              <span className="font-medium">Profit Margin:</span>{" "}
                              {((selectedDataPoint.profit / selectedDataPoint.sale) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Diamond Details</h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Carat:</span> {selectedDataPoint.details.carat || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Color:</span> {selectedDataPoint.details.color || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Clarity:</span> {selectedDataPoint.details.clarity || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Cut:</span> {selectedDataPoint.details.cut || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedDataPoint.description && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedDataPoint.description}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setShowPieChart(false)} variant="outline" className="text-sm">
                      Close Details
                    </Button>
                  </div>
                </motion.div>
              </Card>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recent Sales Summary
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.slice(0, 5).map((entry, index) => (
                    <tr key={index} className={entry.isNoSale ? "bg-gray-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.isNoSale ? "No Sale" : entry.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.isNoSale ? (
                          <span className="italic">N/A</span>
                        ) : (
                          <>
                            {entry.details.carat && `${entry.details.carat}ct `}
                            {entry.details.color && `${entry.details.color} `}
                            {entry.details.clarity && `${entry.details.clarity} `}
                            {entry.details.cut && `${entry.details.cut}`}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.isNoSale ? "-" : `$${entry.sale.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.isNoSale ? "-" : `$${entry.profit.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}