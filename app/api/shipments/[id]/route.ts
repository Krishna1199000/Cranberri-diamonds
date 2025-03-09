import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const db = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const shipment = await db.shipment.findUnique({
      where: { id }
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, shipment })
  } catch (error) {
    console.error('Error fetching shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shipment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const shipment = await db.shipment.update({
      where: { id },
      data: {
        ...body,
        lastUpdatedBy: (session.user as { name?: string }).name || 'Unknown'
      }
    })

    return NextResponse.json({ success: true, shipment })
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update shipment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    await db.shipment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete shipment' },
      { status: 500 }
    )
  }
}