import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const db = new PrismaClient()

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If user is admin, return all shipments
    // If user is employee, return only their shipments
    const shipments = await db.shipment.findMany({
      where: session.role === 'admin' ? {} : {
        userId: String(session.userId)
      },
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
    // Validate required fields
    if (!companyName || !addressLine1 || !country || !state || !city ||
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