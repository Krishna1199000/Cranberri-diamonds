import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
const prisma = new PrismaClient();

// Define a more specific type for the where clause
interface DiamondWhereClause {
  OR?: { [key: string]: { contains: string; mode: 'insensitive' } }[];
  status?: string; // status is String in the reverted Diamond model
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const take = parseInt(searchParams.get("take") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");
    
    const where: DiamondWhereClause = {}; // Use defined type
    
    if (search) {
      where.OR = [
        { stockId: { contains: search, mode: 'insensitive' } },
        { certificateNo: { contains: search, mode: 'insensitive' } },
        { shape: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { clarity: { contains: search, mode: 'insensitive' } },
        { lab: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) { 
      where.status = status;
    }
    
    const [diamonds, total] = await Promise.all([
      prisma.diamond.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diamond.count({ where })
    ]);
    
    return NextResponse.json({ 
      diamonds, 
      total,
      pages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || (session as {role?: string})?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    const requiredFields = [
      'stockId', 'certificateNo', 'shape', 'size', 'color', 'clarity', 
      'polish', 'sym', 'floro', 'lab', 'rapPrice', 'rapAmount', 
      'discount', 'pricePerCarat', 'finalAmount', 'measurement', 'status'
    ];
                           
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') { 
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const existing = await prisma.diamond.findUnique({
      where: { stockId: data.stockId }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Stock ID already exists" },
        { status: 400 }
      );
    }
    
    const diamond = await prisma.diamond.create({
      data: {
        stockId: data.stockId,
        certificateNo: data.certificateNo,
        shape: data.shape,
        size: parseFloat(data.size),
        color: data.color,
        clarity: data.clarity,
        cut: data.cut || null,
        polish: data.polish,
        sym: data.sym,
        floro: data.floro,
        lab: data.lab,
        rapPrice: parseFloat(data.rapPrice),
        rapAmount: parseFloat(data.rapAmount),
        discount: parseFloat(data.discount),
        pricePerCarat: parseFloat(data.pricePerCarat),
        finalAmount: parseFloat(data.finalAmount),
        measurement: data.measurement, 
        length: data.length ? parseFloat(data.length) : null,
        width: data.width ? parseFloat(data.width) : null,
        height: data.height ? parseFloat(data.height) : null,
        depth: data.depth ? parseFloat(data.depth) : null,
        table: data.table ? parseFloat(data.table) : null,
        ratio: data.ratio ? parseFloat(data.ratio) : null,
        status: data.status,
        comment: data.comment || null,
        videoUrl: data.videoUrl || null,
        imageUrl: data.imageUrl || null,
        certUrl: data.certUrl || null,
        girdle: data.girdle || null,
        culet: data.culet || null,
        cAngle: data.cAngle ? parseFloat(data.cAngle) : null,
        cHeight: data.cHeight ? parseFloat(data.cHeight) : null,
        pAngle: data.pAngle ? parseFloat(data.pAngle) : null,
        pDepth: data.pDepth ? parseFloat(data.pDepth) : null,
        fancyIntensity: data.fancyIntensity || null,
        fancyOvertone: data.fancyOvertone || null,
        fancyColor: data.fancyColor || null,
        location: data.location || null,
        inscription: data.inscription || null,
      }
    });
    
    return NextResponse.json(diamond);
  } catch (error) {
    console.error("Error creating diamond item:", error);
    return NextResponse.json(
      { error: "Failed to create diamond item" },
      { status: 500 }
    );
  }
}