import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session?.userId || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.chatMessage.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat message:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete chat message' },
      { status: 500 }
    )
  }
}