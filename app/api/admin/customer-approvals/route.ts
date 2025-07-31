import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
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

    const userRole = payload.role as string;

    // Only admins can access this
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all users waiting for approval or declined
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'waiting_for_approval' },
          { role: 'waiting_for_approval', declined: true }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        declined: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match the expected format
    const requests = users.map(user => ({
      id: user.id,
      status: user.declined ? 'DECLINED' : 'PENDING',
      createdAt: user.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    }));

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Error fetching approval requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = extractTokenFromCookies(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || '')
    );

    const userRole = payload.role as string;

    // Only admins can access this
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the user details
    const user = await prisma.user.findUnique({
      where: { id: requestId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'waiting_for_approval') {
      return NextResponse.json({ error: 'User not waiting for approval' }, { status: 400 });
    }

    if (action === 'approve') {
      // Change user role to customer
      await prisma.user.update({
        where: { id: requestId },
        data: { 
          role: 'customer',
          declined: false
        }
      });

      // Convert logo to base64 for embedding in email
      let logoBase64 = '';
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logoPath = path.default.join(process.cwd(), 'public', 'logo.png');
        const logoBuffer = fs.default.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Failed to load logo:', error);
      }

      // Send approval email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to Cranberri Diamonds - Account Approved!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              ${logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 150px; height: auto;"></div>` : ''}
              <h2>Welcome to Cranberri Diamonds!</h2>
              <p>Dear ${user.name},</p>
              <p>Great news! We accepted your request. You are now free to use our site and explore our collection of exquisite diamonds.</p>
              <div style="background: #f4f4f4; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h3 style="margin: 0; color: #333;">What you can do now:</h3>
                <ul style="margin: 16px 0; padding-left: 20px;">
                  <li>Browse our diamond inventory</li>
                  <li>View detailed diamond specifications</li>
                  <li>Access customer dashboard</li>
                  <li>Contact our team for inquiries</li>
                </ul>
              </div>
              <p>Thank you for choosing Cranberri Diamonds. We look forward to serving you!</p>
              <p>Best regards,<br>The Cranberri Diamonds Team</p>
              ${logoBase64 ? `<div style="text-align: center; margin-top: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 120px; height: auto; opacity: 0.7;"></div>` : ''}
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      // Mark user as declined
      await prisma.user.update({
        where: { id: requestId },
        data: { declined: true }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: action === 'approve' ? 'Customer approved successfully' : 'Customer request declined' 
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 