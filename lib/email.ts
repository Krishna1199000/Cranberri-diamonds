import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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

export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<void> {
  try {
    console.log('📧 Email: Starting email send process');
    console.log('📧 Email: Recipient:', to);
    console.log('📧 Email: Subject:', subject);
    console.log('📧 Email: Has attachments:', attachments && attachments.length > 0 ? `Yes (${attachments.length})` : 'No');
    
    // Verify transporter configuration
    console.log('🔄 Email: Verifying transporter configuration...');
    try {
      await transporter.verify();
      console.log('✅ Email: Transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email: Transporter verification failed:', verifyError);
      throw new Error(`Email configuration error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_FROM || '"Cranberri Diamonds" <admin@cranberridiamonds.in>',
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
      console.log('📧 Email: Added', attachments.length, 'attachment(s)');
      attachments.forEach((att, index) => {
        console.log(`📧 Email: Attachment ${index + 1}: ${att.filename} (${att.content.length} bytes, ${att.contentType})`);
      });
    }

    console.log('🔄 Email: Sending email via SMTP...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email: Email sent successfully!');
    console.log('✅ Email: Message ID:', info.messageId);
    console.log('✅ Email: Response:', info.response);
  } catch (error) {
    console.error('❌ Email: Detailed email sending error:', error);
    console.error('❌ Email: Error details:', {
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
  console.log('📧 Invoice Email: Starting invoice email process');
  console.log('📧 Invoice Email: Invoice:', invoiceNo);
  console.log('📧 Invoice Email: Company:', companyName);
  console.log('📧 Invoice Email: Amount:', totalAmount);
  console.log('📧 Invoice Email: PDF size:', pdfBuffer.length, 'bytes');
  
  const subject = `Invoice ${invoiceNo} - Thank you for your purchase from Cranberri Diamonds`;
  
  // Convert logo to base64 for embedding in email
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    console.log('✅ Email: Logo loaded and converted to base64');
  } catch (error) {
    console.error('❌ Email: Failed to load logo:', error);
    logoBase64 = ''; // Will use placeholder
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #000000, #333333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; color: #000000; }
            .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; color: #000000; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background: #2c3e50; color: white; border-radius: 10px; }
            .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
            h3 { color: #000000; }
            p, li { color: #000000; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Cranberri Diamonds Logo" class="logo">` : ''}
                <h1>Thank You for Your Purchase!</h1>
                <p>From Cranberri Diamonds</p>
            </div>
            
            <div class="content">
                <p>Dear <strong>${companyName}</strong>,</p>
                
                <p>Thank you for choosing Cranberri Diamonds for your premium diamond needs. We are delighted to confirm your recent purchase and have attached your invoice for your records.</p>
                
                <div class="highlight">
                    <h3>Invoice Details:</h3>
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
                    <li><strong>Email:</strong> info@cranberridiamonds.in</li>
                    <li><strong>Website:</strong> www.cranberridiamonds.in</li>
                    <li><strong>Address:</strong> B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</li>
                </ul>
                
                <p>We truly appreciate your business and look forward to serving you again. Thank you for trusting Cranberri Diamonds with your diamond needs.</p>
                
                <p>Warm regards,<br>
                <strong>The Cranberri Diamonds Team</strong></p>
            </div>
            
            <div class="footer">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Cranberri Diamonds Logo" class="logo" style="max-width: 120px; margin-bottom: 10px;">` : ''}
                <p><strong>Cranberri Diamonds</strong></p>
                <p>Premium Lab-Grown Diamonds | Sustainable | Certified | Ethical</p>
                <p>www.cranberridiamonds.in</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const safeInvoiceNo = invoiceNo.replace(/\/|\?/g, '-');
  
  console.log('📧 Invoice Email: Calling sendEmail function...');
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
  console.log('✅ Invoice Email: Invoice email sent successfully!');
}