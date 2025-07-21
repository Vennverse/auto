import { Resend } from 'resend';

// Make Resend optional for development
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log('RESEND_API_KEY not set - email sending will be simulated in development mode');
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Always try to send real emails if Resend is configured
    if (!resend) {
      console.log('=== EMAIL SIMULATION (No Resend API Key) ===');
      console.log('To:', params.to);
      console.log('Subject:', params.subject);
      console.log('HTML Content (truncated):', params.html.substring(0, 200) + '...');
      console.log('=== END EMAIL SIMULATION ===');
      return true; // Pretend email was sent successfully
    }

    // This check should not be needed since we already checked above
    // if (!resend) {
    //   console.error('Resend not configured - cannot send email');
    //   return false;
    // }

    const { data, error } = await resend.emails.send({
      from: 'AutoJobr <noreply@vennverse.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('Resend error:', error);
      // In case of email service failure, log the verification URL for manual testing
      if (params.html.includes('verify-email?token=')) {
        const tokenMatch = params.html.match(/verify-email\?token=([^"]+)/);
        if (tokenMatch) {
          console.log('MANUAL VERIFICATION URL:', `http://localhost:5000/verify-email?token=${tokenMatch[1]}`);
        }
      }
      return false;
    }

    console.log('Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(token: string, userEmail: string): string {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/reset-password?token=${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - AutoJobr</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Secure your AutoJobr account</p>
      </div>
      
      <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset the password for your AutoJobr account (${userEmail}). 
          If you made this request, please click the button below to set a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. 
            Your password will remain unchanged.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This password reset link will expire in 1 hour for security reasons.
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateVerificationEmail(token: string, nameOrCompany: string, userType: string = 'recruiter'): string {
  const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-email?token=${token}`;
  
  if (userType === 'recruiter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Company Email - AutoJobr</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AutoJobr</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Verify your company email to start posting jobs</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${nameOrCompany} Team,</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining AutoJobr as a recruiter! To complete your registration and start posting jobs, 
            please verify your company email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Verify Company Email
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This verification link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  } else {
    // Job seeker verification email
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - AutoJobr</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AutoJobr</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Verify your email to start your job search</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${nameOrCompany},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to AutoJobr! You're just one step away from accessing our AI-powered job search platform. 
            Please verify your email address to complete your registration and start applying to jobs.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">🚀 What's Next?</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Complete your professional profile</li>
              <li>Upload your resume for AI analysis</li>
              <li>Get personalized job recommendations</li>
              <li>Apply to jobs with one click</li>
            </ul>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This verification link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}