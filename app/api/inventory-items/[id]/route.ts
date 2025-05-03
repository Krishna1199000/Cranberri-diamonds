import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// PUT handler to update an InventoryItem
export async function PUT(request: NextRequest,
    { params }: { params: Promise<{ id: string }> }) {
        const resolvedParams = await params;
  // Await body parsing before accessing params, just in case
  const data = await request.json();

  try {
    const session = await getSession();
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optional: Add validation for the incoming data here if needed
    // e.g., using zod similar to the POST route

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }
    
    // If changing status to HOLD or MEMO, require heldByShipmentId (similar logic to Diamond PUT route if exists)
    if ((data.status === 'HOLD' || data.status === 'MEMO') && !data.heldByShipmentId) {
      return NextResponse.json(
        { error: "Shipment information required for HOLD or MEMO status" },
        { status: 400 }
      );
    }

    // If changing status to AVAILABLE, clear heldByShipmentId
    const finalData = { ...data };
    if (finalData.status === 'AVAILABLE') {
      finalData.heldByShipmentId = null;
    }

    // Convert numeric fields, handling potential null/undefined from form
    finalData.size = finalData.size ? parseFloat(finalData.size) : null;
    finalData.pricePerCarat = finalData.pricePerCarat ? parseFloat(finalData.pricePerCarat) : null;
    finalData.finalAmount = finalData.finalAmount ? parseFloat(finalData.finalAmount) : null;
    
    // Check if the new stockId conflicts with another existing item
    if (finalData.stockId && finalData.stockId !== existingItem.stockId) {
        const conflict = await prisma.inventoryItem.findUnique({
            where: { stockId: finalData.stockId },
        });
        if (conflict) {
            return NextResponse.json(
                { error: "Stock ID already exists for another item." },
                { status: 400 }
            );
        }
    }

    // Update the InventoryItem
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: finalData,
    });

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error(`Error updating inventory item ${resolvedParams.id}:`, error instanceof Error ? error.message : error);
    const requestBody = await request.text().catch(() => 'Could not read body');
    console.error("Request Body:", requestBody);
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

    // Check if item exists before deleting (optional but good practice)
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingItem) {
      // Return success even if not found, as the end result is the item is gone
      // Or return 404 if you want to signal it wasn't found
      return NextResponse.json({ message: "Item already deleted or not found" }); 
    }

    // Delete the InventoryItem
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

// Optional: Add DELETE handler here if needed
// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { ... } 