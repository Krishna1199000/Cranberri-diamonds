"use client";


import { useRouter } from "next/navigation";
import { DiamondSelector } from "@/components/invoice/DiamondSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface InventoryItem {
  id: string;
  stockId: string;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut: string | null;
  polish: string;
  sym: string;
  lab: string;
  pricePerCarat: number;
  finalAmount: number;
  status: 'AVAILABLE' | 'HOLD' | 'MEMO' | 'SOLD';
  certUrl?: string | null;
}

export default function CreateFromInventoryPage() {
  const router = useRouter();

  const handleCreateInvoice = async (selectedDiamonds: InventoryItem[]) => {
    try {
      // Convert selected diamonds to invoice items format
      const invoiceItems = selectedDiamonds.map(diamond => ({
        description: `${diamond.shape} ${diamond.size}ct ${diamond.color} ${diamond.clarity}`,
        carat: diamond.size,
        color: diamond.color,
        clarity: diamond.clarity,
        lab: diamond.lab,
        reportNo: diamond.stockId,
        pricePerCarat: diamond.pricePerCarat,
      }));

      // Get the latest invoice number
      const latestResponse = await fetch("/api/invoices/latest-number");
      const latestData = await latestResponse.json();
      
      // Generate invoice number
      const invoiceDate = new Date();
      let invoiceNo = "INV-0001";
      if (latestData.lastInvoiceNo) {
        const match = latestData.lastInvoiceNo.match(/INV-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          invoiceNo = `INV-${nextNum.toString().padStart(4, '0')}`;
        }
      }

      const invoiceData = {
        invoiceNo,
        date: invoiceDate,
        dueDate: new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        paymentTerms: 7,
        shipmentId: "", // This will need to be selected by user
        description: `Invoice for ${selectedDiamonds.length} diamond(s) from inventory`,
        shipmentCost: 0,
        discount: 0,
        crPayment: 0,
        items: invoiceItems
      };

      // Store the data and redirect to invoice form with pre-filled data
      sessionStorage.setItem('prefilledInvoiceData', JSON.stringify(invoiceData));
      router.push('/invoices/new?fromInventory=true');
      
    } catch (error) {
      console.error('Error preparing invoice:', error);
      toast.error('Failed to prepare invoice');
    }
  };

  const handleCreateMemo = async (selectedDiamonds: InventoryItem[]) => {
    try {
      // Convert selected diamonds to memo items format
      const memoItems = selectedDiamonds.map(diamond => ({
        description: `${diamond.shape} ${diamond.size}ct ${diamond.color} ${diamond.clarity}`,
        carat: diamond.size,
        color: diamond.color,
        clarity: diamond.clarity,
        lab: diamond.lab,
        reportNo: diamond.stockId,
        pricePerCarat: diamond.pricePerCarat,
      }));

      // Get the latest memo number
      const latestResponse = await fetch("/api/memos/latest-number");
      const latestData = await latestResponse.json();
      
      // Generate memo number
      const memoDate = new Date();
      let memoNo = "MEMO-0001";
      if (latestData.lastMemoNo) {
        const match = latestData.lastMemoNo.match(/MEMO-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          memoNo = `MEMO-${nextNum.toString().padStart(4, '0')}`;
        }
      }

      const memoData = {
        memoNo,
        date: memoDate,
        dueDate: new Date(memoDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        paymentTerms: 7,
        shipmentId: "", // This will need to be selected by user
        description: `Memo for ${selectedDiamonds.length} diamond(s) from inventory`,
        shipmentCost: 0,
        discount: 0,
        crPayment: 0,
        items: memoItems
      };

      // Store the data and redirect to memo form with pre-filled data
      sessionStorage.setItem('prefilledMemoData', JSON.stringify(memoData));
      router.push('/memos/new?fromInventory=true');
      
    } catch (error) {
      console.error('Error preparing memo:', error);
      toast.error('Failed to prepare memo');
    }
  };

  return (
    <div className="container py-10 max-w-7xl">
              <div className="flex items-center gap-4 mb-6">
          <Link href="/invoices">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Invoice/Memo from Inventory</h1>
            <p className="text-gray-600">Select available diamonds to create invoice or memo</p>
          </div>
        </div>

      <DiamondSelector
        onCreateInvoice={handleCreateInvoice}
        onCreateMemo={handleCreateMemo}
      />
    </div>
  );
}
