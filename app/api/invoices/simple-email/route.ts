import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, companyName, invoiceNo, totalAmount } = body;

    console.log('🧪 Simple Invoice Email: Starting test email to:', to);

    const subject = `Invoice ${invoiceNo} - Thank you for your purchase from Cranberri Diamonds`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #000000, #333333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; color: #000000; }
              .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; color: #000000; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; background: #2c3e50; color: white; border-radius: 10px; }
              .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
              h3 { color: #000000; }
              p, li { color: #000000; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Thank You for Your Purchase!</h1>
                  <p>From Cranberri Diamonds</p>
              </div>
              
              <div class="content">
                  <p>Dear <strong>${companyName}</strong>,</p>
                  
                  <p>Thank you for choosing Cranberri Diamonds for your premium diamond needs. We are delighted to confirm your recent purchase.</p>
                  
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
                      <li>Our team will process your order and arrange shipping</li>
                      <li>Our customer service team is available for any questions</li>
                  </ul>
                  
                  <h3>Need Assistance?</h3>
                  <p>If you have any questions about your purchase or need additional support, please don't hesitate to contact us:</p>
                  <ul>
                      <li><strong>Email:</strong> accounts@cranberridiamonds.in</li>
                      <li><strong>Website:</strong> www.cranberridiamonds.in</li>
                      <li><strong>Address:</strong> B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India</li>
                  </ul>
                  
                  <p>We truly appreciate your business and look forward to serving you again. Thank you for trusting Cranberri Diamonds with your diamond needs.</p>
                  
                  <p>Warm regards,<br>
                  <strong>The Cranberri Diamonds Team</strong></p>
              </div>
              
              <div class="footer">
                  <p><strong>Cranberri Diamonds</strong></p>
                  <p>Premium Lab-Grown Diamonds | Sustainable | Certified | Ethical</p>
                  <p>www.cranberridiamonds.in</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await sendEmail({
      to,
      subject,
      html
    });

    return NextResponse.json({
      success: true,
      message: 'Simple invoice email sent successfully',
      recipient: to,
      invoiceNo
    });

  } catch (error) {
    console.error('🧪 Simple Invoice Email: Failed to send email:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        emailHost: process.env.EMAIL_HOST || 'smtpout.secureserver.net (default)',
        emailUser: process.env.EMAIL_USER || 'accounts@cranberridiamonds.in (default)',
        emailPassword: process.env.EMAIL_PASSWORD ? 'Set' : 'NOT SET',
        emailPort: process.env.EMAIL_PORT || '587 (default)',
        environment: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
} 