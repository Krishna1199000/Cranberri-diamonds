import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    const price = await prisma.parcelGoods.update({
      where: {
        id: params.id
      },
      data: {
        sieve: data.sieve,
        price: parseFloat(data.price)
      }
    });

    return NextResponse.json({ success: true, price });
  } catch (error) {
    console.error('Error updating parcel goods price:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update price' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.parcelGoods.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting parcel goods price:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete price' },
      { status: 500 }
    );
  }
}