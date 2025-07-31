import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }

        // --- Email Sending Logic ---
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
             console.error("Email server credentials not configured in environment variables.");
             return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
            port: Number(process.env.EMAIL_PORT || 587),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });
        
        // Verify connection configuration
        try {
            await transporter.verify();
            console.log('Nodemailer transporter verified successfully.');
        } catch (verifyError) {
            console.error('Nodemailer transporter verification failed:', verifyError);
            return NextResponse.json({ success: false, message: 'Server email configuration error.' }, { status: 500 });
        }

        // Convert logo to base64 for embedding in email
        let logoBase64 = '';
        try {
            const fs = await import('fs');
            const path = await import('path');
            const logoPath = path.default.join(process.cwd(), 'public', 'logo.png');
            const logoBuffer = fs.default.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Failed to load logo:', error);
        }

        // 1. Send confirmation email to customer
        const customerMailOptions = {
            from: `"Cranberri Diamonds" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Thank you for contacting Cranberri Diamonds`,
            text: `Dear ${name},

Thank you for reaching out to Cranberri Diamonds. We have received your message and our team will respond to you shortly.

Your message details:
${message}

We appreciate your interest in our diamond collection and look forward to assisting you.

Best regards,
The Cranberri Diamonds Team
www.cranberridiamonds.in`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    ${logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 150px; height: auto;"></div>` : ''}
                    <h2 style="color: #333;">Thank you for contacting Cranberri Diamonds</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for reaching out to Cranberri Diamonds. We have received your message and our team will respond to you shortly.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <p><strong>Your message:</strong></p>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p>We appreciate your interest in our diamond collection and look forward to assisting you.</p>
                    <p>Best regards,<br>The Cranberri Diamonds Team<br><a href="https://www.cranberridiamonds.in">www.cranberridiamonds.in</a></p>
                    ${logoBase64 ? `<div style="text-align: center; margin-top: 20px;"><img src="${logoBase64}" alt="Cranberri Diamonds Logo" style="max-width: 120px; height: auto; opacity: 0.7;"></div>` : ''}
                </div>
            `,
        };

        // 2. Send notification email to admin
        const adminMailOptions = {
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to: 'info@cranberridiamonds.in',
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                   <p><strong>Message:</strong></p>
                   <p>${message.replace(/\n/g, '<br>')}</p>`,
        };

        // Send both emails
        console.log('Attempting to send emails...');
        await Promise.all([
            transporter.sendMail(customerMailOptions),
            transporter.sendMail(adminMailOptions)
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