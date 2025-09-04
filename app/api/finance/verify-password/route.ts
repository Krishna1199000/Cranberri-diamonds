import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyFinancePassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { password } = await request.json();
    
    if (!password) {
      return new NextResponse('Password required', { status: 400 });
    }

    const isValid = await verifyFinancePassword(password);
    
    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return new NextResponse('Invalid password', { status: 401 });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


