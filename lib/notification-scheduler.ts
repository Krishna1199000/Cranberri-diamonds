import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createPaymentReminderNotification(invoiceId: string, userId: string) {
  try {
    // Get the invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        invoiceNo: true,
        companyName: true,
        totalAmount: true,
        createdAt: true,
        dueDate: true,
      }
    });

    if (!invoice) {
      console.error(`Invoice with ID ${invoiceId} not found`);
      return;
    }

    // Calculate reminder date (15 days after invoice creation)
    const reminderDate = new Date(invoice.createdAt);
    reminderDate.setDate(reminderDate.getDate() + 15);

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: `Payment reminder for invoice ${invoice.invoiceNo} from ${invoice.companyName}. Amount: ₹${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        invoiceId,
        dueDate: reminderDate,
        read: false,
      }
    });

    console.log(`Payment reminder notification created for invoice ${invoice.invoiceNo}`);
    return notification;
  } catch (error) {
    console.error('Error creating payment reminder notification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to check and show due notifications
export async function getDueNotifications(userId: string) {
  try {
    const now = new Date();
    
    const dueNotifications = await prisma.notification.findMany({
      where: {
        userId,
        dueDate: {
          lte: now // Due date is less than or equal to now
        },
        read: false
      },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            companyName: true,
            totalAmount: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return dueNotifications;
  } catch (error) {
    console.error('Error fetching due notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 