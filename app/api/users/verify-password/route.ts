import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const USERS_PASSWORD = process.env.USERS_PASSWORD || 'users123';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { password } = await request.json();

    if (password === USERS_PASSWORD) {
      return NextResponse.json({ success: true });
    } else {
      return new NextResponse('Invalid password', { status: 401 });
    }
  } catch (error) {
    console.error('Users password verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

