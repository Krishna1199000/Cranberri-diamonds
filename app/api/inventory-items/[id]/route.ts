import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, DiamondStatus } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET handler to fetch a single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
    console.error(`Error fetching inventory item ${params}:`, error);
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