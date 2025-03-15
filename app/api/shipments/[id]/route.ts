import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

const db = new PrismaClient()

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    
    const { id } = context.params
    console.log('GET Request - Params:', { id })
    
    const session = await getSession()
    console.log('Session data:', session)

    
    
    if (!session?.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const shipment = await db.shipment.findUnique({
      where: { id }
    })
    console.log('Found shipment:', shipment)

    if (!shipment) {
      console.log('Shipment not found for id:', id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this shipment
    if (session.role !== 'admin' && shipment.userId !== session.userId) {
      console.log('Permission denied - User:', session.userId, 'Role:', session.role)
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
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log('PUT Request - Params:', { id })
    
    const session = await getSession()
    console.log('Session data:', session)

    if (!session?.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to edit it
    const existingShipment = await db.shipment.findUnique({
      where: { id }
    })
    console.log('Existing shipment:', existingShipment)

    if (!existingShipment) {
      console.log('Shipment not found for id:', id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the creator to edit the shipment
    if (session.role !== 'admin' && existingShipment.userId !== session.userId) {
      console.log('Permission denied - User:', session.userId, 'Role:', session.role)
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You do not have permission to edit this shipment' },
        { status: 403 }
      )
    }

    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Invalid content type, expected application/json' },
        { status: 400 }
      )
    }

    const body = await req.json()

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or empty request body' },
        { status: 400 }
      )
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
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log('DELETE Request - Params:', { id })
    
    const session = await getSession()
    console.log('Session data:', session)

    if (!session?.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to delete it
    const existingShipment = await db.shipment.findUnique({
      where: { id }
    })
    console.log('Existing shipment:', existingShipment)

    if (!existingShipment) {
      console.log('Shipment not found for id:', id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the creator to delete the shipment
    if (session.role !== 'admin' && existingShipment.userId !== session.userId) {
      console.log('Permission denied - User:', session.userId, 'Role:', session.role)
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You do not have permission to delete this shipment' },
        { status: 403 }
      )
    }

    await db.shipment.delete({
      where: { id }
    })
    console.log('Successfully deleted shipment:', id)

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete shipment' },
      { status: 500 }
    )
  }
}