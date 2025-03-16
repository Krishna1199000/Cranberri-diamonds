import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        name,
        email,
        message
      }
    })

    return NextResponse.json({ success: true, chatMessage })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create chat message' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}