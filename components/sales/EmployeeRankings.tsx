"use client"

import React from "react"
import { Card } from "@/components/ui/card"
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
  Cell,
} from "recharts"

interface EmployeeRanking {
  id: string
  name: string
  totalSales: number
  salesCount: number
}

interface EmployeeRankingsProps {
  salesData: SaleEntry[]
}

export function EmployeeRankings({ salesData }: EmployeeRankingsProps) {
  // Calculate rankings from the sales data
  const calculateRankings = (data: SaleEntry[]): EmployeeRanking[] => {
    if (!Array.isArray(data)) {
      return [];
    }
    
    const stats: Record<string, EmployeeRanking> = {};
    
    data.forEach(entry => {
      if (!entry || !entry.employeeId || !entry.employeeName) {
        return;
      }
      
      if (!entry.isNoSale) {
        if (!stats[entry.employeeId]) {
          stats[entry.employeeId] = {
            id: entry.employeeId,
            name: entry.employeeName,
            salesCount: 0,
            totalSales: 0,
          }
        }
        
        stats[entry.employeeId].salesCount++;
        stats[entry.employeeId].totalSales += Number(entry.saleValue || 0);
      }
    });
    
    const rankingsArray = Object.values(stats);
    rankingsArray.sort((a, b) => b.totalSales - a.totalSales);
    
    return rankingsArray;
  }

  const rankings = calculateRankings(salesData);

  // Colors for the chart bars
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]

  // Transform data for the chart (top 5 employees)
  const chartData = React.useMemo(() => {
    return rankings.slice(0, 5).map(employee => ({
      name: employee.name.split(' ')[0], // First name only for chart clarity
      sales: employee.totalSales,
      count: employee.salesCount,
      avgSale: employee.salesCount ? employee.totalSales / employee.salesCount : 0
    }))
  }, [rankings])

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Employee Rankings</h2>
      
      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Top Performers Chart</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
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
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`, 
                    name === 'sales' ? 'Total Sales' : 'Sales Count'
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
                  name="Total Sales ($)" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Sales
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales Count
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Sale Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.length > 0 ? (
              rankings.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    ${employee.totalSales.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{employee.salesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    ${(employee.salesCount ? employee.totalSales / employee.salesCount : 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No ranking data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}