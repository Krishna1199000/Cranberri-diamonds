import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function getSession() {
  const token = (await cookies()).get('token')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    )
    return payload
  } catch {
    return null
  }
}

export async function updateSession(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return Response.redirect(new URL('/auth/signin', request.url))
  }
  
  return session
}