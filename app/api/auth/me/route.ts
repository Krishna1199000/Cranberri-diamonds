import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();

    const user = await prisma.user.update({
      where: { id: session.userId as string },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}