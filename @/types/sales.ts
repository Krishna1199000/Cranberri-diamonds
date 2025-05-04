// @/types/sales.ts

// Define the structure for individual items within a sale entry's details
export interface SaleItemDetail {
    carat?: string | number; 
    color?: string;
    clarity?: string;
    // Add other item details if needed from the source (e.g., saleItems in API response)
}

// Define the main SaleEntry type used in the frontend
export interface SaleEntry {
    id: string;
    date: string;             // Formatted date string for display
    rawDate: Date;            // Raw Date object for sorting/calculations
    employeeId: string;
    employeeName: string;
    trackingId?: string;
    companyName: string;
    isNoSale: boolean;
    saleValue: number;
    purchaseValue?: number | null;
    profit?: number | null;
    profitMargin?: number | null;
    shipmentCarrier?: string;
    details: SaleItemDetail;  // Structure for item details (e.g., from first item)
    description?: string;
    paymentReceived: boolean; // THE CRITICAL FIELD
    createdAt?: string;        // Optional, if needed from API
    updatedAt?: string;        // Optional, if needed from API
}

// Define structure for EmployeeStats used in calculations/rankings
export interface EmployeeStats {
    id: string; // Changed from employeeId for consistency if map key is id
    name: string; // Changed from employeeName for consistency
    salesCount: number;
    totalSales: number;
    // totalProfit?: number | null; // Keep if calculated and used
} 