import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/OTP';
import { sendEmail, getLogoForEmail, createEmailTemplate } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, adminEmail } = await request.json();
    console.log('Received request for:', { email, adminEmail });

    // Verify that the admin exists and has admin role
    const admin = await prisma.user.findUnique({
      where: { 
        email: adminEmail
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    console.log('Found admin:', admin);

    if (!admin) {
      console.log('Admin not found:', adminEmail);
      return new NextResponse(JSON.stringify({ 
        error: 'Admin not found' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (admin.role !== 'admin') {
      console.log('User is not an admin:', admin.role);
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized - Not an admin' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the user whose role is being changed exists
    const userToUpdate = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!userToUpdate) {
      console.log('User to update not found:', email);
      return new NextResponse(JSON.stringify({ 
        error: 'User not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const otp = generateOTP();
    console.log('Generated OTP for admin:', adminEmail, ':', otp);

    try {
      // Store OTP with the admin's record
      await prisma.user.update({
        where: { email: adminEmail },
        data: { otp },
      });

      // Send OTP to admin's email
      try {
        // Get logo URL for email
        const logoUrl = getLogoForEmail();

        // Create email content using the new template
        const content = `
          <p>Dear ${admin.name || 'Admin'},</p>
          
          <p>You have requested to change the role of user <strong>${userToUpdate.name || userToUpdate.email}</strong>.</p>
          
          <p>Please use the following OTP to verify this action:</p>
          
          <div class="otp-code">
            ${otp}
          </div>
          
          <div class="highlight">
            <h3>Action Details</h3>
            <p><strong>Target User:</strong> ${userToUpdate.name || userToUpdate.email}</p>
            <p><strong>Email:</strong> ${userToUpdate.email}</p>
            <p><strong>Requested by:</strong> ${admin.name || admin.email}</p>
          </div>
          
          <p><strong>Security Note:</strong> This OTP will expire in 10 minutes. If you didn't request this action, please contact support immediately.</p>
          
          <p>Best regards,<br>
          <strong>Cranberri Diamonds System</strong></p>
        `;

        const html = createEmailTemplate({
          logoUrl,
          title: 'OTP for User Role Management',
          content
        });

        await sendEmail({
          to: adminEmail,
          subject: 'Cranberri Diamonds - Admin Action Verification Required',
          html,
        });
        console.log('Email sent successfully to admin:', adminEmail);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      return new NextResponse(JSON.stringify({
        success: true,
        message: 'OTP sent to admin email',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new NextResponse(JSON.stringify({ 
        error: 'Database error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in OTP generation:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}