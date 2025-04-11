import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug logs
});

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  try {
    console.log('Attempting to send email to:', to);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Admin System" <admin@example.com>',
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Detailed email sending error:', error);
    throw new Error('Failed to send email');
  }
}