// Server-side PDF generation utility that mirrors invoice-preview.tsx structure
import { formatCurrency, numberToWords, calculateTotal } from './utils';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

export function generateInvoiceHTML(invoice: InvoiceData): string {
  // Calculate totals (same logic as invoice-preview.tsx)
  const subtotal = invoice.items.reduce((total, item) => {
    return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
  }, 0);
  
  const totalAmount = subtotal - (Number(invoice.discount) || 0) - (Number(invoice.crPayment) || 0) + (Number(invoice.shipmentCost) || 0);
  
  const grandTotalTable = invoice.items.reduce((total, item) => {
    return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
  }, 0);

  // Format dates (same as invoice-preview.tsx)
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(new Date(date));
  };

  // Convert logo to base64 for embedding with better error handling
  let logoBase64 = '';
  let logoElement = '';
  
  try {
    console.log('📄 PDF: Starting logo loading process...');
    
    // Use the proper path with logo.png as requested
    const logoPath = path.join(process.cwd(), 'public', 'imp.png');
    console.log(`📄 PDF: Attempting to load logo from: ${logoPath}`);
    
    // Check if file exists first
    if (fs.existsSync(logoPath)) {
      console.log('📄 PDF: Logo file exists, reading...');
    const logoBuffer = fs.readFileSync(logoPath);
      
      // Convert to base64
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      
      // Log success with first 50 chars preview as requested
    console.log('✅ PDF: Logo loaded and converted to base64');
      console.log(`📄 PDF: Base64 preview (first 50 chars): ${logoBase64.substring(0, 50)}...`);
      console.log(`📄 PDF: Logo buffer size: ${logoBuffer.length} bytes`);
      
      // Create the logo img element
      logoElement = `<img src="${logoBase64}" alt="Cranberri Diamonds Logo" class="logo-img">`;
    } else {
      console.error('❌ PDF: Logo file does not exist at path:', logoPath);
      throw new Error(`Logo file not found at: ${logoPath}`);
    }
    
  } catch (error) {
    console.error('❌ PDF: Failed to load logo:', error instanceof Error ? error.message : error);
    console.error('📄 PDF: Using fallback placeholder instead');
    
    // Fallback placeholder as requested
    logoElement = `
      <div class="logo-placeholder">
        <div class="placeholder-text">💎 Cranberri Diamonds</div>
        <div class="placeholder-subtitle">Logo Placeholder</div>
      </div>
    `;
  }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${invoice.invoiceNo}.pdf</title>
      <style>
        @page {
          size: A4;
          margin: 0.3cm;
        }
        
        body {
          margin: 0;
          padding: 2px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          color: #333;
          background: white;
        }
        
        /* Logo Section - Centered at top as requested */
        .logo-section {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 8px;
          padding: 5px 0;
        }
        
        .logo-container {
          width: 150px;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-img {
          width: 150px;
          height: auto;
          max-height: 60px;
          object-fit: contain;
        }
        
        /* Fallback placeholder styling */
        .logo-placeholder {
          text-align: center;
          padding: 10px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .placeholder-text {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        
        .placeholder-subtitle {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }
        
        /* Company Address */
        .company-address {
          text-align: center;
          margin-top: -2px;
          margin-bottom: 6px;
        }
        
        .company-address p {
          margin: 0;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        .company-address a {
          color: #2563eb;
          text-decoration: none;
        }
        
        /* Invoice Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .invoice-no {
          font-size: 14px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .dates-section {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        /* Bill To Section */
        .bill-to {
          margin-bottom: 8px;
          min-height: 50px;
        }
        
        .bill-to-label {
          font-weight: bold;
          color: #374151;
          font-size: 12px;
          margin-bottom: 2px;
        }
        
        .company-name {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 2px;
        }
        
        .address-line {
          font-size: 11px;
          margin-bottom: 1px;
          line-height: 1.2;
        }
        
        /* Annexure Title */
        .annexure-title {
          text-align: center;
          margin-bottom: 6px;
        }
        
        .annexure-title h2 {
          font-weight: bold;
          font-size: 14px;
          text-decoration: underline;
          margin: 0;
          color: #000;
        }
        
        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .items-table th,
        .items-table td {
          padding: 3px 4px;
          border: 1px solid #d1d5db;
          line-height: 1.2;
        }
        
        .items-table th {
          background-color: #dbeafe !important;
          color: #000 !important;
          font-weight: bold;
          font-size: 11px;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .items-table .text-left {
          text-align: left;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .items-table .text-center {
          text-align: center;
        }
        
        .items-table tfoot tr {
          font-weight: bold;
          background-color: #f3f4f6 !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Bottom Section */
        .bottom-section {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          margin-bottom: 8px;
          gap: 8px;
        }
        
        .account-details {
          width: 45%;
          font-size: 10px;
          border: 1px solid #d1d5db;
          padding: 4px;
        }
        
        .account-header {
          font-weight: bold;
          text-align: center;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 2px;
          margin-bottom: 3px;
          font-size: 11px;
        }
        
        .account-detail {
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .account-label {
          font-weight: 600;
        }
        
        .address-indent {
          text-align: center;
          margin-left: 0;
        }
        
        .totals-section {
          width: 53%;
          font-size: 11px;
        }
        
        .totals-table {
          width: 100%;
          margin-bottom: 4px;
        }
        
        .totals-table td {
          padding: 2px 0;
          line-height: 1.2;
        }
        
        .total-label {
          font-weight: 500;
        }
        
        .total-value {
          text-align: right;
        }
        
        .total-due {
          border-top: 1px solid #d1d5db;
          font-weight: bold;
          font-size: 12px;
        }
        
        .amount-words {
          margin-top: 4px;
        }
        
        .amount-words-label {
          font-weight: 500;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .amount-words-text {
          font-style: italic;
          font-size: 10px;
          line-height: 1.2;
        }
        
        /* Disclaimer */
        .disclaimer {
          margin-bottom: 6px;
          font-size: 10px;
        }
        
        .disclaimer-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .disclaimer ol {
          list-style-type: decimal;
          padding-left: 15px;
          margin: 0;
        }
        
        .disclaimer li {
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        /* Signature Section */
        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        
        .signature-box {
          width: 120px;
          text-align: center;
        }
        
        .signature-line {
          height: 25px;
          border-bottom: 1px solid #9ca3af;
          margin-bottom: 2px;
        }
        
        .signature-text {
          font-size: 11px;
          padding-top: 2px;
        }
        
        /* Legal Text */
        .legal-text {
          margin-top: 6px;
          margin-bottom: 2px;
          font-size: 9px;
          color: #6b7280;
          line-height: 1.2;
        }
        
        .legal-text p {
          margin-bottom: 2px;
        }
      </style>
    </head>
    <body>
      <!-- Logo Section - Centered at top as requested -->
      <div class="logo-section">
        <div class="logo-container">
          ${logoElement}
        </div>
      </div>

      <!-- Company Address -->
      <div class="company-address">
        <p>B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</p>
        <p><a href="https://www.cranberridiamonds.in" target="_blank">www.cranberridiamonds.in</a></p>
      </div>

      <!-- Invoice Header -->
      <div class="invoice-header">
        <div>
          <div class="invoice-no">Invoice No: ${invoice.invoiceNo}</div>
        </div>
        <div class="dates-section">
          <div>Date: ${formatDate(invoice.date)}</div>
          <div>Due Date: ${formatDate(invoice.dueDate)}</div>
          <div>Payment Terms: ${invoice.paymentTerms} days</div>
        </div>
      </div>

      <!-- Bill To Section -->
      <div class="bill-to">
        <div class="bill-to-label">To:</div>
        <div class="company-name">${invoice.companyName}</div>
        <div class="address-line">${invoice.addressLine1}</div>
        ${invoice.addressLine2 ? `<div class="address-line">${invoice.addressLine2}</div>` : ''}
        <div class="address-line">${invoice.city}, ${invoice.state} ${invoice.postalCode}</div>
        <div class="address-line">${invoice.country}</div>
      </div>

      <!-- Annexure Title -->
      <div class="annexure-title">
        <h2>Annexure</h2>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-left">Description</th>
            <th class="text-center">Carat</th>
            <th class="text-left">Color & Clarity</th>
            <th class="text-center">Lab</th>
            <th class="text-center">Report No.</th>
            <th class="text-right">Price/ct (USD)</th>
            <th class="text-right">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => {
            const itemTotal = calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
            return `<tr><td class="text-left">${item.description || `Item${index + 1}`}</td><td class="text-center">${Number(item.carat).toFixed(2)}</td><td class="text-left">${item.color} ${item.clarity}</td><td class="text-center">${item.lab}</td><td class="text-center">${item.reportNo}</td><td class="text-right">${formatCurrency(Number(item.pricePerCarat))}</td><td class="text-right">${formatCurrency(itemTotal)}</td></tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-right">Grand Total:</td>
            <td class="text-right">${formatCurrency(grandTotalTable)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Account Details and Totals -->
      <div class="bottom-section">
        <!-- Account Details -->
        <div class="account-details">
          <div class="account-header">ACCOUNT DETAILS</div>
          <div class="account-detail"><span class="account-label">BENEFICIARY NAME</span> - CRANBERRI DIAMONDS</div>
          <div class="account-detail"><span class="account-label">BANK NAME</span> - CITIBANK</div>
          <div class="account-detail"><span class="account-label">ADDRESS</span> - 111 WALL STREET,</div>
          <div class="address-indent">NEW YORK, NY 10043 USA</div>
          <div class="account-detail"><span class="account-label">SWIFT</span> - CITIUS33</div>
          <div class="account-detail"><span class="account-label">ACCOUNT NUMBER</span> - 70588170001126150</div>
          <div class="account-detail"><span class="account-label">ACCOUNT TYPE</span> - CHECKING</div>
        </div>

        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tbody>
              <tr>
                <td class="total-label">Subtotal:</td>
                <td class="total-value">${formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td class="total-label">Discount:</td>
                <td class="total-value">${formatCurrency(invoice.discount ?? 0)}</td>
              </tr>
              <tr>
                <td class="total-label">CR/Payment:</td>
                <td class="total-value">${formatCurrency(invoice.crPayment ?? 0)}</td>
              </tr>
              <tr>
                <td class="total-label">Shipping:</td>
                <td class="total-value">${formatCurrency(invoice.shipmentCost ?? 0)}</td>
              </tr>
              <tr class="total-due">
                <td class="total-label">Total Due:</td>
                <td class="total-value">${formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount in Words -->
          <div class="amount-words">
            <div class="amount-words-label">Amount in words:</div>
            <div class="amount-words-text">${numberToWords(totalAmount)}</div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <div class="disclaimer-title">DISCLAIMER:</div>
        <ol>
          <li>The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.</li>
          <li>All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.</li>
          <li>These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice. In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.</li>
        </ol>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-text">For Cranberri Diamonds</div>
        </div>
      </div>

      <!-- Legal Text -->
      <div class="legal-text">
        <p>The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.</p>
        <p>Received the above goods on the terms and conditions set out</p>
      </div>
    </body>
    </html>
  `;
}

export async function generateInvoicePDFBuffer(invoice: InvoiceData): Promise<Buffer> {
  let browser;
  try {
    console.log('🔄 PDF Generation: Starting for invoice', invoice.invoiceNo);
    console.log('🔄 PDF Generation: Invoice data includes', invoice.items.length, 'items');
    
    // Generate HTML using the same structure as invoice-preview.tsx
    const html = generateInvoiceHTML(invoice);
    console.log('✅ PDF Generation: HTML generated, length:', html.length, 'characters');
    
    // Launch puppeteer with optimal args as requested
    console.log('🔄 PDF Generation: Launching puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-dev-shm-usage' // Helps with memory issues in containers
      ]
    });
    console.log('✅ PDF Generation: Puppeteer launched successfully');
    
    const page = await browser.newPage();
    console.log('✅ PDF Generation: New page created');
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    // Set HTML content and wait for assets to load as requested
    console.log('🔄 PDF Generation: Setting HTML content...');
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
      timeout: 60000 // Increased timeout for asset loading
    });
    console.log('✅ PDF Generation: HTML content set successfully');
    
    // Wait for fonts and images to load properly as requested
    console.log('🔄 PDF Generation: Waiting for fonts and images to load...');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        // Wait for all images to load
        const images = Array.from(document.querySelectorAll('img'));
        if (images.length === 0) {
          console.log('📄 PDF: No images found, proceeding');
          resolve();
          return;
        }
        
        let loadedImages = 0;
        const totalImages = images.length;
        
        images.forEach((img) => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.onload = () => {
              loadedImages++;
              console.log(`📄 PDF: Image ${loadedImages}/${totalImages} loaded`);
              if (loadedImages === totalImages) {
                resolve();
              }
            };
            img.onerror = () => {
              loadedImages++;
              console.log(`📄 PDF: Image ${loadedImages}/${totalImages} failed to load`);
              if (loadedImages === totalImages) {
                resolve();
              }
            };
          }
        });
        
        if (loadedImages === totalImages) {
          resolve();
        }
        
        // Fallback timeout for asset loading
        setTimeout(() => {
          console.log('📄 PDF: Asset loading timeout reached, proceeding anyway');
          resolve();
        }, 5000);
      });
    });
    
    // Additional wait for fonts as requested
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ PDF Generation: Waited for assets and fonts to load');
    
    // Generate PDF with optimal settings
    console.log('🔄 PDF Generation: Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true, // Use CSS page size when specified
      scale: 1.0,
      displayHeaderFooter: false, // Disable default header/footer
      timeout: 60000 // Timeout for PDF generation
    });
    console.log('✅ PDF Generation: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    console.error('PDF Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Provide helpful error message based on common issues
    let errorMessage = `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`;
    
    if (error instanceof Error) {
      if (error.message.includes('Target closed')) {
        errorMessage = 'PDF generation failed: Browser connection lost. This may be due to server resource limits.';
      } else if (error.message.includes('Navigation timeout')) {
        errorMessage = 'PDF generation failed: Timeout waiting for page to load. Check if all assets are accessible.';
      } else if (error.message.includes('Logo file not found')) {
        errorMessage = 'PDF generation failed: Logo file not found at public/logo.png. Please ensure the logo file exists.';
      }
    }
    
    throw new Error(errorMessage);
  } finally {
    if (browser) {
      console.log('🔄 PDF Generation: Closing browser...');
      await browser.close();
      console.log('✅ PDF Generation: Browser closed');
    }
  }
} 