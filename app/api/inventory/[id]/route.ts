import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
  
    const diamond = await prisma.diamond.findUnique({
      where: { id: resolvedParams.id},
      // Ensure you include related data if needed by the component using this GET request
      // For example, if it needs shipment info for a "Diamond" model that has such a relation:
      // include: { heldByShipment: true }
    });
    
    if (!diamond) {
      return NextResponse.json(
        { error: "Diamond not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(diamond);
  } catch (error) {
    console.error("Error fetching diamond:", error);
    return NextResponse.json(
      { error: "Failed to fetch diamond" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Check if diamond exists
    const existing = await prisma.diamond.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: "Diamond not found" },
        { status: 404 }
      );
    }
    
    // Original updateData logic for prisma.diamond
    const updateData: Prisma.DiamondUpdateInput = { // Use Prisma.DiamondUpdateInput
        stockId: data.stockId,
        certificateNo: data.certificateNo,
        shape: data.shape,
        size: data.size ? parseFloat(data.size) : undefined,
        color: data.color,
        clarity: data.clarity,
        cut: data.cut,
        polish: data.polish,
        sym: data.sym,
        floro: data.floro,
        lab: data.lab,
        rapPrice: data.rapPrice ? parseFloat(data.rapPrice) : undefined,
        rapAmount: data.rapAmount ? parseFloat(data.rapAmount) : undefined,
        discount: data.discount ? parseFloat(data.discount) : undefined,
        pricePerCarat: data.pricePerCarat ? parseFloat(data.pricePerCarat) : undefined,
        finalAmount: data.finalAmount ? parseFloat(data.finalAmount) : undefined,
        measurement: data.measurement,
        length: data.length ? parseFloat(data.length) : undefined,
        width: data.width ? parseFloat(data.width) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        depth: data.depth ? parseFloat(data.depth) : undefined,
        table: data.table ? parseFloat(data.table) : undefined,
        ratio: data.ratio ? parseFloat(data.ratio) : undefined,
        status: data.status, // Assuming status on Diamond model is just a string
        comment: data.comment,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        certUrl: data.certUrl,
        girdle: data.girdle,
        culet: data.culet,
        cAngle: data.cAngle ? parseFloat(data.cAngle) : undefined,
        cHeight: data.cHeight ? parseFloat(data.cHeight) : undefined,
        pAngle: data.pAngle ? parseFloat(data.pAngle) : undefined,
        pDepth: data.pDepth ? parseFloat(data.pDepth) : undefined,
        fancyIntensity: data.fancyIntensity,
        fancyOvertone: data.fancyOvertone,
        fancyColor: data.fancyColor,
        location: data.location,
        inscription: data.inscription,
        // If the 'Diamond' model in schema.prisma has a heldByShipmentId or similar field for linking,
        // you would handle it here. For example:
        // heldByShipmentId: data.heldByShipmentId, // or null if unlinking
    };
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const diamond = await prisma.diamond.update({
      where: { id: resolvedParams.id },
      data: updateData,
      // If you need to return the updated related shipment data with the diamond:
      // include: { heldByShipment: true }
    });
    
    return NextResponse.json(diamond);
  } catch (error) {
    console.error("Error updating diamond:", error);
    return NextResponse.json(
      { error: "Failed to update diamond" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || (session as { role?: string })?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const existing = await prisma.diamond.findUnique({
      where: {  id: resolvedParams.id }
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: "Diamond not found" },
        { status: 404 }
      );
    }
    
    await prisma.diamond.delete({
      where: {  id: resolvedParams.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting diamond:", error);
    return NextResponse.json(
      { error: "Failed to delete diamond" },
      { status: 500 }
    );
  }
}