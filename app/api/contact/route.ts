import { NextRequest, NextResponse } from 'next/server';
// You'll need to install and configure an email sending library
// Example using Nodemailer (requires installation: npm install nodemailer)
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }

        // --- Email Sending Logic ---
        // IMPORTANT: Replace with your actual email sending configuration.
        // Store sensitive credentials (like email password or API keys) in environment variables.
        // Example using Nodemailer with Gmail (less secure, consider OAuth2 or an email service like SendGrid/Resend)

        // Ensure EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD are set in your .env.local
        if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
             console.error("Email server credentials not configured in environment variables.");
             // Optionally, you could still return success to the user but log the error server-side
             // return NextResponse.json({ success: true, message: 'Message received (email not sent - server config issue).' });
             return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com', // e.g., 'smtp.gmail.com' or your provider's SMTP
            port: Number(process.env.EMAIL_SERVER_PORT || 587), // e.g., 587 for TLS, 465 for SSL
            secure: (process.env.EMAIL_SERVER_PORT || '587') === '465', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_SERVER_USER, // Your email address from .env.local
                pass: process.env.EMAIL_SERVER_PASSWORD, // Your email password or app password from .env.local
            },
            // Add timeout options if needed
             connectionTimeout: 10000, // 10 seconds
             greetingTimeout: 10000, // 10 seconds
             socketTimeout: 10000, // 10 seconds
        });
        
        // Verify connection configuration (optional, but good for debugging)
        try {
            await transporter.verify();
            console.log('Nodemailer transporter verified successfully.');
        } catch (verifyError) {
            console.error('Nodemailer transporter verification failed:', verifyError);
             // Optionally, inform the user about the server issue
            // return NextResponse.json({ success: true, message: 'Message received (email config issue).' });
            return NextResponse.json({ success: false, message: 'Server email configuration error.' }, { status: 500 });
        }


        const mailOptions = {
            from: `"Contact Form" <${process.env.EMAIL_SERVER_USER}>`, // Sender address (must be your authenticated user)
            to: 'info@cranberridiamonds.in', // List of receivers
            replyTo: email, // Set reply-to to the user's email
            subject: `New Contact Form Submission from ${name}`, // Subject line
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, // Plain text body
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                   <p><strong>Message:</strong></p>
                   <p>${message.replace(/\n/g, '<br>')}</p>`, // HTML body
        };

        // Send the email
        console.log('Attempting to send email...');
        await transporter.sendMail(mailOptions);
        console.log('Contact form email sent successfully.');

        return NextResponse.json({ success: true, message: 'Message sent successfully!' });

    } catch (error) {
        console.error('Error processing contact form:', error);
        // Extract more specific error message if possible
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message: `Failed to send message: ${errorMessage}` }, { status: 500 });
    } finally {
         // Consider closing the transporter if necessary, though often not needed for stateless functions
        // await transporter.close(); 
    }
} 