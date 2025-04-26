// types/sales.ts
export interface SaleEntry {
  id: string;
  date: string; // Formatted date string
  rawDate: Date; // Raw Date object for sorting/filtering
  employeeId: string;
  employeeName: string;
  trackingId: string;
  companyName: string;
  isNoSale: boolean;
  saleValue: number;
  purchaseValue?: number | null; // Optional
  profit?: number | null; // Optional
  profitMargin?: number | null; // Optional
  shipmentCarrier: string;
  details: {
    carat?: string | number;
    color?: string;
    clarity?: string;
  };
  description: string;
}

// You could add other related types here as needed, e.g., EmployeeStats
export interface EmployeeStats {
  id: string;
  name: string;
  salesCount: number;
  totalSales: number;
} 