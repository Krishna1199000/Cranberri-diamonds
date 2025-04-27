"use client"

import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SaleEntry } from "@/types/sales"
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

interface SalesAnalyticsProps {
  salesData: SaleEntry[]
  period: string
  setPeriod: (period: string) => void
  customPeriod: { start: string; end: string }
  setCustomPeriod: (period: { start: string; end: string }) => void
}

export function SalesAnalytics({
  salesData,
  period,
  setPeriod,
  customPeriod,
  setCustomPeriod,
}: SalesAnalyticsProps) {
  const timeRanges = [
    { value: "1", label: "Last 24 Hours" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last Quarter" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ]

  const chartData = salesData
  .filter(entry => !entry.isNoSale)
  .map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    value: entry.saleValue || 0  // use entry.saleValue instead of entry.totalSaleValue
  }))
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>
      
      <div className="mb-4">
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
              onChange={(e) =>
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