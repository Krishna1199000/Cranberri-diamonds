"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"


interface SaleItem {
  id?: string
  carat: number | null
  color: string | null
  clarity: string | null
  certificateNo: string | null
  pricePerCarat: number | null
  totalValue: number | null
}

interface SalesEntry {
  id: string
  date?: string
  saleDate: string
  employee?: { id: string; name: string }
  trackingId: string | null
  companyName: string | null
  isNoSale: boolean
  totalSaleValue: number | null
  shipmentCarrier: string | null
  description: string | null
  saleItems: SaleItem[]
}

interface SalesTableProps {
  salesData: SalesEntry[]
  refreshData: () => void
}

export function SalesTable({ salesData, refreshData }: SalesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await fetch("/api/sales", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          toast.success("Entry deleted successfully")
          refreshData()
        } else {
          toast.error("Failed to delete entry")
        }
      } catch (error) {
        console.error("Error deleting entry:", error)
        toast.error("Failed to delete entry")
      }
    }
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRow(current => current === id ? null : id)
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sales Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expand
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesData && salesData.length > 0 ? (
              salesData.map((entry) => (
                <>
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        variant="default"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => toggleRowExpand(entry.id)}
                      >
                        {expandedRow === entry.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </Button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(entry.saleDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.employee?.name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.isNoSale ? "No Sale" : (entry.companyName || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {entry.isNoSale ? "—" : `$${entry.totalSaleValue?.toFixed(2) || '0.00'}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {/* Handle edit */}}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-700"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === entry.id && !entry.isNoSale && entry.saleItems && entry.saleItems.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Certificate No.
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Carat
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Color
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Clarity
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Price/Carat
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Total Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {entry.saleItems.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-left">
                                    {item.certificateNo || "—"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    {item.carat?.toFixed(2) || "—"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-left">
                                    {item.color || "—"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-left">
                                    {item.clarity || "—"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    ${item.pricePerCarat?.toFixed(2) || "—"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                                    ${item.totalValue?.toFixed(2) || "—"}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-100 font-semibold">
                                <td colSpan={5} className="px-3 py-2 text-right">
                                  Total:
                                </td>
                                <td className="px-3 py-2 text-right">
                                  ${entry.totalSaleValue?.toFixed(2) || '0.00'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No sales records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}