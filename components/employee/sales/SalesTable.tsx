"use client"

import { Card } from "@/components/ui/card"

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
  saleDate: string
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
}

export function SalesTable({ salesData }: SalesTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sales Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipment
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesData && salesData.length > 0 ? (
              salesData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(entry.saleDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.isNoSale ? "No Sale" : (entry.companyName || "—")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.shipmentCarrier || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {entry.isNoSale ? "—" : `$${entry.totalSaleValue?.toFixed(2) || '0.00'}`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
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