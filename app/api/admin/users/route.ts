

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    console.log('Session:', session);
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, role } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user role' },
      { status: 500 }
    );
  }
}