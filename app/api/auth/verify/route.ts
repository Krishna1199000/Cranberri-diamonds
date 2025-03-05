import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' })
    }

    // Verify OTP
    if (user.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' })
    }

    // Update user verification status
    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
        otp: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' })
  }
}
