import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const VENDORS_PASSWORD = process.env.VENDORS_PASSWORD || 'vendors123';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { password } = await request.json();

    if (password === VENDORS_PASSWORD) {
      return NextResponse.json({ success: true });
    } else {
      return new NextResponse('Invalid password', { status: 401 });
    }
  } catch (error) {
    console.error('Vendors password verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}





