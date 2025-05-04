// types/sales.ts
export interface SaleEntry {
  id: string
  date: string
  rawDate: Date
  employeeId: string
  employeeName: string
  trackingId: string
  companyName: string
  isNoSale: boolean
  saleValue: number
  purchaseValue: number | null
  profit: number | null
  profitMargin: number | null
  shipmentCarrier: string
  details: {
    carat?: string | number
    color?: string
    clarity?: string
  }
  description: string
  paymentReceived: boolean
}

// You could add other related types here as needed, e.g., EmployeeStats
export interface EmployeeStats {
  id: string;
  name: string;
  salesCount: number;
  totalSales: number;
} 