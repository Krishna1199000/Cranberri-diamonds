import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { type NextRequest } from "next/server"
const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const diamond = await prisma.diamond.findUnique({
      where: {
        id: resolvedParams.id
      },
    });

    if (!diamond) {
      return NextResponse.json(
        { error: 'Diamond not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(diamond);
  } catch (error) {
    console.error('Error fetching diamond:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diamond' },
      { status: 500 }
    );
  }
}