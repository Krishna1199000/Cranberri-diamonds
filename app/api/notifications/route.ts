import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET: Fetch notifications for the logged-in user
export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            companyName: true,
            totalAmount: true,
          }
        }
      }
    });

    // If no notifications exist, create 3 dummy notifications for demo purposes
    if (notifications.length === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId,
            type: 'payment_reminder',
            title: 'Payment Reminder',
            message: 'Payment reminder for invoice CD-0095A from ABC Diamonds Ltd. Amount: ₹2,50,000.00',
            read: false,
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
          {
            userId,
            type: 'system',
            title: 'New Order Received',
            message: 'New diamond order received from XYZ Jewelers. Order value: ₹1,85,000.00. Please review and process.',
            read: false,
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          },
          {
            userId,
            type: 'payment_reminder',
            title: 'Overdue Payment Alert',
            message: 'Payment overdue for invoice CD-0092B from Diamond Enterprises. Amount: ₹3,25,500.00. Please follow up immediately.',
            read: false,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          }
        ]
      });

      // Fetch the newly created notifications
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNo: true,
              companyName: true,
              totalAmount: true,
            }
          }
        }
      });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Update the notification to mark as read
    const updatedNotification = await prisma.notification.update({
      where: { 
        id: notificationId,
        userId // Ensure user can only mark their own notifications as read
      },
      data: { read: true }
    });

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Error updating notification:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 

// DELETE: Delete notification (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;
    const userRole = session?.role as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only allow admins to delete notifications
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete notifications' }, { status: 403 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 