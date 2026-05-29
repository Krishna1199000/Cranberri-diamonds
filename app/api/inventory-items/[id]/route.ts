import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, DiamondStatus } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET handler to fetch a single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | null = null;
  try {
    resolvedParams = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
      include: { heldByShipment: true }
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    const itemId = resolvedParams?.id || 'unknown';
    console.error(`Error fetching inventory item ${itemId}:`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT handler to update an InventoryItem
export async function PUT(request: NextRequest,
    { params }: { params: Promise<{ id: string }> }) {
        const resolvedParams = await params;
  const data = await request.json();

  try {
    const session = await getSession();
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }
    
    const updateData: Prisma.InventoryItemUpdateInput = {};

    if (data.stockId !== undefined) updateData.stockId = data.stockId;
    if (data.shape !== undefined) updateData.shape = data.shape;
    const parsedSize = data.size ? parseFloat(data.size) : NaN;
    if (data.size !== undefined) updateData.size = isNaN(parsedSize) ? undefined : parsedSize;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.clarity !== undefined) updateData.clarity = data.clarity;
    if (data.cut !== undefined) updateData.cut = data.cut;
    if (data.polish !== undefined) updateData.polish = data.polish;
    if (data.sym !== undefined) updateData.sym = data.sym;
    if (data.certificateNo !== undefined) updateData.certificateNo = data.certificateNo;
    if (data.lab !== undefined) updateData.lab = data.lab;
    const parsedPricePerCarat = data.pricePerCarat ? parseFloat(data.pricePerCarat) : NaN;
    if (data.pricePerCarat !== undefined) updateData.pricePerCarat = isNaN(parsedPricePerCarat) ? undefined : parsedPricePerCarat;
    const parsedFinalAmount = data.finalAmount ? parseFloat(data.finalAmount) : NaN;
    if (data.finalAmount !== undefined) updateData.finalAmount = isNaN(parsedFinalAmount) ? undefined : parsedFinalAmount;
    if (data.status !== undefined) updateData.status = data.status as DiamondStatus;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.certUrl !== undefined) updateData.certUrl = data.certUrl;
    if (data.measurement !== undefined) updateData.measurement = data.measurement;
    if (data.location !== undefined) updateData.location = data.location;
    const parsedRatio = data.ratio !== null && data.ratio !== undefined ? parseFloat(data.ratio) : NaN;
    if (data.ratio !== undefined) updateData.ratio = isNaN(parsedRatio) ? null : parsedRatio;
    const parsedTable = data.table !== null && data.table !== undefined ? parseFloat(data.table) : NaN;
    if (data.table !== undefined) updateData.table = isNaN(parsedTable) ? null : parsedTable;
    const parsedDepth = data.depth !== null && data.depth !== undefined ? parseFloat(data.depth) : NaN;
    if (data.depth !== undefined) updateData.depth = isNaN(parsedDepth) ? null : parsedDepth;
    if (data.growthType !== undefined) updateData.growthType = data.growthType;
    if (data.flourence !== undefined) updateData.flourence = data.flourence;
    const parsedGreenPricePerCarat = data.greenPricePerCarat !== null && data.greenPricePerCarat !== undefined ? parseFloat(data.greenPricePerCarat) : NaN;
    if (data.greenPricePerCarat !== undefined) updateData.greenPricePerCarat = isNaN(parsedGreenPricePerCarat) ? null : parsedGreenPricePerCarat;
    const parsedGreenPrice = data.greenPrice !== null && data.greenPrice !== undefined ? parseFloat(data.greenPrice) : NaN;
    if (data.greenPrice !== undefined) updateData.greenPrice = isNaN(parsedGreenPrice) ? null : parsedGreenPrice;
    const parsedRedPricePerCarat = data.redPricePerCarat !== null && data.redPricePerCarat !== undefined ? parseFloat(data.redPricePerCarat) : NaN;
    if (data.redPricePerCarat !== undefined) updateData.redPricePerCarat = isNaN(parsedRedPricePerCarat) ? null : parsedRedPricePerCarat;
    const parsedRedPrice = data.redPrice !== null && data.redPrice !== undefined ? parseFloat(data.redPrice) : NaN;
    if (data.redPrice !== undefined) updateData.redPrice = isNaN(parsedRedPrice) ? null : parsedRedPrice;

    if (data.stockId && data.stockId !== existingItem.stockId) {
        const conflict = await prisma.inventoryItem.findUnique({
            where: { stockId: data.stockId },
        });
        if (conflict) {
            return NextResponse.json(
                { error: "Stock ID already exists for another item." },
                { status: 400 }
            );
        }
    }

    if (data.status === DiamondStatus.AVAILABLE) {
      updateData.heldByShipment = { disconnect: true };
    } else if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO || data.status === DiamondStatus.SOLD)) {
      if (data.heldByShipmentId) {
        updateData.heldByShipment = { connect: { id: data.heldByShipmentId } };
      } else {
        updateData.heldByShipment = { disconnect: true }; 
      }
    }

    const effectiveAskingRaw =
      updateData.pricePerCarat !== undefined
        ? updateData.pricePerCarat
        : existingItem.pricePerCarat;
    const effectiveGreenRaw =
      updateData.greenPricePerCarat !== undefined
        ? updateData.greenPricePerCarat
        : existingItem.greenPricePerCarat;
    const effectiveRedRaw =
      updateData.redPricePerCarat !== undefined
        ? updateData.redPricePerCarat
        : existingItem.redPricePerCarat;
    const effectiveAsking = Number(effectiveAskingRaw);
    const effectiveGreen = Number(effectiveGreenRaw);
    const effectiveRed = Number(effectiveRedRaw);
    const effectiveSize =
      updateData.size !== undefined
        ? Number(updateData.size)
        : Number(existingItem.size);

    if (
      effectiveAskingRaw === null ||
      effectiveAskingRaw === undefined ||
      effectiveGreenRaw === null ||
      effectiveGreenRaw === undefined ||
      effectiveRedRaw === null ||
      effectiveRedRaw === undefined ||
      !Number.isFinite(effectiveAsking) ||
      !Number.isFinite(effectiveGreen) ||
      !Number.isFinite(effectiveRed)
    ) {
      return NextResponse.json(
        { error: "Asking, green and red price per carat are required for every stone" },
        { status: 400 }
      );
    }

    if (effectiveGreen > effectiveAsking) {
      return NextResponse.json(
        { error: "Green price per carat cannot be greater than asking price per carat" },
        { status: 400 }
      );
    }

    if (effectiveRed > effectiveGreen) {
      return NextResponse.json(
        { error: "Red price per carat cannot be greater than green price per carat" },
        { status: 400 }
      );
    }

    if (updateData.finalAmount === undefined) {
      updateData.finalAmount = Number((effectiveSize * effectiveAsking).toFixed(2));
    }
    if (updateData.greenPrice === undefined) {
      updateData.greenPrice = Number((effectiveSize * effectiveGreen).toFixed(2));
    }
    if (updateData.redPrice === undefined) {
      updateData.redPrice = Number((effectiveSize * effectiveRed).toFixed(2));
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
          heldByShipment: true 
      }
    });

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error(
        `Error updating inventory item ${resolvedParams.id}:`, 
        error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an InventoryItem
export async function DELETE(request: NextRequest,
    { params }: { params: Promise<{ id: string }> }) {
        const resolvedParams = await params;

  try {
    const session = await getSession();
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingItem) {
      return NextResponse.json({ message: "Item already deleted or not found" }); 
    }

    await prisma.inventoryItem.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: "Item deleted successfully" });

  } catch (error) {
    console.error(`Error deleting inventory item ${resolvedParams.id}:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}