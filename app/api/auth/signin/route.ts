import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.verified) {
      return NextResponse.json({ success: false, message: 'Please verify your email first' });
    }

    // Generate JWT token with role and name
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1d' }
    );

    const response = NextResponse.json({ 
      success: true,
      role: user.role,
      requiresApproval: user.role === 'waiting_for_approval'
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 1 day
    });

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' });
  }
}