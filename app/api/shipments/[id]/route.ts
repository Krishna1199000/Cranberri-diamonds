import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

const db = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;

  try {
    const session = await getSession()
    console.log('Session data:', session)
    
    if (!session || !session.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Session required' },
        { status: 401 }
      )
    }

    const shipment = await db.shipment.findUnique({
      where: { id: resolvedParams.id }
    })
    console.log('Found shipment:', shipment)

    if (!shipment) {
      console.log('Shipment not found for id:', resolvedParams.id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this shipment
    if (session.role !== 'admin') {
        // Ensure session.userId is valid before querying user
        if (!session.userId) { 
             return NextResponse.json({ success: false, message: 'Unauthorized - User ID missing' }, { status: 401 });
        }
        // Fetch the current user's name for comparison
        const currentUser = await db.user.findUnique({
          where: { id: session.userId as string },
          select: { name: true }
        });
        // Deny if not admin AND shipment's salesExecutive doesn't match current user's name
        if (shipment.salesExecutive !== currentUser?.name) {
           console.log('Permission denied - User:', session.userId, 'Role:', session.role, 'SalesExec:', shipment.salesExecutive);
           return NextResponse.json(
             { success: false, message: 'Unauthorized - You do not have permission to view this shipment' },
             { status: 403 }
           );
        }
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
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession()
    console.log('Session data:', session)

    if (!session || !session.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Session required' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to edit it
    const existingShipment = await db.shipment.findUnique({
      where: { id: resolvedParams.id }
    })
    console.log('Existing shipment:', existingShipment)

    if (!existingShipment) {
      console.log('Shipment not found for id:', resolvedParams.id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the employee listed as salesExecutive to edit the shipment
    if (session.role !== 'admin') {
       // Ensure session.userId is valid before querying user
       if (!session.userId) { 
           return NextResponse.json({ success: false, message: 'Unauthorized - User ID missing' }, { status: 401 });
       }
       // Fetch the current user's name for comparison
       const currentUser = await db.user.findUnique({
          where: { id: session.userId as string },
          select: { name: true }
        });
       // Deny if not admin AND existing shipment's salesExecutive doesn't match current user's name
       if (existingShipment.salesExecutive !== currentUser?.name) {
           console.log('Permission denied - User:', session.userId, 'Role:', session.role, 'SalesExec:', existingShipment.salesExecutive);
           return NextResponse.json(
             { success: false, message: 'Unauthorized - You do not have permission to edit this shipment' },
             { status: 403 }
           );
        }
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

    // Clean up the body data before updating
    const updateData = {
      ...body,
      lastUpdatedBy: session.email || 'Unknown',
      // Ensure numeric fields are properly typed
      limit: typeof body.limit === 'string' ? parseFloat(body.limit) : body.limit,
      // Ensure arrays are properly handled
      tradeBodyMembership: Array.isArray(body.tradeBodyMembership) ? body.tradeBodyMembership : [],
      references: Array.isArray(body.references) ? body.references : [],
      // Force update the timestamp
      updatedAt: new Date()
    }

    // Remove any undefined or null values to prevent Prisma errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key]
      }
    })

    const shipment = await db.shipment.update({
      where: { id: resolvedParams.id },
      data: updateData
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
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession()
    console.log('Session data:', session)

    if (!session || !session.userId) {
      console.log('Unauthorized access attempt - no userId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Session required' },
        { status: 401 }
      )
    }

    // Check if the shipment exists and if the user has permission to delete it
    const existingShipment = await db.shipment.findUnique({
      where: { id: resolvedParams.id }
    })
    console.log('Existing shipment:', existingShipment)

    if (!existingShipment) {
      console.log('Shipment not found for id:', resolvedParams.id)
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow admin or the employee listed as salesExecutive to delete the shipment
    if (session.role !== 'admin') {
        // Ensure session.userId is valid before querying user
        if (!session.userId) { 
            return NextResponse.json({ success: false, message: 'Unauthorized - User ID missing' }, { status: 401 });
        }
       // Fetch the current user's name for comparison
       const currentUser = await db.user.findUnique({
          where: { id: session.userId as string },
          select: { name: true }
        });
       // Deny if not admin AND existing shipment's salesExecutive doesn't match current user's name
       if (existingShipment.salesExecutive !== currentUser?.name) {
            console.log('Permission denied - User:', session.userId, 'Role:', session.role, 'SalesExec:', existingShipment.salesExecutive);
           return NextResponse.json(
             { success: false, message: 'Unauthorized - You do not have permission to delete this shipment' },
             { status: 403 }
           );
        }
    }

    await db.shipment.delete({
      where: { id: resolvedParams.id }
    })
    console.log('Successfully deleted shipment:', resolvedParams.id)

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete shipment' },
      { status: 500 }
    )
  }
}