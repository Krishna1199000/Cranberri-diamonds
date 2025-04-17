import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();

    // Allow both admin and employees to fetch employee list
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employees = await prisma.user.findMany({
      where: {
        role: 'employee'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}