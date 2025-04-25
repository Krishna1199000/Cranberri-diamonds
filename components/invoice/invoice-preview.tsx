"use client";

import { numberToWords, calculateTotal, formatCurrency } from "@/lib/utils";
import { InvoiceFormValues } from "@/lib/validators/invoice";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

// Helper function to calculate subtotal from items (for preview fallback)
const calculateSubtotalPreview = (items: InvoiceFormValues['items']) => {
  return items.reduce((total, item) => {
    return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
  }, 0);
};

// Helper function to calculate grand total from invoice data (for preview fallback)
const calculateGrandTotalPreview = (invoice: InvoiceFormValues) => {
  const subtotal = calculateSubtotalPreview(invoice.items);
  const discount = Number(invoice.discount) || 0;
  const crPayment = Number(invoice.crPayment) || 0;
  const shipmentCost = Number(invoice.shipmentCost) || 0;
  return subtotal - discount - crPayment + shipmentCost;
};

interface InvoicePreviewProps {
    invoice: InvoiceFormValues & { 
        id?: string; 
        // Add fields that might come from DB but not form
        subtotal?: number | null; 
        totalAmount?: number | null; 
    }; 
}

const downloadPdf = async (invoiceId: string | undefined) => {
    if (!invoiceId) {
        console.error("Invoice ID is missing, cannot download PDF.");
        return;
    }
    try {
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank'); 
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
};

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  // Calculate grand total
  const grandTotal = invoice.items.reduce((total, item) => {
    return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
  }, 0);

  return (
    <div className="bg-white px-6 pb-6 pt-0 rounded-lg shadow-md print:shadow-none max-w-4xl mx-auto print:max-w-full print:p-4">
      {/* Logo Section */}
      <div className="flex justify-center items-center mb-3">
        <div className="w-72 h-28 flex items-center justify-center">
          <Image src="/IMG_8981[1].png" alt="Cranberri Diamonds Logo" width={240} height={90} />
        </div>
      </div>

      {/* Top Section: Invoice Details with date on right */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-gray-800 font-bold">Invoice No: {invoice.invoiceNo}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-sm">Date: {format(new Date(invoice.date), "dd/MM/yyyy")}</div> 
          <div className="text-gray-600 text-sm">Due Date: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}</div>
          <div className="text-gray-600 text-sm">Payment Terms: {invoice.paymentTerms} days</div>
        </div>
      </div>

      {/* Bill To Section - Reduced vertical margins */}
      <div className="mb-3">
        <div className="font-bold text-gray-700 mb-1 text-sm">To:</div>
        <div className="font-semibold text-sm">{invoice.companyName}</div>
        <div className="text-sm">{invoice.addressLine1}</div>
        {invoice.addressLine2 && <div className="text-sm">{invoice.addressLine2}</div>}
        <div className="text-sm">{`${invoice.city}, ${invoice.state} ${invoice.postalCode}`}</div>
        <div className="text-sm">{invoice.country}</div>
      </div>

      {/* Annexure Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-base underline">Annexure</h2>
      </div>

      {/* Items Table - Reduced text size and padding */}
      <table className="w-full mb-3 border-collapse text-xs">
        <thead>
          <tr className="bg-blue-50 print:bg-blue-50">
            <th className="py-1 px-2 text-left border">Description</th>
            <th className="py-1 px-2 text-center border">Carat</th>
            <th className="py-1 px-2 text-left border">Color & Clarity</th>
            <th className="py-1 px-2 text-center border">Lab</th>
            <th className="py-1 px-2 text-center border">Report No.</th>
            <th className="py-1 px-2 text-right border">Price/ct (USD)</th>
            <th className="py-1 px-2 text-right border">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => {
             const itemTotal = calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
             return (
              <tr key={index} className="border">
                <td className="py-1 px-2 border">{item.description || `Item${index + 1}`}</td>
                <td className="py-1 px-2 text-center border">{Number(item.carat).toFixed(2)}</td>
                <td className="py-1 px-2 border">{`${item.color} ${item.clarity}`}</td>
                <td className="py-1 px-2 text-center border">{item.lab}</td>
                <td className="py-1 px-2 text-center border">{item.reportNo}</td>
                <td className="py-1 px-2 text-right border">{formatCurrency(Number(item.pricePerCarat))}</td> 
                <td className="py-1 px-2 text-right border">{formatCurrency(itemTotal)}</td> 
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50 print:bg-gray-50 border">
            <td colSpan={6} className="py-1 px-2 text-right border">Grand Total:</td>
            <td className="py-1 px-2 text-right border">{formatCurrency(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Account Details and Totals Side by Side - REVERSED FROM PREVIOUS VERSION */}
      <div className="flex flex-wrap justify-between mt-4 mb-2">
        {/* Account Details on Left - Styled as in the image */}
        <div className="w-80 text-sm border border-gray-300 p-2">
          <div className="font-bold text-center border-b border-gray-300 pb-1 mb-2">ACCOUNT DETAILS</div>
          <div className="grid grid-cols-1 gap-1">
            <div><span className="font-semibold">BENEFICIARY NAME</span> - CRANBERRI DIAMONDS</div>
            <div><span className="font-semibold">BANK NAME</span> - CITIBANK</div>
            <div><span className="font-semibold">ADDRESS</span> - 111 WALL STREET,</div>
            <div className="text-center">NEW YORK, NY 10043 USA</div>
            <div><span className="font-semibold">SWIFT</span> - CITIUS33</div>
            <div><span className="font-semibold">ACCOUNT NUMBER</span> - 70588170001126150</div>
            <div><span className="font-semibold">ACCOUNT TYPE</span> - CHECKING</div>
          </div>
        </div>
        
        {/* Totals Section on Right - Styled to match your image */}
        <div className="w-64 text-sm">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Subtotal:</td>
                <td className="py-1 text-right">{formatCurrency(invoice.subtotal ?? calculateSubtotalPreview(invoice.items))}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Discount:</td>
                <td className="py-1 text-right">{formatCurrency(invoice.discount ?? 0)}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">CR/Payment:</td>
                <td className="py-1 text-right">{formatCurrency(invoice.crPayment ?? 0)}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Shipping:</td>
                <td className="py-1 text-right">{formatCurrency(invoice.shipmentCost ?? 0)}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="py-1 font-bold">Total Due:</td>
                <td className="py-1 text-right font-bold">{formatCurrency(invoice.totalAmount ?? calculateGrandTotalPreview(invoice))}</td>
              </tr>
            </tbody>
          </table>
          
          {/* Amount in Words - Formatted as in your image */}
          <div className="mt-2">
            <div className="font-medium">Amount in words:</div>
            <div className="italic text-xs">{numberToWords(invoice.totalAmount ?? calculateGrandTotalPreview(invoice))}</div>
          </div>
        </div>
      </div>

      {/* Disclaimer - Reduced size and spacing */}
      <div className="mb-3 text-xs">
        <div className="font-bold mb-1">DISCLAIMER:</div>
        <ol className="list-decimal pl-5 space-y-0">
          <li>The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.</li>
          <li>All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.</li>
          <li>These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice. In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.</li>
        </ol>
      </div>

      {/* Signatures with less spacing - Moved here */}
      <div className="flex justify-end mt-4 print:mt-4">
        <div className="border-t border-gray-400 pt-1 w-48 text-center text-sm">For Cranberri Diamonds</div>
      </div>

      {/* Legal Text - Reduced size - Now after Signature */}
      <div className="mt-4 mb-3 text-[10px] text-gray-500">
        <p className="mb-1">The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. UNIQUE LAB GROWN DIAMOND INC. deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.</p>
        <p>Received the above goods on the terms and conditions set out</p>
      </div>

      {/* Buttons for Print/Download (hidden on actual print) */}
      <div className="mt-4 flex justify-end space-x-2 print:hidden">
         <Button 
            variant="outline"
            onClick={() => window.print()}
          >
            Print Invoice
         </Button>
         <Button 
            variant="outline"
            onClick={() => downloadPdf(invoice.id)}
            disabled={!invoice.id}
          >
            Download PDF
        </Button>
      </div>
    </div>
  );
}