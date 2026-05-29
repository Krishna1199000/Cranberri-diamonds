import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { sendEmail, createEmailTemplate, getLogoForEmail } from '@/lib/email';

const prisma = new PrismaClient();

// POST handler to request more information about a diamond
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | null = null;
  try {
    resolvedParams = await params;
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the current user details
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the inventory item details
    const item = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
      include: { heldByShipment: true }
    });

    if (!item) {
      return NextResponse.json(
        { error: "Diamond not found" },
        { status: 404 }
      );
    }

    // Prepare diamond description
    const diamondDescription = `${item.shape} ${item.size}ct ${item.color} ${item.clarity}${item.cut ? ` ${item.cut}` : ''}${item.lab ? ` (${item.lab})` : ''}`;
    const diamondDetails = `
      <strong>Stock ID:</strong> ${item.stockId}<br>
      <strong>Shape:</strong> ${item.shape}<br>
      <strong>Carat:</strong> ${item.size}<br>
      <strong>Color:</strong> ${item.color}<br>
      <strong>Clarity:</strong> ${item.clarity}<br>
      ${item.cut ? `<strong>Cut:</strong> ${item.cut}<br>` : ''}
      ${item.polish ? `<strong>Polish:</strong> ${item.polish}<br>` : ''}
      ${item.sym ? `<strong>Symmetry:</strong> ${item.sym}<br>` : ''}
      ${item.lab ? `<strong>Lab:</strong> ${item.lab}<br>` : ''}
      ${item.pricePerCarat ? `<strong>Price per Carat:</strong> $${item.pricePerCarat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>` : ''}
      ${item.finalAmount ? `<strong>Total Price:</strong> $${item.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>` : ''}
      ${item.location ? `<strong>Location:</strong> ${item.location}<br>` : ''}
      ${item.measurement ? `<strong>Measurement:</strong> ${item.measurement}<br>` : ''}
    `;

    // Get the base URL from request headers or environment
    const host = request.headers.get('host') || '';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const diamondUrl = `${baseUrl}/shop/search/results/${item.id}`;

    // 1. Send email to accounts@cranberridiamonds.in
    const adminEmailContent = `
      <p>Dear Team,</p>
      
      <p>A customer has requested more information about a diamond from our inventory.</p>
      
      <div class="highlight">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
      </div>
      
      <div class="highlight">
        <h3>Diamond Details</h3>
        ${diamondDetails}
        <p><strong>View Diamond:</strong> <a href="${diamondUrl}" target="_blank">${diamondUrl}</a></p>
      </div>
      
      <p>Please contact the customer at <a href="mailto:${user.email}">${user.email}</a> to provide more information about this diamond.</p>
      
      <p>Best regards,<br>
      <strong>Cranberri Diamonds System</strong></p>
    `;

    const adminEmailHtml = createEmailTemplate({
      logoUrl: getLogoForEmail(),
      title: 'New Diamond Information Request',
      content: adminEmailContent
    });

    await sendEmail({
      to: 'accounts@cranberridiamonds.in',
      subject: `Diamond Information Request - ${diamondDescription}`,
      html: adminEmailHtml
    });

    // 2. Create notifications for all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' }
    });

    if (adminUsers.length > 0) {
      const notificationData = adminUsers.map(admin => ({
        userId: admin.id,
        type: 'diamond_info_request',
        title: 'New Diamond Information Request',
        message: `${user.name} (${user.email}) has requested more information about ${diamondDescription}. Stock ID: ${item.stockId}`,
        read: false,
      }));

      await prisma.notification.createMany({
        data: notificationData
      });
    }

    // 3. Send confirmation email to the user
    const userEmailContent = `
      <p>Dear <strong>${user.name}</strong>,</p>
      
      <p>Thank you for your interest in our diamond collection!</p>
      
      <p>We have received your request for more information about the following diamond:</p>
      
      <div class="highlight">
        <h3>Diamond Details</h3>
        ${diamondDetails}
        <p><strong>View Diamond:</strong> <a href="${diamondUrl}" target="_blank">${diamondUrl}</a></p>
      </div>
      
      <p>Our team will contact you soon to provide detailed information about this diamond and answer any questions you may have.</p>
      
      <p>If you have any urgent inquiries, please feel free to contact us directly:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:accounts@cranberridiamonds.in">accounts@cranberridiamonds.in</a></li>
        <li><strong>Website:</strong> <a href="https://www.cranberridiamonds.in" target="_blank">www.cranberridiamonds.in</a></li>
      </ul>
      
      <p>We appreciate your interest in Cranberri Diamonds and look forward to assisting you.</p>
      
      <p>Best regards,<br>
      <strong>The Cranberri Diamonds Team</strong></p>
    `;

    const userEmailHtml = createEmailTemplate({
      logoUrl: getLogoForEmail(),
      title: 'Thank You for Your Diamond Inquiry',
      content: userEmailContent
    });

    await sendEmail({
      to: user.email,
      subject: `Thank You for Your Interest - ${diamondDescription}`,
      html: userEmailHtml
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Your request has been submitted successfully. Our team will contact you soon.' 
    });

  } catch (error) {
    const itemId = resolvedParams?.id || 'unknown';
    console.error(`Error processing information request for item ${itemId}:`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to process your request. Please try again later." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
