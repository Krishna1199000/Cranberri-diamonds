import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { extractTokenFromCookies } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const token = extractTokenFromCookies(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || '')
    );

    const userId = payload.userId as string;
    const userRole = payload.role as string;

    // If user is not waiting for approval, return error
    if (userRole !== 'waiting_for_approval') {
      return NextResponse.json({ error: 'Not waiting for approval' }, { status: 403 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is already approved (role is customer), return success
    if (user.role === 'customer') {
      return NextResponse.json({ success: true, message: 'User already approved' });
    }

    // If user was declined, reset the declined status
    if (user.declined) {
      await prisma.user.update({
        where: { id: userId },
        data: { declined: false }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Approval request sent successfully' 
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Approval request sent successfully' 
    });

  } catch (error) {
    console.error('Error creating approval request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 