import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get current user' },
      { status: 500 }
    );
  }
}