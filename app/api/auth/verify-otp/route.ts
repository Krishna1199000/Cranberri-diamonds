import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { adminEmail, otp, userId, newRole } = await request.json();

    // Verify admin and OTP
    const admin = await prisma.user.findUnique({
      where: { 
        email: adminEmail,
        role: 'admin'
      },
    });

    if (!admin || admin.otp !== otp) {
      return new NextResponse(JSON.stringify({
        success: false,
        message: 'Invalid OTP or unauthorized access'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Clear admin's OTP
    await prisma.user.update({
      where: { email: adminEmail },
      data: { otp: null },
    });

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Role updated successfully'
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