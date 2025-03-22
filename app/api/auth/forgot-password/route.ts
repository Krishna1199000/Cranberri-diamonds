import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/OTP';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();

    // Save OTP to user record
    await prisma.user.update({
      where: { email },
      data: { otp },
    });

    // Send email with OTP
    const emailContent = `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
      <h3 style="color: #4F46E5; font-size: 24px; letter-spacing: 2px;">${otp}</h3>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: emailContent,
    });

    return new NextResponse('OTP sent successfully', { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}