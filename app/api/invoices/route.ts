// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { numberToWords, generateInvoiceNumber } from '@/lib/utils';
import { getSession } from '@/lib/session';
import { invoiceFormSchema } from '@/lib/validators/invoice';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        invoiceNo: 'desc'
      },
      include: {
        items: true
      }
    });
    
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices: ', String(error)); 
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      
      // Validate the incoming data
      const validation = invoiceFormSchema.safeParse(body);
      if (!validation.success) {
        console.error("Invoice validation failed:", JSON.stringify(validation.error.errors, null, 2)); 
        return NextResponse.json({ error: 'Invalid input data', details: validation.error.errors }, { status: 400 });
      }
      const validatedData = validation.data;
      
      // Get session
      const session = await getSession();
      const userId = session?.userId as string;
      if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      // --- Transaction for fetching latest invoice number and creating new one ---
      const createdInvoice = await prisma.$transaction(async (tx) => {
        // 1. Fetch the actual latest invoice number string (by creation date) within the transaction
        const latestInvoice = await tx.invoice.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { invoiceNo: true }
        });
        
        // 2. Generate the new invoice number
        const newInvoiceNo = generateInvoiceNumber(latestInvoice?.invoiceNo, validatedData.date);
        
        // 3. Calculate item totals as subtotal
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
        
        // 4. Convert grand total to words
        const amountInWords = numberToWords(grandTotal);
        
        // 5. Create the invoice record
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
            companyName: validatedData.companyName,
            addressLine1: validatedData.addressLine1,
            addressLine2: validatedData.addressLine2 || null,
            country: validatedData.country,
            state: validatedData.state,
            city: validatedData.city,
            postalCode: validatedData.postalCode,
            
            userId: userId,
            shipmentId: null,
            
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
      }
      return NextResponse.json({ error: `Failed to create invoice: ${errorMessage}` }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
}