import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const db = new PrismaClient()


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const session = await getSession()

    if (!session?.userId) {
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

    // Check if user has permission to view this shipment
    if (session.role !== 'admin' && shipment.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You do not have permission to view this shipment' },
        { status: 403 }
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
  { params }: { params: { id: string } }
) {
  const { id } =  await params;

  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to edit it
    const existingShipment = await db.shipment.findUnique({
      where: { id }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the creator to edit the shipment
    if (session.role !== 'admin' && existingShipment.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You do not have permission to edit this shipment' },
        { status: 403 }
      )
    }

    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Invalid content type, expected application/json' },
        { status: 400 }
      );
    }

    const body = await req.json()

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or empty request body' },
        { status: 400 }
      );
    }

    const shipment = await db.shipment.update({
      where: { id },
      data: {
        ...body,
        lastUpdatedBy: session.email || 'Unknown'
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
  { params }: { params: { id: string } }
) {
  const { id } =  params

  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to delete it
    const existingShipment = await db.shipment.findUnique({
      where: { id }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the creator to delete the shipment
    if (session.role !== 'admin' && existingShipment.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You do not have permission to delete this shipment' },
        { status: 403 }
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