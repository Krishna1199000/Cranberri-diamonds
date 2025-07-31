// First, install nodemailer:
// npm install nodemailer

// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'accounts@cranberridiamonds.in',
    pass: process.env.EMAIL_PASSWORD || 'Accounts@cranberridomain',
  },
});

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' });
    }
    
    // Check if email is in admin_emails
    const isAdmin = await prisma.adminEmail.findUnique({
      where: { email }
    });
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with appropriate role
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        otp,
        role: isAdmin ? 'admin' : 'waiting_for_approval'
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

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Cranberri Diamonds <accounts@cranberridiamonds.in>',
      to: email,
      subject: 'Verify your Cranberri Diamonds account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          ${logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 150px; height: auto;"></div>` : ''}
          <h2>Welcome to Cranberri Diamonds!</h2>
          <p>Thank you for signing up. Please use the following OTP to verify your account:</p>
          <div style="background: #f4f4f4; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
            <h1 style="font-size: 32px; margin: 0; color: #333;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          ${logoBase64 ? `<div style="text-align: center; margin-top: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 120px; height: auto; opacity: 0.7;"></div>` : ''}
        </div>
      `
    };
    
    // Send email
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      return NextResponse.json({ success: false, message: 'Failed to send OTP email' });
    }
    
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      email: email
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' });
  }
}