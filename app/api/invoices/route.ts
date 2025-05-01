// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { numberToWords, generateInvoiceNumber } from '@/lib/utils';
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
          return invoice;
        });
        
        return NextResponse.json({ invoice: createdInvoice });
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