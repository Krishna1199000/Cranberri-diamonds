import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/OTP';
import { sendEmail, getLogoForEmail, createEmailTemplate } from '@/lib/email';

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

    // Get logo URL for email
    const logoUrl = getLogoForEmail();

    // Create email content using the new template
    const content = `
      <p>Dear ${user.name || 'User'},</p>
      
      <p>You have requested to reset your password for your Cranberri Diamonds account. Please use the following OTP to proceed:</p>
      
      <div class="otp-code">
        ${otp}
      </div>
      
      <p><strong>Important:</strong> This OTP will expire in 10 minutes for your security.</p>
      
      <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
      
      <p>For any assistance, feel free to contact our support team.</p>
      
      <p>Best regards,<br>
      <strong>The Cranberri Diamonds Team</strong></p>
    `;

    const html = createEmailTemplate({
      logoUrl,
      title: 'Password Reset Request',
      content
    });

    await sendEmail({
      to: email,
      subject: 'Reset Your Cranberri Diamonds Password',
      html,
    });

    return new NextResponse('OTP sent successfully', { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}