import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const ITEMS_PER_PAGE = 12;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * ITEMS_PER_PAGE;
    
    // Get total count for pagination
    const totalItems = await prisma.diamond.count();
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Get diamonds for current page
    const diamonds = await prisma.diamond.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json({
      diamonds,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching diamonds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diamonds' },
      { status: 500 }
    );
  }
}