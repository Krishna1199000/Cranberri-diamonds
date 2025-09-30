"use client"

import { SaleEntry } from "@/types/sales"

interface SalesTableProps {
  salesData: SaleEntry[]
}

export default function SalesTable({ salesData }: SalesTableProps) {

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
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Sale Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(salesData || []).map((entry, index) => (
            <tr key={entry.id || `entry-${index}`} className={entry.isNoSale ? "bg-gray-50" : ""}>
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
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {entry.isNoSale ? "-" : formatCurrency(entry.saleValue)}
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