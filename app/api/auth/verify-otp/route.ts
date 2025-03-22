import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.otp !== otp) {
      return new NextResponse('Invalid OTP', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        otp: null, // Clear the OTP after successful verification
      },
    });

    return new NextResponse('Password updated successfully', { status: 200 });
  } catch (error) {
    console.error('OTP verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}