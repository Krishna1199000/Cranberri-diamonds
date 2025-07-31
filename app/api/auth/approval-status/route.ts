import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { extractTokenFromCookies } from '@/lib/utils';

export async function GET(request: Request) {
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

    // Check if user has been approved (role changed to customer)
    if (user.role === 'customer') {
      return NextResponse.json({
        status: 'APPROVED',
        message: `Hello, ${user.name || 'User'}!`
      });
    }

    // Check if user has been declined
    if (user.declined) {
      return NextResponse.json({
        status: 'DECLINED',
        message: `Hello, ${user.name || 'User'}!`
      });
    }

    // User is still waiting for approval
    return NextResponse.json({
      status: 'PENDING',
      message: `Hello, ${user.name || 'User'}!`
    });

  } catch (error) {
    console.error('Error checking approval status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 