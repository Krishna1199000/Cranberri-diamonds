import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, currentRole } = await req.json();

    // Get the user's current role from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    // Check if the role matches
    if (user.role !== currentRole) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying role:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}