import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({
        success: false, 
        message: 'No token found' 
      });
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    );

    return NextResponse.json({
      success: true,
      role: payload.role,
      name: payload.email // Using email as name since we don't store names
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
}