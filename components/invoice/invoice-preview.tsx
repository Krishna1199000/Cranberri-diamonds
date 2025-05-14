"use client";

import { numberToWords, calculateTotal, formatCurrency } from "@/lib/utils";
import { InvoiceFormValues, DiamondItem } from "@/lib/validators/invoice";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the fetched shipment data needed for display
interface ShipmentDisplayData {
    companyName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}

// Update Props: Expect InvoiceFormValues (with shipmentId) + optional id
interface InvoicePreviewProps {
    invoice: InvoiceFormValues & { 
        id?: string; 
        // Remove address/company/total fields from props, they will be fetched or calculated
        // companyName?: string;
        // addressLine1?: string;
        // ... other address fields ...
        // subtotal?: number | null; 
        // totalAmount?: number | null; 
    };
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
    const [shipmentData, setShipmentData] = useState<ShipmentDisplayData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch shipment data based on invoice.shipmentId
    useEffect(() => {
        if (invoice.shipmentId) {
            setIsLoading(true);
            setError(null);
            fetch(`/api/shipments/${invoice.shipmentId}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch company details');
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.success && data.shipment) {
                        setShipmentData(data.shipment);
                    } else {
                        throw new Error(data.message || 'Company details not found');
                    }
                })
                .catch(err => {
                    console.error("Error fetching shipment details:", err);
                    setError(err.message || "Could not load company details.");
                    setShipmentData(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            // Handle case where shipmentId might be missing (though schema requires it)
             setError("Company ID missing in invoice data.");
             setIsLoading(false);
        }
    }, [invoice.shipmentId]);

    // Calculate totals directly from invoice items prop
    const subtotal = invoice.items.reduce((total, item) => {
        return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
    }, 0);
    const totalAmount = subtotal - (Number(invoice.discount) || 0) - (Number(invoice.crPayment) || 0) + (Number(invoice.shipmentCost) || 0);
    const grandTotalTable = invoice.items.reduce((total, item) => { // For table footer
        return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
    }, 0);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `${invoice.invoiceNo}.pdf`;
        window.print();
        // Attempt to restore title shortly after print dialog opens
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000); // Adjust delay if needed
    };

    return (
        <>
            {/* Add CSS @page rules for printing */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4; /* Or 'letter', etc. */
                        margin: 0.5cm; /* Minimize margins */
                    }
                    body {
                        margin: 0; /* Reset body margin for print */
                    }
                }
            `}</style>
            <div className="bg-white px-6 pb-6 pt-0 rounded-lg shadow-md print:shadow-none max-w-4xl mx-auto print:max-w-full print:mx-0 print:p-1 print:text-[10px]">
                {/* Logo Section */}
                <div className="flex justify-center items-center mb-0 print:mb-0">
                    {/* ... logo ... */} 
                    <div className="w-72 h-28 flex items-center justify-center print:w-40 print:h-auto">
                        <Image src="/IMG_8981[1].png" alt="Cranberri Diamonds Logo" width={240} height={90} className="print:w-[130px] print:h-auto" />
                    </div>
                </div>

                {/* Company Address and Website */}
                <div className="text-center -mt-2 mb-2 print:mb-1">
                    <p className="text-xs print:text-[8px] text-gray-600">B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</p>
                    <p className="text-xs print:text-[8px] text-gray-600">
                        <a href="https://www.cranberridiamonds.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            www.cranberridiamonds.in
                        </a>
                    </p>
                </div>

                {/* Top Section: Invoice Details */}
                {/* ... Invoice No, Dates, Terms ... */}
                <div className="flex justify-between items-start mb-3 print:mb-1">
                    <div>
                        <div className="text-gray-800 font-bold print:text-[11px]">Invoice No: {invoice.invoiceNo}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-600 text-sm print:text-[9px]">Date: {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
                        <div className="text-gray-600 text-sm print:text-[9px]">Due Date: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}</div>
                        <div className="text-gray-600 text-sm print:text-[9px]">Payment Terms: {invoice.paymentTerms} days</div>
                    </div>
                </div>

                {/* Bill To Section - Use fetched shipmentData or show loading/error */} 
                <div className="mb-2 print:mb-1 min-h-[70px] print:min-h-[60px]"> {/* Add min-height for loading state */} 
                    <div className="font-bold text-gray-700 mb-1 text-sm print:text-[10px] print:mb-0">To:</div>
                    {isLoading ? (
                        <div className="space-y-1 print:space-y-0.5">
                            <Skeleton className="h-3 w-3/4 print:h-2.5" />
                            <Skeleton className="h-3 w-full print:h-2.5" />
                            <Skeleton className="h-3 w-4/5 print:h-2.5" />
                            <Skeleton className="h-3 w-1/2 print:h-2.5" />
                        </div>
                    ) : error ? (
                        <p className="text-xs text-red-500 print:text-[9px]">Error: {error}</p>
                    ) : shipmentData ? (
                        <>
                            <div className="font-semibold text-sm print:text-[10px]">{shipmentData.companyName}</div>
                            <div className="text-sm print:text-[9px]">{shipmentData.addressLine1}</div>
                            {shipmentData.addressLine2 && <div className="text-sm print:text-[9px]">{shipmentData.addressLine2}</div>}
                            <div className="text-sm print:text-[9px]">{`${shipmentData.city}, ${shipmentData.state} ${shipmentData.postalCode}`}</div>
                            <div className="text-sm print:text-[9px]">{shipmentData.country}</div>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground print:text-[9px]">Company details not available.</p>
                    )}
                </div>

                {/* Annexure Title */}
                {/* ... Annexure ... */} 
                <div className="text-center mb-1 print:mb-0.5">
                    <h2 className="font-bold text-base underline print:text-[11px]">Annexure</h2>
                </div>

                {/* Items Table - Uses invoice.items directly */}
                {/* ... Table structure ... */} 
                <table className="w-full mb-2 print:mb-1 border-collapse text-xs print:text-[9px]">
                    {/* ... thead ... */} 
                    <thead>
                        {/* Light blue background, dark text for print header */}
                        <tr 
                            className="bg-blue-50 print:bg-blue-100 print:text-black print:font-bold"
                            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                        >
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-left border print:border-gray-300">Description</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border print:border-gray-300">Carat</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-left border print:border-gray-300">Color & Clarity</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border print:border-gray-300">Lab</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border print:border-gray-300">Report No.</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border print:border-gray-300">Price/ct (USD)</th>
                            <th className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border print:border-gray-300">Total (USD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: DiamondItem, index: number) => { // Use DiamondItem type
                            const itemTotal = calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
                            return (
                                <tr key={item.id || index} className="border"> {/* Use item.id if available */} 
                                    {/* ... tds ... */} 
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 border">{item.description || `Item${index + 1}`}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border">{Number(item.carat).toFixed(2)}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 border">{`${item.color} ${item.clarity}`}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border">{item.lab}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-center border">{item.reportNo}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border">{formatCurrency(Number(item.pricePerCarat))}</td>
                                    <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border">{formatCurrency(itemTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        {/* Light blue background, dark text for print footer */}
                        <tr 
                            className="font-bold bg-gray-50 print:bg-blue-100 print:text-black border"
                            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                        >
                            <td colSpan={6} className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border print:border-gray-300">Grand Total:</td>
                            <td className="py-0.5 px-1 print:py-0 print:px-0.5 text-right border print:border-gray-300">{formatCurrency(grandTotalTable)}</td>
                        </tr>
                    </tfoot>
                </table>


                {/* Account Details and Totals - Use calculated totals */} 
                {/* ... Account/Totals structure ... */} 
                <div className="flex flex-wrap justify-between mt-2 mb-1 print:mt-1 print:mb-0.5">
                    {/* Account Details on Left */} 
                    <div className="w-80 text-sm print:text-[9px] border border-gray-300 p-1 print:p-0.5 print:w-[45%]">
                        {/* ... account details content ... */} 
                        <div className="font-bold text-center border-b border-gray-300 pb-0.5 mb-1 print:pb-0 print:mb-0.5 print:text-[10px]">ACCOUNT DETAILS</div>
                        <div className="grid grid-cols-1 gap-0.5 print:gap-0">
                            <div><span className="font-semibold">BENEFICIARY NAME</span> - CRANBERRI DIAMONDS</div>
                            <div><span className="font-semibold">BANK NAME</span> - CITIBANK</div>
                            <div><span className="font-semibold">ADDRESS</span> - 111 WALL STREET,</div>
                            <div className="text-center">NEW YORK, NY 10043 USA</div>
                            <div><span className="font-semibold">SWIFT</span> - CITIUS33</div>
                            <div><span className="font-semibold">ACCOUNT NUMBER</span> - 70588170001126150</div>
                            <div><span className="font-semibold">ACCOUNT TYPE</span> - CHECKING</div>
                        </div>
                    </div>

                    {/* Totals Section on Right */} 
                    <div className="w-64 text-sm print:text-[9px] print:w-[53%]">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="py-0.5 print:py-0 font-medium">Subtotal:</td>
                                    <td className="py-0.5 print:py-0 text-right">{formatCurrency(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 print:py-0 font-medium">Discount:</td>
                                    <td className="py-0.5 print:py-0 text-right">{formatCurrency(invoice.discount ?? 0)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 print:py-0 font-medium">CR/Payment:</td>
                                    <td className="py-0.5 print:py-0 text-right">{formatCurrency(invoice.crPayment ?? 0)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 print:py-0 font-medium">Shipping:</td>
                                    <td className="py-0.5 print:py-0 text-right">{formatCurrency(invoice.shipmentCost ?? 0)}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="py-0.5 print:py-0 font-bold print:text-[10px]">Total Due:</td>
                                    <td className="py-0.5 print:py-0 text-right font-bold print:text-[10px]">{formatCurrency(totalAmount)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Amount in Words */} 
                        <div className="mt-1 print:mt-0.5">
                            <div className="font-medium print:text-[9px]">Amount in words:</div>
                            {/* Use calculated totalAmount */} 
                            <div className="italic text-xs print:text-[9px]">{numberToWords(totalAmount)}</div> 
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                {/* ... Disclaimer ... */} 
                <div className="mb-2 print:mb-1 text-xs print:text-[8px]">
                    <div className="font-bold mb-0.5 print:mb-0">DISCLAIMER:</div>
                    <ol className="list-decimal pl-4 space-y-0 print:leading-tight">
                        <li>The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.</li>
                        <li>All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.</li>
                        <li>These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice. In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.</li>
                    </ol>
                </div>

                {/* Signatures */} 
                {/* ... Signature ... */} 
                <div className="flex justify-end mt-2 print:mt-4"> {/* Added slightly more top margin for print */}
                    <div className="w-48 text-center">
                        <div className="h-12 print:h-16"></div> {/* Increased print height for signature space */}
                        <div className="border-t border-gray-400"></div>
                        <div className="pt-0.5 text-sm print:text-[10px]">For Cranberri Diamonds</div>
                    </div>
                </div>

                {/* Legal Text */} 
                {/* ... Legal Text ... */} 
                <div className="mt-2 mb-1 print:mt-1 print:mb-0.5 text-[9px] print:text-[8px] text-gray-500">
                    <p className="mb-0.5 print:mb-0 print:leading-tight">The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.</p>
                    <p className="print:leading-tight">Received the above goods on the terms and conditions set out</p>
                </div>

                {/* Print Button */}
                <div className="mt-2 flex justify-end space-x-2 print:hidden">
                    <Button 
                        variant="outline"
                        onClick={handlePrint}
                    >
                        Print Invoice
                    </Button>
                </div>
            </div>
        </>
    );
}