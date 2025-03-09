import { PrismaClient, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const searchParams = await request.json()
    console.log('Search parameters:', searchParams)
    
    // Build the where clause based on search parameters
    const where: Prisma.DiamondWhereInput = {}
    
    if (searchParams.shapes?.length > 0) {
      where.shape = { in: searchParams.shapes.map((s: string) => s.toUpperCase()) }
    }
    
    if (searchParams.caratRange?.from || searchParams.caratRange?.to) {
      where.size = {}
      if (searchParams.caratRange.from) {
        where.size.gte = parseFloat(searchParams.caratRange.from)
      }
      if (searchParams.caratRange.to) {
        where.size.lte = parseFloat(searchParams.caratRange.to)
      }
    }
    
    if (searchParams.stoneId) {
      where.OR = [
        { stockId: { contains: searchParams.stoneId, mode: 'insensitive' } },
        { certificateNo: { contains: searchParams.stoneId, mode: 'insensitive' } }
      ]
    }
    
    if (searchParams.colors?.length > 0) {
      where.color = { in: searchParams.colors }
    }
    
    if (searchParams.clarities?.length > 0) {
      where.clarity = { in: searchParams.clarities }
    }
    
    if (searchParams.cuts?.length > 0) {
      where.cut = { in: searchParams.cuts }
    }
    
    if (searchParams.labs?.length > 0) {
      where.lab = { in: searchParams.labs }
    }
    
    if (searchParams.polishes?.length > 0) {
      where.polish = { in: searchParams.polishes }
    }
    
    if (searchParams.symmetries?.length > 0) {
      where.sym = { in: searchParams.symmetries }
    }
    
    if (searchParams.fluorescence?.length > 0) {
      where.floro = { in: searchParams.fluorescence }
    }
    
    if (searchParams.locations?.length > 0) {
      where.location = { in: searchParams.locations }
    }
    
    if (searchParams.priceRange?.from || searchParams.priceRange?.to) {
      where.pricePerCarat = {}
      if (searchParams.priceRange.from) {
        where.pricePerCarat.gte = parseFloat(searchParams.priceRange.from)
      }
      if (searchParams.priceRange.to) {
        where.pricePerCarat.lte = parseFloat(searchParams.priceRange.to)
      }
    }

    console.log('Final where clause:', where)

    // Add some test data if the database is empty
    const count = await prisma.diamond.count()
    if (count === 0) {
      await prisma.diamond.createMany({
        data: [
          {
            stockId: "TR001",
            certificateNo: "IGI123456",
            shape: "TRIANGLE",
            size: 1.5,
            color: "D",
            clarity: "VS1",
            cut: "EX",
            polish: "EX",
            sym: "EX",
            floro: "NON",
            lab: "IGI",
            rapPrice: 10000,
            rapAmount: 15000,
            discount: 10,
            pricePerCarat: 9000,
            finalAmount: 13500,
            measurement: "7.5x7.5x4.5",
            depth: 61.5,
            table: 58,
            ratio: 1.33,
            location: "NY",
            status: "AVAILABLE"
          },
          {
            stockId: "TR002",
            certificateNo: "IGI123457",
            shape: "TRIANGLE",
            size: 2.0,
            color: "E",
            clarity: "VVS2",
            cut: "VG",
            polish: "EX",
            sym: "VG",
            floro: "FNT",
            lab: "IGI",
            rapPrice: 12000,
            rapAmount: 24000,
            discount: 12,
            pricePerCarat: 10560,
            finalAmount: 21120,
            measurement: "8.2x8.2x5.0",
            depth: 62.0,
            table: 59,
            ratio: 1.34,
            location: "NY",
            status: "AVAILABLE"
          }
        ]
      })
    }

    const diamonds = await prisma.diamond.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Found ${diamonds.length} diamonds`)
    return NextResponse.json({ diamonds })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to search diamonds' }, { status: 500 })
  }
}