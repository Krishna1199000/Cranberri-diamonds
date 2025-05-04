import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const db = new PrismaClient()

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Session required' },
        { status: 401 }
      )
    }
    
    let whereClause = {};
    if (session.role === 'admin') {
      // Admin sees all, whereClause remains empty {}
    } else if (session.role === 'employee') {
      if (!session.userId) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized - User ID missing in session' },
            { status: 401 }
        );
      }
      // Fetch the employee's name to filter by salesExecutive
      const currentUser = await db.user.findUnique({
          where: { id: session.userId as string },
          select: { name: true }
      });
      if (!currentUser || !currentUser.name) {
          // If user not found or has no name, they can see no shipments by this logic
          // Alternatively, could fall back to userId or throw an error
          console.warn(`Employee ${session.userId} has no name, cannot filter by salesExecutive.`);
          // Return empty list to prevent unauthorized access if name is crucial
           return NextResponse.json({ success: true, shipments: [] })
      }
      whereClause = { salesExecutive: currentUser.name };
    } else {
        // Other roles (e.g., customer) are unauthorized for this list view
         return NextResponse.json(
            { success: false, message: 'Unauthorized - Role not permitted' },
            { status: 403 }
        );
    }

    const shipments = await db.shipment.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json({ success: true, shipments })
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const {
      companyName,
      ownerName, // Add this line
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      postalCode,
      phoneNo,
      faxNo,
      email,
      website,
      paymentTerms,
      carrier,
      organizationType,
      businessType,
      businessRegNo,
      panNo,
      sellerPermitNo,
      cstTinNo,
      tradeBodyMembership,
      referenceType,
      referenceNotes,
      references,
      authorizedBy,
      accountManager,
      brokerName,
      partyGroup,
      salesExecutive,
      leadSource,
      limit
    } = body
    
    // Validate required fields
    if (!companyName || !ownerName || !addressLine1 || !country || !state || !city ||
      !postalCode || !phoneNo || !email || !paymentTerms || !carrier ||
      !authorizedBy || !accountManager || !partyGroup || !salesExecutive ||
      !leadSource || !limit) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create shipment with all fields
    const shipment = await db.shipment.create({
      data: {
        companyName,
        ownerName, // Add this line
        addressLine1,
        addressLine2,
        country,
        state,
        city,
        postalCode,
        phoneNo,
        faxNo,
        email,
        website,
        paymentTerms,
        carrier,
        organizationType,
        businessType,
        businessRegNo,
        panNo,
        sellerPermitNo,
        cstTinNo,
        tradeBodyMembership: tradeBodyMembership || [],
        referenceType,
        referenceNotes,
        references: references || [],
        authorizedBy,
        accountManager,
        brokerName,
        partyGroup,
        salesExecutive,
        leadSource,
        limit: typeof limit === 'string' ? parseFloat(limit) : limit,
        lastUpdatedBy: String(session.email),
        userId: String(session.userId)
      }
    })
    
    return NextResponse.json({ success: true, shipment })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create shipment' },
      { status: 500 }
    )
  }
}