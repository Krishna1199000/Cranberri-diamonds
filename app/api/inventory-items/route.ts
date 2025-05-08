import { NextRequest, NextResponse } from "next/server";
import { getSession } from '@/lib/session';
import { PrismaClient, DiamondStatus, Prisma } from '@prisma/client';

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
        include: {
          heldByShipment: true
        }
      }),
      prisma.inventoryItem.count({ where })
    ]);
    
    // Add console log to verify data fetched by *this* route
    console.log("Fetched inventory items in /api/inventory-items (first 5):", JSON.stringify(items.slice(0, 5), null, 2));

    return NextResponse.json({
      items,
      total,
      pages: Math.ceil(total / take)
    });
  } catch (error) {
    // Safer error logging
    console.error(
      "Error fetching inventory items:", 
      error instanceof Error ? error.message : String(error)
    );
    // Optionally log the full error structure if it helps debugging, but handle non-objects
    // console.error("Full error structure:", JSON.stringify(error, null, 2));
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

    // Create new InventoryItem data object
    const inventoryItemCreateData: Prisma.InventoryItemCreateInput = {
      stockId: data.stockId,
      shape: data.shape,
      size: data.size ? parseFloat(data.size) : 0,
      color: data.color,
      clarity: data.clarity,
      cut: data.cut || null,
      polish: data.polish,
      sym: data.sym,
      lab: data.lab,
      pricePerCarat: data.pricePerCarat ? parseFloat(data.pricePerCarat) : 0,
      finalAmount: data.finalAmount ? parseFloat(data.finalAmount) : 0,
      status: data.status,
      videoUrl: data.videoUrl || null,
      imageUrl: data.imageUrl || null,
      certUrl: data.certUrl || null,
    };
    
    // Add shipment linking logic if status is HOLD or MEMO and ID is provided
    if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO) && data.heldByShipmentId) {
      inventoryItemCreateData.heldByShipment = {
        connect: { id: data.heldByShipmentId }
      };
    }
    // Optional: Add error handling if HOLD/MEMO status but no heldByShipmentId provided
    else if (data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO) {
        // console.warn("Creating item with HOLD/MEMO status without heldByShipmentId.");
        // Can choose to return an error:
        // return NextResponse.json({ error: "heldByShipmentId is required for HOLD/MEMO status" }, { status: 400 });
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: inventoryItemCreateData
    });

    return NextResponse.json(inventoryItem);
  } catch (error) {
    // Safer error logging
    console.error(
      "Error creating inventory item:", 
       error instanceof Error ? error.message : String(error)
    );
    const requestBody = await request.text().catch(() => 'Could not read body');
    console.error("Request Body:", requestBody); 
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
} 