// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Invoice, InvoiceItem } from '@prisma/client';
import { formatDateWithSuffix, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';

// Import autotable properly
import 'jspdf-autotable';

import { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const prisma = new PrismaClient();

// Define a type for the Invoice with its items
type InvoiceWithItems = Invoice & {
    items: InvoiceItem[];
};

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { items: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Create a new PDF document
        const doc = new jsPDF();
        
        // Generate the PDF content
        generateInvoicePDF(doc, invoice as InvoiceWithItems);
        
        // Get the PDF as a buffer
        const pdfBytes = doc.output('arraybuffer');
        
        // Set response headers for PDF download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        // Sanitize filename - replace slashes which are invalid in filenames
        const safeInvoiceNo = invoice.invoiceNo.replace(/\/|\?/g, '-');
        headers.set('Content-Disposition', `inline; filename="Invoice-${safeInvoiceNo}.pdf"`);

        // Return the PDF as the response
        return new NextResponse(pdfBytes, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

function generateInvoicePDF(doc: jsPDF, invoice: InvoiceWithItems) {
    // Define some constants
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    // === Header Section ===
    doc.setFontSize(12);
    doc.text(`Invoice No: ${invoice.invoiceNo}`, margin, 20);
    
    // Right-aligned date information
    const rightColumn = pageWidth - margin;
    doc.setFontSize(9);
    doc.text(`Date: ${formatDateWithSuffix(invoice.date)}`, rightColumn, 20, { align: 'right' });
    doc.text(`Due Date: ${formatDateWithSuffix(invoice.dueDate)}`, rightColumn, 25, { align: 'right' });
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, rightColumn, 30, { align: 'right' });
    
    // === Billing Address Section === (Reduced spacing)
    doc.setFontSize(9);
    doc.text('To,', margin, 35);
    
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyName, margin, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.addressLine1, margin, 45);
    let addressY = 50;
    if (invoice.addressLine2) {
        doc.text(invoice.addressLine2, margin, addressY);
        addressY += 5;
    }
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, margin, addressY);
    addressY += 5;
    doc.text(invoice.country, margin, addressY);
    
    // === Annexure Section === (Reduced spacing)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const annexureY = addressY + 10;
    doc.text('Annexure', pageWidth / 2, annexureY, { align: 'center' });
    doc.line(pageWidth / 2 - 20, annexureY + 1, pageWidth / 2 + 20, annexureY + 1);
    doc.setFont('helvetica', 'normal');
    
    // === Items Table === (Reduced font size)
    const tableY = annexureY + 8;
    
    // Prepare table data
    const tableHeaders = [['Description', 'Carat', 'Color & Clarity', 'Lab', 'Report No.', 'Price/ct', 'Total']];
    const tableBody = invoice.items.map(item => {
        const itemTotal = (item.carat || 0) * (item.pricePerCarat || 0);
        return [
            item.description,
            (item.carat || 0).toFixed(2),
            `${item.color} ${item.clarity}`,
            item.lab,
            item.reportNo,
            `$${formatCurrency(item.pricePerCarat || 0)}`,
            `$${formatCurrency(itemTotal)}`
        ];
    });
    
    // Draw the table with smaller row height
    doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: tableY,
        theme: 'grid',
        headStyles: { fillColor: [214, 234, 248], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 }, // Reduced font and padding
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 30 },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 30, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 25, halign: 'right' }
        }
    });
    
    // Get the table's end position
    const finalY = doc.lastAutoTable.finalY + 5;
    
    // === Two Column Layout - REVERSED FROM PREVIOUS VERSION ===
    // Account Details on Left, Totals on Right
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 10;
    let currentY = finalY;
    
    // === Account Details (Left Column) ===
    // Draw box for account details
    const boxWidth = pageWidth / 2 - margin - 5;
    const boxStartY = currentY;
    const lineHeight = 5;
    
    // Draw border and title
    doc.setDrawColor(100, 100, 100);
    doc.rect(leftColumnX, boxStartY, boxWidth, 45); // Box
    
    // Title with grey background
    doc.setFillColor(240, 240, 240);
    doc.rect(leftColumnX, boxStartY, boxWidth, 6, 'F');
    
    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ACCOUNT DETAILS', leftColumnX + boxWidth/2, boxStartY + 4, { align: 'center' });
    
    // Account details content
    doc.setFontSize(8);
    currentY = boxStartY + 10;
    
    // Helper function for account details
    const addAccountDetail = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label} `, leftColumnX + 3, currentY);
        const labelWidth = doc.getTextWidth(`${label} `);
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${value}`, leftColumnX + 3 + labelWidth, currentY);
        currentY += lineHeight;
    };
    
    addAccountDetail('BENEFICIARY NAME', 'CRANBERRI DIAMONDS');
    addAccountDetail('BANK NAME', 'CITIBANK');
    addAccountDetail('ADDRESS', '111 WALL STREET,');
    doc.text('NEW YORK, NY 10043 USA', leftColumnX + 30, currentY);
    currentY += lineHeight;
    addAccountDetail('SWIFT', 'CITIUS33');
    addAccountDetail('ACCOUNT NUMBER', '70588170001126150');
    addAccountDetail('ACCOUNT TYPE', 'CHECKING');
    
    // === Totals Section (Right Column) ===
    // Reset Y position for right column
    currentY = finalY;
    
    // Helper function for totals rows
    doc.setFontSize(9);
    const addTotalRow = (label: string, amount: number, isBold = false) => {
        if (isBold) {
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setFont('helvetica', 'normal');
        }
        doc.text(label, rightColumnX, currentY);
        doc.text(`${formatCurrency(amount)}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 5;
    };
    
    // Draw totals
    addTotalRow('Subtotal:', invoice.subtotal || 0);
    addTotalRow('Discount:', invoice.discount || 0);
    addTotalRow('CR/Payment:', invoice.crPayment || 0);
    addTotalRow('Shipping:', invoice.shipmentCost || 0);
    
    // Draw line before Total Due
    doc.line(rightColumnX, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 2;
    
    // Draw Total Due (bold)
    addTotalRow('Total Due:', invoice.totalAmount, true);
    
    // === Amount in Words ===
    currentY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Amount in words:`, rightColumnX, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'italic');
    doc.text(`${numberToWords(invoice.totalAmount)}`, rightColumnX, currentY);
    doc.setFont('helvetica', 'normal');
    
    // Update currentY to after both columns
    currentY = Math.max(boxStartY + 55, finalY + 60);
    
    // === Disclaimer === (Condensed)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCLAIMER:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4;
    
    // Set smaller font for disclaimer text
    doc.setFontSize(7);
    const disclaimerText = [
        '1. The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.',
        '2. All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.',
        '3. These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice. In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.'
    ];
    
    // Split and draw each disclaimer paragraph with wrapping and reduced line spacing
    disclaimerText.forEach(text => {
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, currentY);
        currentY += lines.length * 3;
    });
    
    // Legal blurb with smaller text
    doc.setFontSize(6);
    currentY += 3;
    const legalText = "The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. UNIQUE LAB GROWN DIAMOND INC. deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.";
    const legalLines = doc.splitTextToSize(legalText, contentWidth);
    doc.text(legalLines, margin, currentY);
    currentY += legalLines.length * 3;
    
    doc.text("Received the above goods on the terms and conditions set out", margin, currentY);
    
    // === Signature Line ===
    currentY = Math.min(currentY + 15, 275); // Ensure signature fits on page
    
    const signatureText = 'For Cranberri Diamonds';
    doc.setFontSize(9);
    doc.text(signatureText, pageWidth - margin - 40, currentY, { align: 'center' });
    currentY -= 5;
    doc.line(pageWidth - margin - 70, currentY, pageWidth - margin - 10, currentY);
}

// Helper function for converting number to words (assuming it exists in utils)
function numberToWords(amount: number): string {
    // This is a placeholder - you should use your actual implementation
    return `US Dollar ${amount} Only`;
}