"use client"

import { Card } from "@/components/ui/card"
import { Percent, DollarSign } from "lucide-react"
import { SaleEntry } from "@/types/sales"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface ProfitMetricsProps {
  salesData: SaleEntry[]
  showProfitAnalysis: boolean
}

export default function ProfitMetrics({ salesData, showProfitAnalysis }: ProfitMetricsProps) {
  if (!showProfitAnalysis) return null
  
  const entriesWithProfit = salesData.filter(entry => 
    !entry.isNoSale && 
    typeof entry.profit === 'number' &&
    typeof entry.purchaseValue === 'number'
  ) as (SaleEntry & { profit: number; purchaseValue: number })[];
  
  if (entriesWithProfit.length === 0) return null
  
  const getProfitByDateData = () => {
    const grouped: { 
        [key: string]: { date: string; sales: number; purchase: number; profit: number } 
    } = {};
    
    entriesWithProfit.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = { 
          date: entry.date, 
          sales: 0,
          purchase: 0,
          profit: 0 
        }
      }
      grouped[entry.date].sales += entry.saleValue
      grouped[entry.date].purchase += entry.purchaseValue
      grouped[entry.date].profit += entry.profit
    })
    
    return Object.values(grouped)
  }
  
  const getTopProfitItems = () => {
    const sortedByProfit = [...entriesWithProfit].sort((a, b) => b.profit - a.profit)
    return sortedByProfit.slice(0, 5).map(item => ({
      name: item.companyName.length > 15 
        ? item.companyName.substring(0, 12) + '...' 
        : item.companyName,
      profit: item.profit,
      margin: item.profitMargin ?? 0
    }))
  }
  
  const profitByDateData = getProfitByDateData()
  const topProfitItems = getTopProfitItems()
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Profit Over Time</h2>
          <span className="p-2 bg-blue-100 rounded-full">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitByDateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="#8884d8" stackId="a" />
              <Bar dataKey="purchase" name="Purchase" fill="#82ca9d" stackId="a" />
              <Bar 
                dataKey="profit" 
                name="Profit" 
                fill="#ffc658" 
                radius={[4, 4, 0, 0]}
              >
                {profitByDateData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={(entry as { profit: number }).profit >= 0 ? '#16a34a' : '#dc2626'}
                                  />
                                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Top Profit Items</h2>
          <span className="p-2 bg-green-100 rounded-full">
            <Percent className="h-5 w-5 text-green-600" />
          </span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProfitItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip 
                formatter={(value, name) => [
                  name === "margin" 
                    ? `${(value as number).toFixed(2)}%` 
                    : formatCurrency(value as number), 
                  name === "margin" ? "Margin" : "Profit"
                ]}
              />
              <Legend />
              <Bar 
                dataKey="profit" 
                name="Profit" 
                fill="#16a34a" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}