"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Tooltip } from "@/components/ui/tooltip"
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SaleEntry {
  id: string
  date: string
  employeeName: string
  companyName: string
  shipmentCarrier: string
  saleValue: number
  purchaseValue?: number
  profit?: number
  profitMargin?: number
  isNoSale: boolean
  details: {
    carat?: string
    color?: string
    clarity?: string
  }
}

interface SalesTableProps {
  data: SaleEntry[]
  sortConfig: { key: string; direction: string }
  handleSort: (key: string) => void
  updateEntryPurchaseValue: (id: string, value: number) => void
  calculateEntryProfit: (id: string) => void
}

export default function SalesTable({
  data,
  sortConfig,
  handleSort,
  updateEntryPurchaseValue,
  calculateEntryProfit,
}: SalesTableProps) {
  const [editableEntry, setEditableEntry] = useState<string | null>(null)
  
  const sortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }
  
  const handlePurchaseValueChange = (id: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      updateEntryPurchaseValue(id, numValue)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "$0.00";
    }
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('date')}
            >
              Date{sortIndicator('date')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('employeeName')}
            >
              Employee{sortIndicator('employeeName')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('companyName')}
            >
              Company{sortIndicator('companyName')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('saleValue')}
            >
              Sale Value{sortIndicator('saleValue')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Purchase Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profit
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.slice(0, 10).map((entry) => (
            <tr key={entry.id} className={entry.isNoSale ? "bg-gray-50" : ""}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {entry.date}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {entry.employeeName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {entry.isNoSale ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No Sale
                  </span>
                ) : entry.companyName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {entry.shipmentCarrier}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {entry.isNoSale ? "-" : formatCurrency(entry.saleValue)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {!entry.isNoSale && (
                  <div className="flex items-center space-x-1">
                    {editableEntry === entry.id ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.purchaseValue || ""}
                        onChange={(e) => handlePurchaseValueChange(entry.id, e.target.value)}
                        onBlur={() => setEditableEntry(null)}
                        className="w-24 h-8 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditableEntry(entry.id)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {entry.purchaseValue ? formatCurrency(entry.purchaseValue) : "Click to add"}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => calculateEntryProfit(entry.id)}
                      disabled={!entry.purchaseValue}
                    >
                      Set
                    </Button>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {!entry.isNoSale && entry.profit !== undefined && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={`flex items-center font-medium ${
                          entry.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(entry.profit)}
                          {entry.profit >= 0 ? (
                            <TrendingUp className="ml-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                      <p>Margin: {entry.profitMargin != null ? `${entry.profitMargin.toFixed(2)}%` : 'N/A'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {entry.isNoSale ? (
                  <span className="italic">N/A</span>
                ) : (
                  <>
                    {entry.details.carat && `${entry.details.carat}ct `}
                    {entry.details.color && `${entry.details.color} `}
                    {entry.details.clarity && `${entry.details.clarity}`}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length > 10 && (
        <div className="py-3 flex justify-center">
          <p className="text-sm text-gray-500">
            Showing 10 of {data.length} entries. Export for complete data.
          </p>
        </div>
      )}
    </div>
  )
}