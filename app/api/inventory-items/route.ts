import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, DiamondStatus, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// Define type for GET handler's where clause using Prisma types
interface InventoryItemWhereClause extends Prisma.InventoryItemWhereInput {
  // We can extend Prisma's type or redefine if needed
  status?: DiamondStatus | Prisma.EnumDiamondStatusFilter; // Use Enum
}

// GET handler to fetch InventoryItems
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; 
    const take = parseInt(searchParams.get("take") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: InventoryItemWhereClause = {}; 

    if (search) {
      // Keep OR clause as it was, assuming fields exist
      where.OR = [
        { stockId: { contains: search, mode: 'insensitive' } },
        { shape: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { clarity: { contains: search, mode: 'insensitive' } },
        { lab: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if status is a valid DiamondStatus enum value
    if (status && Object.values(DiamondStatus).includes(status as DiamondStatus)) { 
      where.status = status as DiamondStatus; // Cast to Enum
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where, // Use the typed where clause
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return NextResponse.json({
      items,
      total,
      pages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST handler to create InventoryItems
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Simplified validation based on InventoryItem essential fields
    const requiredFields = ['stockId', 'shape', 'size', 'color', 'clarity', 'polish', 'sym', 'lab', 'pricePerCarat', 'finalAmount', 'status'];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if stockId already exists in InventoryItem
    const existing = await prisma.inventoryItem.findUnique({
      where: { stockId: data.stockId }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Stock ID already exists in inventory items" },
        { status: 400 }
      );
    }

    // Create new InventoryItem
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        stockId: data.stockId,
        shape: data.shape,
        size: data.size ? parseFloat(data.size) : 0, // Default to 0 or handle error
        color: data.color,
        clarity: data.clarity,
        cut: data.cut || null,
        polish: data.polish,
        sym: data.sym,
        lab: data.lab,
        pricePerCarat: data.pricePerCarat ? parseFloat(data.pricePerCarat) : 0, // Default to 0 or handle error
        finalAmount: data.finalAmount ? parseFloat(data.finalAmount) : 0, // Default to 0 or handle error
        status: data.status,
        videoUrl: data.videoUrl || null,
        imageUrl: data.imageUrl || null,
        certUrl: data.certUrl || null,
      }
    });

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error("Error creating inventory item:", error instanceof Error ? error.message : error);
    const requestBody = await request.text().catch(() => 'Could not read body');
    console.error("Request Body:", requestBody); 
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
} 