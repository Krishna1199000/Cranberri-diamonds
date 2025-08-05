import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No token found in cookies');
      }
      return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('Session payload:', payload);
      }

      // Single active session enforcement
      if (payload && payload.userId && payload.sessionId) {
        const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
        if (!user || user.currentSessionId !== payload.sessionId) {
          // Session is invalidated due to another login
          return { forcedLogout: true };
        }
      }

      return payload;
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

export async function updateSession(request: Request) {
  const session = await getSession();
  
  if (!session) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Session not found, redirecting to signin');
    }
    return Response.redirect(new URL('/auth/signin', request.url));
  }
  
  return session;
}