import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, exists: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reportNo } = await request.json();

    if (!reportNo || typeof reportNo !== 'string' || reportNo.trim().length === 0) {
      return NextResponse.json(
        { success: false, exists: false, message: 'Report number is required' },
        { status: 400 }
      );
    }

    const trimmed = reportNo.trim();

    // Check if the report number exists in inventory (certificate or stock ID)
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          {
            certificateNo: {
              equals: trimmed,
              mode: 'insensitive',
            },
          },
          {
            stockId: {
              equals: trimmed,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        stockId: true,
        certificateNo: true,
        shape: true,
        size: true,
        color: true,
        clarity: true,
      }
    });

    if (existingItem) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: `This stone (Report No. ${reportNo}) is already listed in the inventory. Please use the Add to Cart method to include it in a document.`,
        item: {
          stockId: existingItem.stockId,
          certificateNo: existingItem.certificateNo,
          shape: existingItem.shape,
          size: existingItem.size,
          color: existingItem.color,
          clarity: existingItem.clarity,
        }
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      message: 'Report number is available for Lot B entry.'
    });

  } catch (error) {
    console.error('Error checking report number:', error);
    return NextResponse.json(
      { 
        success: false, 
        exists: false, 
        message: 'Failed to check report number' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}