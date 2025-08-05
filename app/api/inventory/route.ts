import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, DiamondStatus, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';
const prisma = new PrismaClient();

// Define a more specific type for the where clause
interface InventoryItemWhereClause {
  OR?: { [key: string]: { contains: string; mode: 'insensitive' } }[];
  status?: DiamondStatus; // Use DiamondStatus enum type
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status")?.toUpperCase() || ""; // Get status and convert to uppercase
    const take = parseInt(searchParams.get("take") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");
    
    const where: InventoryItemWhereClause = {}; 
    
    if (search) {
      // Adjust search fields based on InventoryItem model
      // certificateNo is not on InventoryItem, remove or handle differently
      where.OR = [
        { stockId: { contains: search, mode: 'insensitive' } },
        // { certificateNo: { contains: search, mode: 'insensitive' } }, // certificateNo is not in InventoryItem model
        { shape: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { clarity: { contains: search, mode: 'insensitive' } },
        { lab: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Validate and assign status if it's a valid DiamondStatus enum member
    if (statusParam && Object.values(DiamondStatus).includes(statusParam as DiamondStatus)) { 
      where.status = statusParam as DiamondStatus;
    }
    
    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' }, // Ensure InventoryItem has createdAt
      include: { 
        heldByShipment: true
      }
    });

    const total = await prisma.inventoryItem.count({ where });
    
    // Remove sensitive logging in production
    if (process.env.NODE_ENV === 'development') {
      console.log("Fetched inventory items in API route (first 5):", JSON.stringify(inventoryItems.slice(0, 5), null, 2));
    }

    return NextResponse.json({ 
      diamonds: inventoryItems, // Keep 'diamonds' key for frontend compatibility for now, or update frontend
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
    
    // Required fields for InventoryItem (adjust based on your InventoryItem model in schema.prisma)
    const requiredFields = [
      'stockId', 'shape', 'size', 'color', 'clarity', 
      'polish', 'sym', 'lab', 'pricePerCarat', 'status' // Removed fields not in InventoryItem, ensure all essential fields are listed
    ];
                           
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') { 
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const sizeValue = parseFloat(data.size);
    const pricePerCaratValue = parseFloat(data.pricePerCarat);

    if (isNaN(sizeValue) || isNaN(pricePerCaratValue)) {
      return NextResponse.json(
        { error: "Invalid 'size' or 'pricePerCarat'. Must be valid numbers." },
        { status: 400 }
      );
    }
    // Consider adding checks for positive values if necessary, e.g.:
    // if (sizeValue <= 0 || pricePerCaratValue <= 0) {
    //   return NextResponse.json(
    //     { error: "'size' and 'pricePerCarat' must be positive numbers." },
    //     { status: 400 }
    //   );
    // }

    const existing = await prisma.inventoryItem.findUnique({
      where: { stockId: data.stockId }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Stock ID already exists" },
        { status: 400 }
      );
    }
    
    // Prepare data for InventoryItem creation
    const inventoryItemData: Prisma.InventoryItemCreateInput = {
        stockId: data.stockId,
        shape: data.shape,
        size: sizeValue, 
        color: data.color,
        clarity: data.clarity,
        cut: data.cut || null,
        polish: data.polish,
        sym: data.sym,
        lab: data.lab,
        pricePerCarat: pricePerCaratValue,
        finalAmount: data.finalAmount, // Assuming finalAmount is sent from client or calculated before
        status: data.status as DiamondStatus, // Ensure status is of DiamondStatus enum type
        videoUrl: data.videoUrl || null,
        imageUrl: data.imageUrl || null,
        certUrl: data.certUrl || null,
        measurement: data.measurement || null,
        location: data.location || null,
    };

    // If status is HOLD or MEMO, expect heldByShipmentId from the client
    if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO) && data.heldByShipmentId) {
        inventoryItemData.heldByShipment = {
            connect: { id: data.heldByShipmentId }
        };
    } else if (data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO) {
        // If status is HOLD/MEMO but no heldByShipmentId, it might be an error or optional
        // For now, we won't set it if not provided. 
        // Prisma will set heldByShipmentId to null if the foreign key field itself is optional and no connect is provided.
        // Consider returning an error if linking to a shipment is mandatory for these statuses.
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: inventoryItemData
    });
    
    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}