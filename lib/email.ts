import nodemailer from 'nodemailer';
import { logger, criticalLogger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Function to get logo as base64 OR URL
export function getLogoForEmail(): string {
  // First try to use the direct URL which is more reliable for emails
  const logoUrl = 'https://www.cranberridiamonds.in/logo.png';
  
  // For emails, it's better to use direct URLs rather than base64
  // as base64 images can be blocked by email clients
  logger.log('📧 Email: Using logo URL for better email compatibility:', logoUrl);
  return logoUrl;
}

// Function to create a professional email template with proper logo
export function createEmailTemplate({
  logoUrl,
  title,
  content,
  footerContent = ''
}: {
  logoUrl: string;
  title: string;
  content: string;
  footerContent?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                line-height: 1.6; 
                color: #333333; 
                background-color: #f8f9fa;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: #ffffff; 
                color: #333333; 
                padding: 40px 30px; 
                text-align: center; 
                border-bottom: 2px solid #e2e8f0;
            }
            .logo { 
                max-width: 180px; 
                height: auto; 
                margin-bottom: 20px; 
                display: block;
                margin-left: auto;
                margin-right: auto;
            }
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 8px;
                color: #1a1a1a;
            }
            .header p {
                font-size: 16px;
                color: #4a5568;
            }
            .content { 
                padding: 40px 30px; 
                color: #333333; 
            }
            .content h2, .content h3 { 
                color: #1a1a1a; 
                margin-bottom: 16px;
            }
            .content p { 
                color: #4a5568; 
                margin-bottom: 16px;
                font-size: 16px;
            }
            .content ul, .content ol {
                padding-left: 20px;
                margin-bottom: 16px;
            }
            .content li {
                color: #4a5568;
                margin-bottom: 8px;
            }
            .highlight { 
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); 
                padding: 24px; 
                border-radius: 12px; 
                margin: 24px 0; 
                border-left: 4px solid #3182ce; 
            }
            .highlight h3 {
                color: #1a202c;
                margin-bottom: 12px;
            }
            .highlight p {
                color: #2d3748;
                margin-bottom: 8px;
            }
            .amount { 
                font-size: 32px; 
                font-weight: 700; 
                color: #38a169; 
                display: inline-block;
            }
            .otp-code {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin: 24px 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 4px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer { 
                background: white; 
                color: #333333; 
                padding: 30px; 
                text-align: center; 
                border-top: 2px solid #e2e8f0;
            }
            .footer-logo {
                max-width: 140px;
                height: auto;
                margin-bottom: 16px;
                filter: brightness(1.1);
                display: block;
                margin-left: auto;
                margin-right: auto;
            }
            .footer p {
                color: #4a5568;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .footer a {
                color: #3182ce;
                text-decoration: none;
            }
            .footer a:hover {
                text-decoration: underline;
                color: #2c5282;
            }
            .btn { 
                display: inline-block; 
                background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); 
                color: white; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 16px 0; 
                font-weight: 600;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="Cranberri Diamonds Logo" class="logo">` : `
                    <div style="margin-bottom: 20px;">
                        <h1 style="font-size: 36px; margin-bottom: 8px;">Cranberri</h1>
                        <p style="font-size: 18px; opacity: 0.9;">Diamonds</p>
                    </div>
                `}
                <h1>${title}</h1>
                <p>Premium Lab-Grown Diamonds | Certified | Ethical</p>
            </div>
            
            <div class="content">
                ${content}
            </div>
            
            <div class="footer">
                ${logoUrl ? `<img src="${logoUrl}" alt="Cranberri Diamonds Logo" class="footer-logo">` : `
                    <div style="margin-bottom: 16px;">
                        <h3 style="color: #1a1a1a; margin-bottom: 4px;">Cranberri Diamonds</h3>
                    </div>
                `}
                <p><strong style="color: #1a1a1a;">Cranberri Diamonds</strong></p>
                <p>B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</p>
                <p>Email: <a href="mailto:accounts@cranberridiamonds.in">accounts@cranberridiamonds.in</a></p>
                <p>Website: <a href="https://www.cranberridiamonds.in" target="_blank">www.cranberridiamonds.in</a></p>
                ${footerContent}
            </div>
        </div>
    </body>
    </html>
  `;
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtpout.secureserver.net', // GoDaddy SMTP
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER || 'accounts@cranberridiamonds.in',
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug logs
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<void> {
  try {
    logger.log('📧 Email: Starting email send process');
    logger.log('📧 Email: Recipient:', to);
    logger.log('📧 Email: Subject:', subject);
    logger.log('📧 Email: Has attachments:', attachments && attachments.length > 0 ? `Yes (${attachments.length})` : 'No');
    logger.log('📧 Email: Environment check:');
    logger.log('📧 Email: - EMAIL_HOST:', process.env.EMAIL_HOST || 'smtpout.secureserver.net (default)');
    logger.log('📧 Email: - EMAIL_USER:', process.env.EMAIL_USER || 'accounts@cranberridiamonds.in (default)');
    logger.log('📧 Email: - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'NOT SET');
    logger.log('📧 Email: - EMAIL_PORT:', process.env.EMAIL_PORT || '587 (default)');
    
    // Verify transporter configuration
    logger.log('🔄 Email: Verifying transporter configuration...');
    try {
      await transporter.verify();
      logger.log('✅ Email: Transporter verified successfully');
    } catch (verifyError) {
      criticalLogger.error('❌ Email: Transporter verification failed:', verifyError);
      throw new Error(`Email configuration error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_FROM || '"Cranberri Diamonds" <accounts@cranberridiamonds.in>',
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
      logger.log('📧 Email: Added', attachments.length, 'attachment(s)');
      attachments.forEach((att, index) => {
        logger.log(`📧 Email: Attachment ${index + 1}: ${att.filename} (${att.content.length} bytes, ${att.contentType})`);
      });
    }

    logger.log('🔄 Email: Sending email via SMTP...');
    const info = await transporter.sendMail(mailOptions);

    logger.log('✅ Email: Email sent successfully!');
    logger.log('✅ Email: Message ID:', info.messageId);
    logger.log('✅ Email: Response:', info.response);
  } catch (error) {
    criticalLogger.error('❌ Email: Detailed email sending error:', error);
    criticalLogger.error('❌ Email: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function sendInvoiceEmail({
  to,
  companyName,
  invoiceNo,
  totalAmount,
  pdfBuffer
}: {
  to: string;
  companyName: string;
  invoiceNo: string;
  totalAmount: number;
  pdfBuffer: Buffer;
}): Promise<void> {
  logger.log('📧 Invoice Email: Starting invoice email process');
  logger.log('📧 Invoice Email: Invoice:', invoiceNo);
  logger.log('📧 Invoice Email: Company:', companyName);
  logger.log('📧 Invoice Email: Amount:', totalAmount);
  logger.log('📧 Invoice Email: PDF size:', pdfBuffer.length, 'bytes');
  
  const subject = `Invoice ${invoiceNo} - Thank you for your purchase from Cranberri Diamonds`;
  
  // Get logo as base64
  const logoUrl = getLogoForEmail();
  
  // Create email content using the new template
  const content = `
    <p>Dear <strong>${companyName}</strong>,</p>
    
    <p>Thank you for choosing Cranberri Diamonds for your premium diamond needs. We are delighted to confirm your recent purchase and have attached your invoice for your records.</p>
    
    <div class="highlight">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Number:</strong> ${invoiceNo}</p>
        <p><strong>Total Amount:</strong> <span class="amount">$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>
    
    <h3>What's Next?</h3>
    <ul>
        <li>Your invoice is attached to this email as a PDF</li>
        <li>Our team will process your order and arrange shipping</li>
        <li>Our customer service team is available for any questions</li>
    </ul>
    
    <h3>Need Assistance?</h3>
    <p>If you have any questions about your purchase or need additional support, please don't hesitate to contact us:</p>
    <ul>
        <li><strong>Email:</strong> <a href="mailto:accounts@cranberridiamonds.in">accounts@cranberridiamonds.in</a></li>
        <li><strong>Website:</strong> <a href="https://www.cranberridiamonds.in" target="_blank">www.cranberridiamonds.in</a></li>
        <li><strong>Address:</strong> B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</li>
    </ul>
    
    <p>We truly appreciate your business and look forward to serving you again. Thank you for trusting Cranberri Diamonds with your diamond needs.</p>
    
    <p>Warm regards,<br>
    <strong>The Cranberri Diamonds Team</strong></p>
  `;

  const html = createEmailTemplate({
    logoUrl,
    title: 'Thank You for Your Purchase!',
    content
  });

  const safeInvoiceNo = invoiceNo.replace(/\/|\?/g, '-');
  
  logger.log('📧 Invoice Email: Calling sendEmail function...');
  
  // Validate PDF buffer before sending
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF buffer is empty or invalid');
  }
  
  // Check if buffer starts with PDF magic number
  const pdfHeader = pdfBuffer.slice(0, 4).toString('hex');
  if (pdfHeader !== '25504446') { // PDF magic number
    criticalLogger.error('❌ Email: PDF buffer does not start with PDF magic number:', pdfHeader);
    criticalLogger.error('❌ Email: This indicates the PDF generation failed - buffer is not a valid PDF');
    throw new Error('Generated buffer is not a valid PDF file');
  }
  
  logger.log('✅ Email: PDF validation passed - buffer is a valid PDF file');
  
  // Always send the full email content with PDF attachment
  await sendEmail({
    to,
    subject,
    html,
    attachments: [{
      filename: `Invoice-${safeInvoiceNo}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  });
  logger.log('✅ Invoice Email: Invoice email sent successfully!');
}