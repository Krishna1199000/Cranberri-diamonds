"use client"

import { Card } from "@/components/ui/card"
import { SaleEntry } from "@/types/sales"

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

  return (
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