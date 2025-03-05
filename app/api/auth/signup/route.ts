import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        otp
      }
    })

    // Send email with OTP using Resend
    try {
      await resend.emails.send({
        from: 'Cranberri Diamonds <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your Cranberri Diamonds account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Cranberri Diamonds!</h2>
            <p>Thank you for signing up. Please use the following OTP to verify your account:</p>
            <div style="background: #f4f4f4; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <h1 style="font-size: 32px; margin: 0; color: #333;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      })
    } catch (error) {
      console.error('Failed to send email:', error)
      return NextResponse.json({ success: false, message: 'Failed to send OTP email' })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      email: email
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' })
  }
}