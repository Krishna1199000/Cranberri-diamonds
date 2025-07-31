import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to = 'accounts@cranberridiamonds.in' } = body;

    console.log('🧪 Test Email: Starting test email to:', to);

    await sendEmail({
      to,
      subject: 'Test Email from Cranberri Diamonds',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Email Host:</strong> ${process.env.EMAIL_HOST || 'smtpout.secureserver.net (default)'}</p>
          <p><strong>Email User:</strong> ${process.env.EMAIL_USER || 'accounts@cranberridiamonds.in (default)'}</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: to
    });

  } catch (error) {
    console.error('🧪 Test Email: Failed to send test email:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        emailHost: process.env.EMAIL_HOST || 'smtpout.secureserver.net (default)',
        emailUser: process.env.EMAIL_USER || 'accounts@cranberridiamonds.in (default)',
        emailPassword: process.env.EMAIL_PASSWORD ? 'Set' : 'NOT SET',
        emailPort: process.env.EMAIL_PORT || '587 (default)',
        environment: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
} 