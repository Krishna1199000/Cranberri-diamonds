import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({
        success: false,
        message: 'User not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return new NextResponse(JSON.stringify({
        success: false,
        message: 'Invalid OTP'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If new password is provided (for password reset)
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          otp: null, // Clear OTP after successful verification
          verified: true
        },
      });
    } else {
      // For new user verification
      await prisma.user.update({
        where: { email },
        data: {
          otp: null, // Clear OTP after successful verification
          verified: true
        },
      });
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: newPassword ? 'Password reset successfully' : 'Email verified successfully'
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return new NextResponse(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}