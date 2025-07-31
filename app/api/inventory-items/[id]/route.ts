import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, DiamondStatus } from '@prisma/client';
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
    
    // Build updateData carefully
    const updateData: Prisma.InventoryItemUpdateInput = {};

    // Map scalar fields if they exist in the request data
    if (data.stockId !== undefined) updateData.stockId = data.stockId;
    if (data.shape !== undefined) updateData.shape = data.shape;
    // Handle numeric fields: set to undefined if null/invalid to avoid sending null to Prisma update
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
    if (data.status !== undefined) updateData.status = data.status as DiamondStatus; // Cast to enum
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.certUrl !== undefined) updateData.certUrl = data.certUrl;
    if (data.measurement !== undefined) updateData.measurement = data.measurement;
    if (data.location !== undefined) updateData.location = data.location;

    // Check for stockId conflict only if a new, different stockId is provided
    if (data.stockId && data.stockId !== existingItem.stockId) {
        const conflict = await prisma.inventoryItem.findUnique({
            where: { stockId: data.stockId }, // Use data.stockId for the check
        });
        if (conflict) {
            return NextResponse.json(
                { error: "Stock ID already exists for another item." },
                { status: 400 }
            );
        }
        // If no conflict, updateData.stockId is already set above
    }

    // Handle heldByShipment relation based on status and presence of heldByShipmentId
    if (data.status === DiamondStatus.AVAILABLE) {
      // If status is AVAILABLE, always disconnect
      updateData.heldByShipment = { disconnect: true };
    } else if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO)) {
      if (data.heldByShipmentId) {
        // If status is HOLD/MEMO and an ID is provided, connect
        updateData.heldByShipment = { connect: { id: data.heldByShipmentId } };
      } else {
        // If status is HOLD/MEMO but *no* ID is provided, disconnect (or maybe return error)
        // Disconnecting seems safer than potentially leaving an old link 
        updateData.heldByShipment = { disconnect: true }; 
        // Alternative: return error if ID is mandatory for HOLD/MEMO
        // return NextResponse.json({ error: "Shipment ID required for HOLD/MEMO status" }, { status: 400 });
      }
    }
    // If status is not changing or not one of the above, the relation is left untouched unless specified

    // Update the InventoryItem
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: { // Include the relation in the response 
          heldByShipment: true 
      }
    });

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error(
        `Error updating inventory item ${resolvedParams.id}:`, 
        error instanceof Error ? error.message : String(error)
    );
    // Avoid trying to read body again in catch block if parsing failed initially
    // const requestBody = await request.text().catch(() => 'Could not read body');
    // console.error("Request Body:", requestBody);
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