import puppeteer from 'puppeteer';

// Define the interface locally
interface InvoiceItem {
  id: string;
  description: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  reportNo: string;
  pricePerCarat: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  date: Date;
  dueDate: Date;
  paymentTerms: number;
  companyName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  description: string | null;
  amountInWords: string;
  subtotal: number;
  discount: number;
  crPayment: number;
  shipmentCost: number;
  totalAmount: number;
  items: InvoiceItem[];
}

export async function generateInvoicePDFBufferResend(invoice: InvoiceData): Promise<Buffer> {
  console.log('🔄 Puppeteer PDF Generation: Starting for invoice', invoice.invoiceNo);
  
  try {
    // Generate HTML using the same structure as invoice-preview.tsx
    const html = generateInvoiceHTMLResend(invoice);
    console.log('✅ Puppeteer PDF Generation: HTML generated, length:', html.length, 'characters');
    
    // Use Puppeteer to generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    console.log('✅ Puppeteer PDF Generation: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('❌ Puppeteer PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateInvoiceHTMLResend(invoice: InvoiceData): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNo}</title>
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 10px;
            }
            .company-info {
                margin-bottom: 30px;
            }
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .invoice-info, .client-info {
                flex: 1;
            }
            .invoice-info {
                text-align: right;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .totals {
                margin-left: auto;
                width: 300px;
            }
            .totals table {
                margin-bottom: 0;
            }
            .totals td {
                border: none;
                padding: 8px 12px;
            }
            .totals td:first-child {
                font-weight: bold;
            }
            .footer {
                margin-top: 40px;
                font-size: 12px;
                color: #666;
            }
            .amount-in-words {
                font-style: italic;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CRANBERRI DIAMONDS</h1>
            <p>Premium Lab-Grown Diamonds</p>
            <p>B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</p>
            <p>Email: accounts@cranberridiamonds.in | Website: www.cranberridiamonds.in</p>
        </div>

        <div class="invoice-details">
            <div class="client-info">
                <h3>Bill To:</h3>
                <p><strong>${invoice.companyName}</strong></p>
                <p>${invoice.addressLine1}</p>
                ${invoice.addressLine2 ? `<p>${invoice.addressLine2}</p>` : ''}
                <p>${invoice.city}, ${invoice.state} ${invoice.postalCode}</p>
                <p>${invoice.country}</p>
            </div>
            <div class="invoice-info">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice #:</strong> ${invoice.invoiceNo}</p>
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
                <p><strong>Payment Terms:</strong> ${invoice.paymentTerms} days</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Carat</th>
                    <th>Color</th>
                    <th>Clarity</th>
                    <th>Lab</th>
                    <th>Report #</th>
                    <th>Price/Carat</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.carat}</td>
                        <td>${item.color}</td>
                        <td>${item.clarity}</td>
                        <td>${item.lab}</td>
                        <td>${item.reportNo}</td>
                        <td>${formatCurrency(item.pricePerCarat)}</td>
                        <td>${formatCurrency(item.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td>${formatCurrency(invoice.subtotal)}</td>
                </tr>
                ${invoice.discount > 0 ? `
                    <tr>
                        <td>Discount:</td>
                        <td>-${formatCurrency(invoice.discount)}</td>
                    </tr>
                ` : ''}
                ${invoice.crPayment > 0 ? `
                    <tr>
                        <td>CR Payment:</td>
                        <td>-${formatCurrency(invoice.crPayment)}</td>
                    </tr>
                ` : ''}
                ${invoice.shipmentCost > 0 ? `
                    <tr>
                        <td>Shipment Cost:</td>
                        <td>${formatCurrency(invoice.shipmentCost)}</td>
                    </tr>
                ` : ''}
                <tr style="border-top: 2px solid #333;">
                    <td><strong>Total Amount:</strong></td>
                    <td><strong>${formatCurrency(invoice.totalAmount)}</strong></td>
                </tr>
            </table>
        </div>

        <div class="amount-in-words">
            <p><strong>Amount in Words:</strong> ${invoice.amountInWords}</p>
        </div>

        ${invoice.description ? `
            <div class="description">
                <h4>Description:</h4>
                <p>${invoice.description}</p>
            </div>
        ` : ''}

        <div class="footer">
            <p><strong>Terms & Conditions:</strong></p>
            <p>The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.</p>
            <p>Received the above goods on the terms and conditions set out</p>
        </div>
    </body>
    </html>
  `;
} 