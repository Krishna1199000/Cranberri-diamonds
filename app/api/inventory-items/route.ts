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
    const idsParam = searchParams.get("ids");
    
    // Advanced filters
    const carat = searchParams.get("carat") || "";
    const colors = searchParams.get("colors") || "";
    const clarities = searchParams.get("clarities") || "";
    const shapes = searchParams.get("shapes") || "";
    const sortBy = searchParams.get("sortBy") || "";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: InventoryItemWhereClause = {}; 

    if (search) {
      // Keep OR clause as it was, assuming fields exist
      where.OR = [
        { stockId: { contains: search, mode: 'insensitive' } },
        { shape: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { clarity: { contains: search, mode: 'insensitive' } },
        { lab: { contains: search, mode: 'insensitive' } },
        { certificateNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if status is a valid DiamondStatus enum value
    if (status && Object.values(DiamondStatus).includes(status as DiamondStatus)) { 
      where.status = status as DiamondStatus; // Cast to Enum
    }

    // Advanced filters
    if (carat) {
      const caratValue = parseFloat(carat);
      // Use exact match for decimal carat values
      where.size = caratValue;
    }

    if (colors) {
      const colorArray = colors.split(',').map(c => c.trim()).filter(Boolean);
      if (colorArray.length > 0) {
        where.color = { in: colorArray };
      }
    }

    if (clarities) {
      const clarityArray = clarities.split(',').map(c => c.trim()).filter(Boolean);
      if (clarityArray.length > 0) {
        where.clarity = { in: clarityArray };
      }
    }

    if (shapes) {
      const shapeArray = shapes.split(',').map(s => s.trim()).filter(Boolean);
      if (shapeArray.length > 0) {
        where.shape = { in: shapeArray };
      }
    }

    // If a list of IDs is provided, fetch exactly those (used for CSV export across pages)
    // Skip deduplication for CSV export as we want the exact items selected
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      const items = await prisma.inventoryItem.findMany({
        where: { id: { in: ids }, ...where },
        orderBy: { createdAt: 'desc' },
        include: { heldByShipment: true }
      });
      return NextResponse.json({ items, total: items.length, pages: 1 });
    }

    // Build orderBy clause
    if (sortBy) {
      const validSortFields = ['size', 'color', 'clarity', 'shape', 'pricePerCarat', 'finalAmount', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        // Sorting is applied after deduplication below.
      }
    }

    // Fetch all items matching the filter (we'll deduplicate after)
    const allItems = await prisma.inventoryItem.findMany({
      where, // Use the typed where clause
      orderBy: { createdAt: 'desc' }, // Always sort by createdAt desc first to get latest
      include: {
        heldByShipment: true
      }
    });

    // Helper function to normalize Stock ID for comparison (handles CDS-001 vs CDS-01 vs CDS-1)
    const normalizeStockId = (stockId: string): string => {
      if (!stockId) return '';
      // Convert to uppercase and remove extra spaces
      let normalized = stockId.toUpperCase().trim();
      // Try to normalize number patterns (e.g., CDS-001 -> CDS-1, CDS-01 -> CDS-1)
      // Match pattern like "CDS-001" or "CDS-01" and normalize to "CDS-1"
      normalized = normalized.replace(/-0+(\d+)$/, '-$1'); // Remove leading zeros after dash
      return normalized;
    };

    // Deduplicate by normalized Stock ID - keep only the latest (already sorted by createdAt desc)
    const stockIdMap = new Map<string, typeof allItems[0]>();
    for (const item of allItems) {
      const normalizedId = normalizeStockId(item.stockId);
      // If we haven't seen this normalized ID, or this one is newer, keep it
      if (!stockIdMap.has(normalizedId)) {
        stockIdMap.set(normalizedId, item);
      } else {
        const existing = stockIdMap.get(normalizedId)!;
        // Compare by createdAt to ensure we keep the latest
        if (new Date(item.createdAt) > new Date(existing.createdAt)) {
          stockIdMap.set(normalizedId, item);
        }
      }
    }

    // Convert map values back to array
    const deduplicatedItems = Array.from(stockIdMap.values());

    // Apply the requested sorting (if sortBy was specified, re-sort the deduplicated items)
    if (sortBy && sortBy !== 'createdAt') {
      const validSortFields = ['size', 'color', 'clarity', 'shape', 'pricePerCarat', 'finalAmount', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        deduplicatedItems.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
          }
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return 0;
        });
      }
    } else if (!sortBy || sortBy === 'createdAt') {
      // Keep createdAt desc order (latest first)
      deduplicatedItems.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Apply pagination after deduplication
    const total = deduplicatedItems.length;
    const paginatedItems = deduplicatedItems.slice(skip, skip + take);
    
    // Remove sensitive logging in production
    if (process.env.NODE_ENV === 'development') {
      console.log("Fetched inventory items in /api/inventory-items (first 5):", JSON.stringify(paginatedItems.slice(0, 5), null, 2));
    }

    return NextResponse.json({
      items: paginatedItems,
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
    const requiredFields = ['stockId', 'shape', 'size', 'color', 'clarity', 'polish', 'sym', 'lab', 'pricePerCarat', 'greenPricePerCarat', 'redPricePerCarat', 'status'];

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

    const size = data.size ? parseFloat(data.size) : 0;
    const askingPricePerCarat = data.pricePerCarat ? parseFloat(data.pricePerCarat) : 0;
    const greenPricePerCarat = data.greenPricePerCarat ? parseFloat(data.greenPricePerCarat) : 0;
    const redPricePerCarat = data.redPricePerCarat ? parseFloat(data.redPricePerCarat) : 0;

    if (greenPricePerCarat > askingPricePerCarat) {
      return NextResponse.json(
        { error: "Green price per carat cannot be greater than asking price per carat" },
        { status: 400 }
      );
    }

    if (redPricePerCarat > greenPricePerCarat) {
      return NextResponse.json(
        { error: "Red price per carat cannot be greater than green price per carat" },
        { status: 400 }
      );
    }

    const finalAmount = data.finalAmount ? parseFloat(data.finalAmount) : (size * askingPricePerCarat);
    const greenPrice = data.greenPrice ? parseFloat(data.greenPrice) : (size * greenPricePerCarat);
    const redPrice = data.redPrice ? parseFloat(data.redPrice) : (size * redPricePerCarat);

    // Create new InventoryItem data object
    const inventoryItemCreateData: Prisma.InventoryItemCreateInput = {
      stockId: data.stockId,
      shape: data.shape,
      size,
      color: data.color,
      clarity: data.clarity,
      cut: data.cut || null,
      polish: data.polish,
      sym: data.sym,
      lab: data.lab,
      certificateNo: data.certificateNo || null,
      pricePerCarat: askingPricePerCarat,
      finalAmount,
      greenPricePerCarat,
      greenPrice,
      redPricePerCarat,
      redPrice,
      status: data.status,
      videoUrl: data.videoUrl || null,
      imageUrl: data.imageUrl || null,
      certUrl: data.certUrl || null,
    };
    
    // Add shipment linking logic if status is HOLD, MEMO, or SOLD and ID is provided
    if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO || data.status === DiamondStatus.SOLD) && data.heldByShipmentId) {
      inventoryItemCreateData.heldByShipment = {
        connect: { id: data.heldByShipmentId }
      };
    }
    // Optional: Add error handling if HOLD/MEMO/SOLD status but no heldByShipmentId provided
    else if (data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO || data.status === DiamondStatus.SOLD) {
        // console.warn("Creating item with HOLD/MEMO/SOLD status without heldByShipmentId.");
        // Can choose to return an error:
        // return NextResponse.json({ error: "heldByShipmentId is required for HOLD/MEMO/SOLD status" }, { status: 400 });
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