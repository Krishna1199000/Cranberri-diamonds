// First, install nodemailer:
// npm install nodemailer

// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendEmail, getLogoForEmail, createEmailTemplate } from '@/lib/email';

const prisma = new PrismaClient();

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
    
    // Get logo URL for email
    const logoUrl = getLogoForEmail();

    // Create email content using the new template
    const content = `
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Welcome to Cranberri Diamonds! Thank you for joining our exclusive community of diamond enthusiasts.</p>
      
      <p>To complete your account setup, please verify your email address using the OTP below:</p>
      
      <div class="otp-code">
        ${otp}
      </div>
      
      <div class="highlight">
        <h3>Account Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Status:</strong> ${isAdmin ? 'Admin Account' : 'Pending Approval'}</p>
      </div>
      
      <p><strong>Important:</strong> This OTP will expire in 10 minutes for your security.</p>
      
      ${!isAdmin ? `
        <p><strong>Note:</strong> Your account is currently pending approval. Once an admin reviews and approves your account, you'll be able to access all features.</p>
      ` : ''}
      
      <p>If you didn't create this account, please ignore this email.</p>
      
      <p>Welcome aboard!<br>
      <strong>The Cranberri Diamonds Team</strong></p>
    `;

    const html = createEmailTemplate({
      logoUrl,
      title: 'Welcome to Cranberri Diamonds!',
      content
    });
    
    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Cranberri Diamonds - Verify Your Account',
        html
      });
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