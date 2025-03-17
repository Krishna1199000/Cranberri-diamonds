import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, newRole, currentUserId } = await req.json();

    // Update user role in database
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    // Create response
    const response = NextResponse.json({ success: true });
    
    // Only clear cookie if the affected user is the current user
    if (userId === currentUserId) {
      response.cookies.set('token', '', {
        expires: new Date(0),
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error handling sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to handle sessions' },
      { status: 500 }
    );
  }
}