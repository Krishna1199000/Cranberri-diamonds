import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail, getLogoForEmail, createEmailTemplate } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }

        // Get logo URL for email
        const logoUrl = getLogoForEmail();

        // 1. Send confirmation email to customer
        const customerContent = `
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Thank you for reaching out to Cranberri Diamonds! We have received your message and our team will respond to you shortly.</p>
            
            <div class="highlight">
                <h3>Your Message</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>We appreciate your interest in our premium diamond collection and look forward to assisting you with your needs.</p>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Our team will review your message carefully</li>
                <li>We'll respond within 24 hours</li>
                <li>Feel free to browse our collection while you wait</li>
            </ul>
            
            <p>If you have any urgent questions, please don't hesitate to call us or visit our showroom.</p>
            
            <p>Best regards,<br>
            <strong>The Cranberri Diamonds Team</strong></p>
        `;

        const customerHtml = createEmailTemplate({
            logoUrl,
            title: 'Thank You for Contacting Us!',
            content: customerContent
        });

        // 2. Send notification email to admin (simple format)
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">New Contact Form Submission</h2>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                <p><em>This is an automated notification from the Cranberri Diamonds website contact form.</em></p>
            </div>
        `;

        // Send both emails
        console.log('Attempting to send emails...');
        await Promise.all([
            sendEmail({
                to: email,
                subject: 'Thank you for contacting Cranberri Diamonds',
                html: customerHtml
            }),
            sendEmail({
                to: 'accounts@cranberridiamonds.in',
                subject: `New Contact Form Submission from ${name}`,
                html: adminHtml
            })
        ]);
        console.log('Contact form emails sent successfully.');

        // 3. Create notifications for all admin users
        const adminUsers = await prisma.user.findMany({
            where: { role: 'admin' }
        });

        if (adminUsers.length > 0) {
            const notificationData = adminUsers.map(admin => ({
                userId: admin.id,
                type: 'contact_form',
                title: 'New Contact Form Submission',
                message: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await prisma.notification.createMany({
                data: notificationData
            });

            console.log(`Created notifications for ${adminUsers.length} admin users`);
        }

        return NextResponse.json({ success: true, message: 'Message sent successfully!' });

    } catch (error) {
        console.error('Error processing contact form:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message: `Failed to send message: ${errorMessage}` }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 