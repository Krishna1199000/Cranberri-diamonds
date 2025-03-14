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

    console.log('Session data:', session)


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
  const { id } = await params;


  console.log('Shipment ID:', id);

  try {
    const session = await getSession()


    console.log('Session data:', session)

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Invalid content type, expected application/json' },
        { status: 400 }
      );
    }

    const body = await req.json()
    console.log('Request body:', body);

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
        lastUpdatedBy: session.name || 'Unknown'
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

    console.log('Session data:', session)

    if (!session?.userId) {
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