// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { numberToWords, generateInvoiceNumber } from '@/lib/utils';
import { generateInvoicePDFBuffer } from '@/lib/pdf-utils';
import { generateInvoicePDFBufferServerless } from '@/lib/pdf-utils-serverless';
import { generateInvoicePDFBufferResend } from '@/lib/pdf-utils-resend';
import { sendInvoiceEmail } from '@/lib/email';
import { createPaymentReminderNotification } from '@/lib/notification-scheduler';
import { getSession } from '@/lib/session';
import { invoiceFormSchema } from '@/lib/validators/invoice';


const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;
    const userRole = session?.role as string | undefined;

    if (!userId || !userRole) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let whereClause = {};

    if (userRole === 'employee') {
        whereClause = { userId: userId };
    } 
    // Admins (or other roles) will have an empty whereClause, fetching all invoices.

    const invoices = await prisma.invoice.findMany({
      where: whereClause, // Apply the filter conditionally
      orderBy: {
        invoiceNo: 'desc'
      },
      include: {
        items: true // Keep including items
      }
    });
    
    // Add no-cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json({ invoices }, { headers });
  } catch (error) {
    console.error('Error fetching invoices: ', String(error)); 
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        const userId = session?.userId as string | undefined;
        const userRole = session?.role as string | undefined;

        if (!userId || !userRole) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        
        // Validate using the updated schema (expects shipmentId, not address)
        const validation = invoiceFormSchema.safeParse(body);
        if (!validation.success) {
          console.error("Invoice validation failed:", JSON.stringify(validation.error.errors, null, 2));
          const errorMessage = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          return NextResponse.json({ error: `Invalid input: ${errorMessage}`, details: validation.error.errors }, { status: 400 });
        }
        const validatedData = validation.data; // Contains shipmentId now
        
        // --- Transaction for fetching latest invoice number and creating new one ---
        const createdInvoice = await prisma.$transaction(async (tx) => {
          // 1. Fetch the selected shipment using shipmentId
          const selectedShipment = await tx.shipment.findUnique({
              where: { id: validatedData.shipmentId },
          });

          // Handle if shipment not found
          if (!selectedShipment) {
              throw new Error(`Selected company (Shipment ID: ${validatedData.shipmentId}) not found.`);
          }

          // 2. Fetch latest invoice number
          const latestInvoice = await tx.invoice.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { invoiceNo: true }
          });
          
          // 3. Generate the new invoice number
          const newInvoiceNo = generateInvoiceNumber(latestInvoice?.invoiceNo, validatedData.date);
          
          // 4. Calculate item totals as subtotal
          let subtotal = 0;
          validatedData.items.forEach((item) => {
            const itemTotal = (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0);
            subtotal += itemTotal;
          });
          
          // Get the additional financial fields from validated data
          const discount = Number(validatedData.discount) || 0;       // Already present in schema
          const crPayment = Number(validatedData.crPayment) || 0;     // Already present in schema
          const shipmentCost = Number(validatedData.shipmentCost) || 0; // Already present in schema
          
          // Calculate the grand total (Total Due)
          // Formula: Subtotal - Discount - CR/Payment + Shipping
          const grandTotal = Number((subtotal - discount - crPayment + shipmentCost).toFixed(2));
          
          // 5. Convert grand total to words
          const amountInWords = numberToWords(grandTotal);
          
          // 6. Create the invoice record
          const invoice = await tx.invoice.create({
            data: {
              invoiceNo: newInvoiceNo,
              date: validatedData.date,
              paymentTerms: validatedData.paymentTerms,
              dueDate: validatedData.dueDate,
              description: validatedData.description || "",
              
              // --- Save new fields --- 
              subtotal: Number(subtotal.toFixed(2)), // Save calculated subtotal
              discount: discount,
              crPayment: crPayment,
              shipmentCost: shipmentCost,
              totalAmount: grandTotal, // Save calculated grand total as totalAmount (Total Due)
              // --- End new fields --- 

              amountInWords: amountInWords,
              
              // Address fields
              companyName: selectedShipment.companyName,
              addressLine1: selectedShipment.addressLine1,
              addressLine2: selectedShipment.addressLine2 || null,
              country: selectedShipment.country,
              state: selectedShipment.state,
              city: selectedShipment.city,
              postalCode: selectedShipment.postalCode,
              
              userId: userId,
              shipmentId: selectedShipment.id,
              
              // Create the invoice items as separate records
              items: {
                create: validatedData.items.map(item => ({
                  description: item.description,
                  carat: Number(item.carat) || 0,
                  color: item.color,
                  clarity: item.clarity,
                  lab: item.lab,
                  reportNo: item.reportNo,
                  pricePerCarat: Number(item.pricePerCarat) || 0,
                  total: Number(((Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0)).toFixed(2))
                }))
              }
            },
            // Include items in the returned object for the frontend preview
            include: {
              items: true,
            }
          });

          // ------> START: Automatically create SalesEntry from Invoice <------
          if (invoice && invoice.id && invoice.items) {
            await tx.salesEntry.create({
              data: {
                employeeId: userId, // User creating the invoice is the employee
                saleDate: invoice.date, 
                isNoSale: false, // Invoice creation implies a sale
                companyName: selectedShipment.companyName, // From the shipment linked to invoice
                totalSaleValue: invoice.totalAmount, // Use the invoice's total amount
                description: `Sale recorded from Invoice ${invoice.invoiceNo}`, // Link description
                invoiceId: invoice.id, // Link sales entry to the invoice for cascade deletion
                // trackingId, shipmentCarrier, profit, profitMargin, purchaseValue remain null for now
                saleItems: {
                  create: invoice.items.map(invItem => ({
                    carat: invItem.carat, 
                    color: invItem.color,
                    clarity: invItem.clarity,
                    certificateNo: invItem.reportNo, // Map invoice reportNo to sale certificateNo
                    pricePerCarat: invItem.pricePerCarat,
                    totalValue: invItem.total, // Map invoice item total to sale item totalValue
                  }))
                }
              }
            });
          }
          // ------> END: Automatically create SalesEntry from Invoice <------

          return { invoice, selectedShipment };
        }, {
           timeout: 15000 // Set timeout to 15 seconds (15000 ms)
        });
        
        // After successful invoice creation, send email with PDF attachment
        let emailSent = false;
        
        console.log('=== INVOICE EMAIL PROCESS START ===');
        console.log('Created invoice:', createdInvoice.invoice.invoiceNo);
        console.log('Selected shipment:', createdInvoice.selectedShipment ? 'Found' : 'Not found');
        console.log('Shipment email:', createdInvoice.selectedShipment?.email || 'No email');
        console.log('Environment EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
        console.log('Environment EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
        console.log('Environment EMAIL_HOST:', process.env.EMAIL_HOST || 'Using default');
        
        try {
          if (createdInvoice.selectedShipment && createdInvoice.selectedShipment.email) {
            console.log('✅ Starting email process for invoice:', createdInvoice.invoice.invoiceNo);
            console.log('✅ Recipient email:', createdInvoice.selectedShipment.email);
            
            console.log('🔄 Step 1: Generating PDF...');
            // Generate PDF buffer using serverless-compatible method
            let pdfBuffer: Buffer;
            try {
              pdfBuffer = await generateInvoicePDFBuffer(createdInvoice.invoice);
              console.log('✅ PDF generated successfully with Puppeteer, size:', pdfBuffer.length, 'bytes');
            } catch {
              console.log('⚠️ Puppeteer PDF generation failed, trying Resend PDF generation');
              try {
                pdfBuffer = await generateInvoicePDFBufferResend(createdInvoice.invoice);
                console.log('✅ PDF generated successfully with Resend, size:', pdfBuffer.length, 'bytes');
              } catch {
                console.log('⚠️ Resend PDF generation failed, falling back to serverless method');
                pdfBuffer = await generateInvoicePDFBufferServerless(createdInvoice.invoice);
                console.log('✅ PDF generated successfully with serverless method, size:', pdfBuffer.length, 'bytes');
              }
            }
            
            console.log('🔄 Step 2: Sending email...');
            // Send email with PDF attachment
            await sendInvoiceEmail({
              to: createdInvoice.selectedShipment.email,
              companyName: createdInvoice.invoice.companyName,
              invoiceNo: createdInvoice.invoice.invoiceNo,
              totalAmount: createdInvoice.invoice.totalAmount,
              pdfBuffer
            });
            
            console.log('✅ Invoice email sent successfully to:', createdInvoice.selectedShipment.email);
            emailSent = true;
          } else {
            const reason = !createdInvoice.selectedShipment 
              ? 'No shipment found' 
              : 'No email address in shipment';
            console.log('❌ Email skipped:', reason);
            console.log('Shipment data:', createdInvoice.selectedShipment);
          }
        } catch (emailError) {
          console.error('❌ FAILED to send invoice email:', emailError);
          const errorInfo = emailError instanceof Error ? {
            name: emailError.name,
            message: emailError.message,
            stack: emailError.stack
          } : { message: String(emailError) };
          console.error('Error details:', errorInfo);
          // Don't fail the entire operation if email fails
        }
        
        console.log('=== INVOICE EMAIL PROCESS END ===');
        
        // Create payment reminder notification (15 days after invoice creation)
        try {
          console.log('🔄 Creating payment reminder notification...');
          await createPaymentReminderNotification(createdInvoice.invoice.id, userId);
          console.log('✅ Payment reminder notification created successfully');
        } catch (notificationError) {
          console.error('❌ Failed to create payment reminder notification:', notificationError);
          // Don't fail the entire operation if notification creation fails
        }
        
        return NextResponse.json({ 
          invoice: createdInvoice.invoice,
          emailSent,
          message: emailSent 
            ? `Invoice created successfully and sent to ${createdInvoice.selectedShipment?.email}`
            : 'Invoice created successfully (email not sent - check shipment email address)'
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating invoice:', errorMessage);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }

      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        return NextResponse.json({ error: 'Failed to create invoice: Invoice number conflict.' }, { status: 409 });
      } else if (errorMessage.includes('Selected company (Shipment ID:') && errorMessage.includes('not found')) {
          return NextResponse.json({ error: errorMessage }, { status: 400 }); // Shipment not found error
      }
      return NextResponse.json({ error: `Failed to create invoice: ${errorMessage}` }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
}