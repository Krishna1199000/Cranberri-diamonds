import { DiamondStatus } from "@prisma/client";

export type Diamond = {
  id: string;
  stockId: string;
  certificateNo: string;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut: string | null;
  polish: string;
  sym: string;
  floro: string;
  lab: string;
  rapPrice: number;
  rapAmount: number;
  discount: number;
  pricePerCarat: number;
  finalAmount: number;
  measurement: string;
  length: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  table: number | null;
  ratio: number | null;
  comment: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  certUrl: string | null;
  girdle: string | null;
  culet: string | null;
  status: DiamondStatus;
  heldByShipmentId: string | null;
  heldByShipment?: {
    id: string;
    companyName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type DiamondFormData = Omit<Diamond, 'id' | 'createdAt' | 'updatedAt'>;

export const shapeOptions = [
  "ROUND", "PRINCESS", "CUSHION", "OVAL", "EMERALD", 
  "PEAR", "MARQUISE", "RADIANT", "HEART", "ASSCHER"
];

export const colorOptions = [
  "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
];

export const clarityOptions = [
  "FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"
];

export const cutOptions = [
  "EX", "VG", "GD", "FR", "PR", "ID"
];

export const labOptions = [
  "GIA", "IGI", "HRD", "GCAL", "AGS"
];

export const statusOptions = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Hold", value: "HOLD" },
  { label: "Memo", value: "MEMO" },
  { label: "Sold", value: "SOLD" }
];

export const getStatusColor = (status: DiamondStatus) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-800 border-green-200";
    case "HOLD":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "MEMO":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SOLD":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getStatusDisplay = (diamond: Diamond): string => {
  switch (diamond.status) {
    case DiamondStatus.AVAILABLE:
      return "Available";
    case DiamondStatus.HOLD:
      return "Hold";
    case DiamondStatus.MEMO:
      return "Memo";
    case DiamondStatus.SOLD:
      return "Sold";
    default:
      // Fallback for any unexpected status values
      const statusStr = String(diamond.status);
      return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
  }
};

export const formatNumber = (num: number, decimals = 2) => {
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};