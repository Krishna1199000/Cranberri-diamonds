import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId || typeof session.userId !== 'string') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return new NextResponse('Invalid password', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    return new NextResponse('Password updated successfully', { status: 200 });
  } catch (error) {
    console.error('Password update error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}