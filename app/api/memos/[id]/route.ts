import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { memoFormSchema, MemoItem as ImportedMemoItem } from '@/lib/validators/memo';
import { numberToWords } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Updated signature
) {
    try {
        const resolvedParams = await params; // Await the params
        const session = await getSession();

        // Basic auth check
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const memo = await prisma.memo.findUnique({
            where: { 
                id: resolvedParams.id // Use resolvedParams.id
            },
            include: { 
                items: true, // Include memo items
                shipment: true // Include shipment details if needed for display
            }
        });

        if (!memo) {
            return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
        }
        
        // ---> Authorization: Check if user can view this memo <--- (Implement based on your logic)
        // Example: Allow admin OR if the memo's associated user matches (if you add a userId to Memo)
        // if (session.role !== 'admin' && memo.userId !== session.userId) { 
        //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }
        // For now, assuming any authenticated user can view any memo until specific logic is added
        // --------------------------------------------------------

        return NextResponse.json({ memo });

    } catch (error) {
        console.error("Error fetching memo:", error);
        return NextResponse.json({ error: 'Failed to fetch memo' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Updated signature
) {
    try {
        const resolvedParams = await params; // Await the params
        const session = await getSession();

        // Check if user is admin
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only admins can update memos' }, { status: 403 });
        }

        const body = await request.json();

        // Validate incoming data using the memo schema
        // Need to parse dates manually if they come as strings
        const parsedBody = {
            ...body,
            date: body.date ? new Date(body.date) : undefined,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        };

        const validation = memoFormSchema.safeParse(parsedBody);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
        }

        const validatedData = validation.data;

        // --- Fetch existing memo to ensure it exists ---
        const existingMemo = await prisma.memo.findUnique({
            where: { id: resolvedParams.id }, // Use resolvedParams.id
        });

        if (!existingMemo) {
            return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
        }
        // --------------------------------------------

        // Calculate totals and amount in words based on validated items
        const subtotal = validatedData.items.reduce((total, item) => {
            return total + (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0);
        }, 0);
        const totalAmount = subtotal - (Number(validatedData.discount) || 0) - (Number(validatedData.crPayment) || 0) + (Number(validatedData.shipmentCost) || 0);
        const amountInWords = numberToWords(totalAmount);

        // Prepare data for update
        const memoUpdateData = {
            ...validatedData,
            totalAmount: totalAmount,
            amountInWords: amountInWords,
            userId: existingMemo.userId, // Preserve original user ID
            // memoNo: existingMemo.memoNo, // Preserve original memo number
            // Ensure memoNo is handled correctly - it shouldn't change on update typically
            memoNo: validatedData.memoNo || existingMemo.memoNo, // Prefer existing if not provided
            items: undefined, // Handled separately below
        };

        const updatedMemo = await prisma.$transaction(async (tx) => {
            // 1. Delete existing items for this memo
            await tx.memoItem.deleteMany({ 
                where: { memoId: resolvedParams.id } // Use resolvedParams.id
            });

            // 2. Create new items from the validated data
            await tx.memoItem.createMany({
                data: validatedData.items.map((item: ImportedMemoItem) => ({
                    ...item,
                    memoId: resolvedParams.id, // Use resolvedParams.id
                    id: undefined, // Let Prisma generate IDs for new items
                    total: (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0), // Calculate item total
                })),
            });

            // 3. Update the memo itself
            const memo = await tx.memo.update({
                where: { id: resolvedParams.id }, // Use resolvedParams.id
                data: memoUpdateData,
                include: { items: true }, // Include items in the response
            });

            return memo;
        });

        return NextResponse.json({ memo: updatedMemo });

    } catch (error) {
        console.error("Error updating memo:", error);
        // Provide more context in error response if possible
        const errorMessage = error instanceof Error ? error.message : 'Failed to update memo';
        return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Updated signature
) {
    try {
        const resolvedParams = await params; // Await the params
        const session = await getSession();

        // Check if user is admin
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only admins can delete memos' }, { status: 403 });
        }

        // --- Fetch existing memo to ensure it exists before deleting ---
        const existingMemo = await prisma.memo.findUnique({
            where: { id: resolvedParams.id }, // Use resolvedParams.id
        });

        if (!existingMemo) {
            return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
        }
        // --------------------------------------------------------------

        // Use transaction to delete memo and its items
        await prisma.$transaction(async (tx) => {
            // Delete related items first due to relation
            await tx.memoItem.deleteMany({ 
                where: { memoId: resolvedParams.id } // Use resolvedParams.id
            });
            // Then delete the memo
            await tx.memo.delete({ 
                where: { id: resolvedParams.id } // Use resolvedParams.id
            });
        });

        return NextResponse.json({ message: 'Memo deleted successfully' });

    } catch (error) {
        console.error("Error deleting memo:", error);
        return NextResponse.json({ error: 'Failed to delete memo' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 