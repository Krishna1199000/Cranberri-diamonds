"use client";

import { formatDate, numberToWords, calculateTotal, formatCurrency } from "@/lib/utils";
import { InvoiceFormValues } from "@/lib/validators/invoice";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface InvoicePreviewProps {
    invoice: InvoiceFormValues;
    setShowPreview?: (show: boolean) => void; // Make this optional
  }
  
const downloadPdf = async (invoiceId: string) => {
    try {
      // Open the PDF in a new window/tab
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };
export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const grandTotal = invoice.items.reduce((total, item) => {
    return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
  }, 0);

    const setShowPreview = (show: boolean) => {
        // This function should be passed as a prop from the parent component
        throw new Error("setShowPreview must be passed as a prop");
    };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md print:shadow-none max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">INVOICE</h1>
          <div className="text-gray-600 mt-1">No: {invoice.invoiceNo}</div>
          <div className="text-gray-600">Date: {format(invoice.date, "dd/MM/yyyy")}</div>
          <div className="text-gray-600">Due Date: {format(invoice.dueDate, "dd/MM/yyyy")}</div>
          <div className="text-gray-600">Payment Terms: {invoice.paymentTerms} days</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-xl">CRYSTAL DIAMONDS</div>
          <div className="text-gray-600">123 Diamond Street</div>
          <div className="text-gray-600">Surat, Gujarat 395007</div>
          <div className="text-gray-600">India</div>
          <div className="text-gray-600">Phone: +91 9876543210</div>
          <div className="text-gray-600">Email: info@crystaldiamonds.com</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="font-bold text-gray-700 mb-2">Bill To:</div>
        <div className="font-semibold">{invoice.companyName}</div>
        <div>{invoice.addressLine1}</div>
        {invoice.addressLine2 && <div>{invoice.addressLine2}</div>}
        <div>{invoice.city}, {invoice.state} {invoice.postalCode}</div>
        <div>{invoice.country}</div>
      </div>

      {invoice.description && (
        <div className="mb-6">
          <div className="font-bold text-gray-700 mb-2">Description:</div>
          <div>{invoice.description}</div>
        </div>
      )}

      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 text-left">Description</th>
            <th className="py-2 px-4 text-right">Carat</th>
            <th className="py-2 px-4 text-left">Color & Clarity</th>
            <th className="py-2 px-4 text-left">Lab</th>
            <th className="py-2 px-4 text-left">Report No.</th>
            <th className="py-2 px-4 text-right">Price/ct (USD)</th>
            <th className="py-2 px-4 text-right">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="py-2 px-4">{item.description}</td>
              <td className="py-2 px-4 text-right">{Number(item.carat).toFixed(2)}</td>
              <td className="py-2 px-4">{item.color} {item.clarity}</td>
              <td className="py-2 px-4">{item.lab}</td>
              <td className="py-2 px-4">{item.reportNo}</td>
              <td className="py-2 px-4 text-right">{formatCurrency(Number(item.pricePerCarat))}</td>
              <td className="py-2 px-4 text-right">
                {formatCurrency(calculateTotal(Number(item.carat), Number(item.pricePerCarat)))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50">
            <td colSpan={6} className="py-2 px-4 text-right">Grand Total:</td>
            <td className="py-2 px-4 text-right">{formatCurrency(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mb-8">
        <div className="font-bold text-gray-700 mb-2">Amount in words:</div>
        <div className="italic">{numberToWords(grandTotal)}</div>
      </div>

      <div className="mb-8">
        <div className="font-bold text-gray-700 mb-2">Account Details:</div>
        <div>Bank Name: ICICI Bank</div>
        <div>Account Name: Crystal Diamonds</div>
        <div>Account Number: 123456789012</div>
        <div>IFSC Code: ICIC0001234</div>
        <div>Swift Code: ICICI123</div>
      </div>

      <div className="flex justify-between mt-16">
        <div>
          <div className="border-t border-gray-400 pt-2 w-48">Customer Signature</div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 w-48 text-center">For Crystal Diamonds</div>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-500 text-center">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
      </div>
      <div className="flex justify-between">
  <Button variant="outline" onClick={() => setShowPreview(false)}>
    Back to Edit
  </Button>
  <div className="space-x-2">
    <Button onClick={() => window.print()}>Print Invoice</Button>
    <Button 
      variant="default" 
      onClick={() => invoice.invoiceNo ? downloadPdf(invoice.invoiceNo) : null}
      disabled={!invoice.invoiceNo}
    >
      Download PDF
    </Button>
  </div>
  </div>
    </div>
  );
}