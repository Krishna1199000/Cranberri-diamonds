import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No token found in cookies');
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
      
      console.log('Session payload:', payload);
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
    console.log('Session not found, redirecting to signin');
    return Response.redirect(new URL('/auth/signin', request.url));
  }
  
  return session;
}