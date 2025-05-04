"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingDown, TrendingUp, CheckCircle, CircleOff } from "lucide-react"
import { SaleEntry } from "@/types/sales"

import { Tooltip } from "@/components/ui/tooltip"
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SalesTableProps {
  salesData: SaleEntry[]
  onUpdatePaymentStatus: (id: string, status: boolean) => void
}

export default function SalesTable({ salesData, onUpdatePaymentStatus }: SalesTableProps) {
  const [editableEntry, setEditableEntry] = useState<string | null>(null)
  const [localPurchaseValue, setLocalPurchaseValue] = useState<string>("")

  const handleLocalInputChange = (value: string) => {
    setLocalPurchaseValue(value);
  }
  
  const startEditing = (entry: SaleEntry) => {
    setEditableEntry(entry.id);
    setLocalPurchaseValue(entry.purchaseValue?.toString() || "");
  }

  const formatCurrency = (value: number | null | undefined) => {
    const numValue = value ?? 0;
    return numValue.toLocaleString('en-US', {
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
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Date
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Employee
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Sale Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Purchase Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profit
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Payment
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(salesData || []).map((entry) => (
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
                        value={localPurchaseValue}
                        onChange={(e) => handleLocalInputChange(e.target.value)}
                        className="w-24 h-8 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEditing(entry)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[32px] flex items-center"
                      >
                        {entry.purchaseValue != null ? formatCurrency(entry.purchaseValue) : <span className="text-gray-400 italic">Click to add</span>}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      disabled={editableEntry !== entry.id || localPurchaseValue === ""}
                      onClick={() => { 
                        const numValue = parseFloat(localPurchaseValue);
                        if (!isNaN(numValue)) {
                           console.log(`Set purchase value for ${entry.id} to ${numValue}`); 
                           setEditableEntry(null);
                        } else {
                           console.error("Invalid number entered for purchase value");
                        }
                      }}
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
                          (entry.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(entry.profit)}
                          {(entry.profit ?? 0) >= 0 ? (
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
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {!entry.isNoSale ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 ${entry.paymentReceived ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                    onClick={() => onUpdatePaymentStatus(entry.id, entry.paymentReceived)}
                  >
                    {entry.paymentReceived ? (
                       <CheckCircle className="mr-1 h-3 w-3" /> 
                    ) : (
                       <CircleOff className="mr-1 h-3 w-3" />
                    )}
                    {entry.paymentReceived ? "Received" : "Pending"}
                  </Button>
                ) : (
                  <span className="italic text-gray-400">N/A</span>
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
      
      {salesData.length > 10 && (
        <div className="py-3 flex justify-center">
          <p className="text-sm text-gray-500">
            Showing 10 of {salesData.length} entries. Export for complete data.
          </p>
        </div>
      )}
    </div>
  )
}