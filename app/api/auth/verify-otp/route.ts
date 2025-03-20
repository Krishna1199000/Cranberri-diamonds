import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || typeof session.userId !== 'string') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { otp, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.otp !== otp) {
      return new NextResponse('Invalid OTP', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId},
      data: { 
        password: hashedPassword,
        otp: null,
      },
    });

    return new NextResponse('Password updated successfully', { status: 200 });
  } catch (error) {
    console.error('OTP verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}