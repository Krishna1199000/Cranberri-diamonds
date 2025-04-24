// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { numberToWords } from '@/lib/utils';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      
      // Calculate total amount from all items
      let totalAmount = 0;
      
      body.items.forEach((item) => {
        const itemTotal = item.carat * item.pricePerCarat;
        totalAmount += itemTotal;
      });
  
      // Round to 2 decimal places
      totalAmount = Number(totalAmount.toFixed(2));
  
      // Use the numberToWords function to get the amount in words
      const amountInWords = numberToWords(totalAmount);
      
      // Get session
      const session = await getSession();
      console.log("Session data:", session); // Add debugging
      
      // Access userId directly from session (not from session.user)
      const userId = session?.userId;
      
      console.log("User ID:", userId); // Add debugging
      
      if (!userId) {
        // If session exists but userId doesn't, log more details
        console.error("Session exists but no userId found:", session);
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      // Create the invoice record
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo: body.invoiceNo,
          date: new Date(body.date),
          paymentTerms: body.paymentTerms,
          dueDate: new Date(body.dueDate),
          description: body.description || "",
          totalAmount: totalAmount,
          amountInWords: amountInWords,
          
          // Address fields
          companyName: body.companyName,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2 || null,
          country: body.country,
          state: body.state,
          city: body.city,
          postalCode: body.postalCode,
          
          // Simply provide the userId directly
          userId: userId,
          
          // Create the invoice items as separate records
          items: {
            create: body.items.map(item => ({
              description: item.description,
              carat: item.carat,
              color: item.color,
              clarity: item.clarity,
              lab: item.lab,
              reportNo: item.reportNo,
              pricePerCarat: item.pricePerCarat,
              total: Number((item.carat * item.pricePerCarat).toFixed(2))
            }))
          }
        }
      });
      
      return NextResponse.json({ invoice });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating invoice:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}