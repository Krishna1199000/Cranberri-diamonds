// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { numberToWords, generateInvoiceNumber } from '@/lib/utils';
import { generateInvoicePDFBuffer } from '@/lib/pdf-utils';
import { generateInvoicePDFBufferServerless } from '@/lib/pdf-utils-serverless';
import { generateInvoicePDFBufferResend } from '@/lib/pdf-utils-resend';
import { sendInvoiceEmail } from '@/lib/email';
import { createPaymentReminderNotification } from '@/lib/notification-scheduler';
import { getSession } from '@/lib/session';
import { invoiceFormSchema } from '@/lib/validators/invoice';
import {
  collectInventoryStockIds,
  fetchInventoryTierMap,
  normalizeItemsToAskingPrices,
  validateInventoryTierPricing,
} from '@/lib/utils/pricing-tiers';


const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;
    const userRole = session?.role as string | undefined;

    if (!userId || !userRole) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const employeeIds = searchParams.get('employeeIds')?.split(',').filter(Boolean) || [];
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const states = searchParams.get('states')?.split(',').filter(Boolean) || [];
    const shapes = searchParams.get('shapes')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const clarities = searchParams.get('clarities')?.split(',').filter(Boolean) || [];
    const labs = searchParams.get('labs')?.split(',').filter(Boolean) || [];
    const caratMin = searchParams.get('caratMin');
    const caratMax = searchParams.get('caratMax');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    const whereClause: Prisma.InvoiceWhereInput = {};

    // Role-based filtering
    if (userRole === 'employee') {
        whereClause.userId = userId;
    } else if (userRole === 'admin' && employeeIds.length > 0) {
        whereClause.userId = { in: employeeIds };
    }

    // Company filter
    if (companies.length > 0) {
        whereClause.companyName = { in: companies };
    }

    // State filter
    if (states.length > 0) {
        whereClause.state = { in: states };
    }

    // Date range filter
    if (dateStart || dateEnd) {
        whereClause.date = {};
        if (dateStart) {
            whereClause.date.gte = new Date(dateStart);
        }
        if (dateEnd) {
            const endDate = new Date(dateEnd);
            endDate.setHours(23, 59, 59, 999);
            whereClause.date.lte = endDate;
        }
    }

    // Item-based filters (shape, color, clarity, lab, carat)
    const itemFilters: Prisma.InvoiceItemWhereInput = {};
    if (shapes.length > 0) {
        itemFilters.shape = { in: shapes };
    }
    if (colors.length > 0) {
        itemFilters.color = { in: colors };
    }
    if (clarities.length > 0) {
        itemFilters.clarity = { in: clarities };
    }
    if (labs.length > 0) {
        itemFilters.lab = { in: labs };
    }
    if (caratMin || caratMax) {
        itemFilters.carat = {};
        if (caratMin) {
            itemFilters.carat.gte = parseFloat(caratMin);
        }
        if (caratMax) {
            itemFilters.carat.lte = parseFloat(caratMax);
        }
    }

    // If any item filters exist, add them to the where clause
    if (Object.keys(itemFilters).length > 0) {
        whereClause.items = {
            some: itemFilters
        };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: {
        invoiceNo: 'desc'
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
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

        const stockIds = collectInventoryStockIds(validatedData.items);

        if (stockIds.length > 0) {
          const inventoryByStockId = await fetchInventoryTierMap(stockIds, (args) =>
            prisma.inventoryItem.findMany(args)
          );

          const tierValidation = validateInventoryTierPricing(
            validatedData.items,
            inventoryByStockId,
            userRole
          );
          if (!tierValidation.ok) {
            return NextResponse.json(
              { error: tierValidation.error },
              { status: tierValidation.status }
            );
          }

          validatedData.items = normalizeItemsToAskingPrices(
            validatedData.items,
            inventoryByStockId
          );
        }
        
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
                  shape: item.shape || null,
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
                state: selectedShipment.state, // Add state from shipment
                saleItems: {
                  create: invoice.items.map(invItem => ({
                    carat: invItem.carat, 
                    color: invItem.color,
                    clarity: invItem.clarity,
                    shape: invItem.shape || null, // Add shape from invoice item
                    lab: invItem.lab || null, // Add lab from invoice item
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
        
        // Send email with PDF attachment
        let emailSent = false;
        let emailError: Error | null = null;
        
        // Check if email is enabled (default to true for backward compatibility)
        const emailEnabled = validatedData.emailEnabled !== false;
        
        if (emailEnabled && createdInvoice.selectedShipment && createdInvoice.selectedShipment.email) {
          try {
            console.log('=== INVOICE EMAIL PROCESS START ===');
            console.log('Created invoice:', createdInvoice.invoice.invoiceNo);
            console.log('Recipient email:', createdInvoice.selectedShipment.email);
            
            console.log('🔄 Step 1: Generating PDF...');
            // Generate PDF buffer with multiple fallback methods
            let pdfBuffer: Buffer;
            let pdfGenerationMethod = '';
            
            try {
              // Try jsPDF first (most reliable in production environments)
              const { generateInvoicePDFBufferJsPDF } = await import('@/lib/pdf-utils-jspdf');
              pdfBuffer = await generateInvoicePDFBufferJsPDF(createdInvoice.invoice);
              pdfGenerationMethod = 'jspdf';
              console.log('✅ PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes');
            } catch (jspdfError) {
              console.log('⚠️ jsPDF generation failed, trying Puppeteer');
              try {
                pdfBuffer = await generateInvoicePDFBuffer(createdInvoice.invoice);
                pdfGenerationMethod = 'puppeteer';
                console.log('✅ PDF generated successfully with Puppeteer, size:', pdfBuffer.length, 'bytes');
              } catch (puppeteerError) {
                console.log('⚠️ Puppeteer PDF generation failed, trying Resend PDF generation');
                try {
                  pdfBuffer = await generateInvoicePDFBufferResend(createdInvoice.invoice);
                  pdfGenerationMethod = 'resend';
                  console.log('✅ PDF generated successfully with Resend, size:', pdfBuffer.length, 'bytes');
                } catch (resendError) {
                  console.log('⚠️ Resend PDF generation failed, trying serverless method');
                  try {
                    pdfBuffer = await generateInvoicePDFBufferServerless(createdInvoice.invoice);
                    pdfGenerationMethod = 'serverless';
                    console.log('✅ PDF generated successfully with serverless method, size:', pdfBuffer.length, 'bytes');
                  } catch (serverlessError) {
                    console.error('❌ All PDF generation methods failed');
                    console.error('jsPDF error:', jspdfError);
                    console.error('Puppeteer error:', puppeteerError); 
                    console.error('Resend error:', resendError);
                    console.error('Serverless error:', serverlessError);
                    throw new Error('All PDF generation methods failed');
                  }
                }
              }
            }
            
            // Validate PDF buffer
            if (!pdfBuffer || pdfBuffer.length === 0) {
              throw new Error('Generated PDF buffer is empty');
            }
            
            console.log(`✅ PDF generation completed using ${pdfGenerationMethod} method`);
            
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
          } catch (error) {
            console.error('❌ FAILED to send invoice email:', error);
            emailError = error instanceof Error ? error : new Error(String(error));
            const errorInfo = error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : { message: String(error) };
            console.error('Error details:', errorInfo);
          }
          console.log('=== INVOICE EMAIL PROCESS END ===');
        } else {
          const reason = !createdInvoice.selectedShipment 
            ? 'No shipment found' 
            : 'No email address in shipment';
          console.log('❌ Email skipped:', reason);
        }
        
        // Create payment reminder notification (15 days after invoice creation) - Move to background
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
            : emailError 
              ? `Invoice created successfully but email failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
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