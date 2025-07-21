import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { storage } from "./storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";
import { sendEmail, generatePasswordResetEmail, generateVerificationEmail } from "./emailService";
import crypto from "crypto";

// Simple auth configuration
const authConfig = {
  session: {
    secret: process.env.NEXTAUTH_SECRET || 'default-secret-key',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
  providers: {
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    linkedin: {
      enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    },
    email: {
      enabled: true, // Enable email login by default
    }
  }
};

export async function setupAuth(app: Express) {
  // Setup session middleware with memory store for development
  app.use(session({
    secret: authConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: authConfig.session.maxAge,
      sameSite: 'lax',
    },
  }));

  // Auth status endpoint with caching
  const providersCache = {
    providers: {
      google: authConfig.providers.google.enabled,
      github: authConfig.providers.github.enabled,
      linkedin: authConfig.providers.linkedin.enabled,
      email: authConfig.providers.email.enabled,
    },
  };

  app.get('/api/auth/providers', (req, res) => {
    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.json(providersCache);
  });

  // Login route
  app.post('/api/auth/signin', async (req, res) => {
    const { provider, email, password } = req.body;

    if (provider === 'credentials' && authConfig.providers.email.enabled) {
      try {
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));
        
        if (!user || !user.password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Set session
        (req as any).session.user = {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        };

        res.json({ 
          message: "Login successful", 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          }
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
    } else {
      // For OAuth providers, redirect to their auth URLs
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
      
      if (provider === 'google' && authConfig.providers.google.enabled) {
        const authUrl = `https://accounts.google.com/oauth2/v2/auth?client_id=${authConfig.providers.google.clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/google`)}&scope=openid%20email%20profile&response_type=code`;
        res.json({ redirectUrl: authUrl });
      } else if (provider === 'github' && authConfig.providers.github.enabled) {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${authConfig.providers.github.clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/github`)}&scope=user:email`;
        res.json({ redirectUrl: authUrl });
      } else if (provider === 'linkedin' && authConfig.providers.linkedin.enabled) {
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${authConfig.providers.linkedin.clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/linkedin`)}&scope=r_liteprofile%20r_emailaddress`;
        res.json({ redirectUrl: authUrl });
      } else {
        res.status(400).json({ message: "Provider not supported or not configured" });
      }
    }
  });

  // User info endpoint
  app.get('/api/user', async (req: any, res) => {
    try {
      const sessionUser = req.session?.user;
      
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Fetch onboarding status from database
      let onboardingCompleted = false;
      try {
        const { storage } = await import("./storage");
        const profile = await storage.getUserProfile(sessionUser.id);
        onboardingCompleted = profile?.onboardingCompleted || false;
      } catch (error) {
        console.error("Error fetching profile for onboarding status:", error);
      }



      // For real users, fetch from database
      try {
        const { storage } = await import("./storage");
        const fullUser = await storage.getUser(sessionUser.id);
        if (fullUser) {
          return res.json({
            id: fullUser.id,
            email: fullUser.email,
            name: sessionUser.name,
            firstName: fullUser.firstName,
            lastName: fullUser.lastName,
            userType: fullUser.userType,
            emailVerified: fullUser.emailVerified,
            companyName: fullUser.companyName,
            companyWebsite: fullUser.companyWebsite,
            onboardingCompleted,
          });
        }
      } catch (error) {
        console.error("Error fetching full user data:", error);
      }

      // Fallback to session data if database fetch fails
      res.json({
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        firstName: 'User',
        lastName: 'Name',
        onboardingCompleted,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post('/api/auth/signout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ 
        message: "Logged out successfully",
        redirectTo: "/" 
      });
    });
  });

  // Email authentication routes
  app.post('/api/auth/email/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user (not verified yet)
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        userType: 'job_seeker',
        emailVerified: false, // User needs to verify email
        profileImageUrl: null,
        companyName: null,
        companyWebsite: null
      });

      // Generate verification token
      const verificationToken = Math.random().toString(36).substr(2, 32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Store verification token
      await storage.createEmailVerificationToken({
        token: verificationToken,
        email,
        userId,
        expiresAt,
        verified: false
      });

      // Send verification email
      try {
        const { sendEmail, generateVerificationEmail } = await import('./emailService');
        const emailHtml = generateVerificationEmail(verificationToken, 'AutoJobr');
        
        await sendEmail({
          to: email,
          subject: 'Verify your AutoJobr account',
          html: emailHtml,
        });

        res.status(201).json({ 
          message: 'Account created successfully. Please check your email to verify your account.',
          requiresVerification: true,
          email: email
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // If email fails, still create account but notify user
        res.status(201).json({ 
          message: 'Account created but verification email could not be sent. Please contact support.',
          requiresVerification: true,
          email: email
        });
      }
    } catch (error) {
      console.error('Email signup error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post('/api/auth/email/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check if email is verified (only for email signup users)
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
          requiresVerification: true,
          email: user.email
        });
      }

      // Store session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Force session save before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }
        
        console.log('Session saved successfully for user:', user.id);
        res.json({ 
          message: 'Login successful', 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userType: user.userType
          }
        });
      });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Demo login endpoint for testing
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      // Get the existing user
      const [user] = await db.select().from(users).where(eq(users.email, 'shubhamdubeyskd2001@gmail.com'));
      if (!user) {
        return res.status(404).json({ message: 'Demo user not found' });
      }

      // Store session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType || 'job_seeker'
      };

      // Force session save before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }
        
        console.log('Demo session saved successfully for user:', user.id);
        res.json({ 
          message: 'Demo login successful', 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userType: user.userType || 'job_seeker'
          }
        });
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Demo login failed' });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      // Get token from database
      const tokenRecord = await storage.getEmailVerificationToken(token as string);
      
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      // Find user by email from the token record
      let [user] = await db.select().from(users).where(eq(users.email, tokenRecord.email));
      
      if (!user && tokenRecord.userType === 'recruiter') {
        // For recruiters, create the user account during verification
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newUser = await storage.upsertUser({
          id: userId,
          email: tokenRecord.email,
          firstName: tokenRecord.companyName || 'Recruiter',
          lastName: '',
          password: null, // Recruiter accounts don't use password initially
          userType: 'recruiter',
          emailVerified: true, // Verified during this process
          profileImageUrl: null,
          companyName: tokenRecord.companyName,
          companyWebsite: tokenRecord.companyWebsite
        });
        user = newUser;
      } else if (user) {
        // Update existing user's verification status
        await storage.upsertUser({
          ...user,
          emailVerified: true,
        });
      }

      if (user) {
        // Delete used token
        await storage.deleteEmailVerificationToken(token as string);

        // Auto-login the user
        (req as any).session.user = {
          id: user.id,
          email: user.email,
          name: user.userType === 'recruiter' 
            ? (user.companyName || 'Recruiter')
            : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType
        };

        // Force session save before redirecting
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('Session save error during verification:', err);
            return res.status(500).json({ message: 'Verification failed - session error' });
          }
          
          console.log('Verification session saved successfully for user:', user.id);
          
          // Redirect based on user type
          if (user.userType === 'recruiter') {
            res.redirect('/post-job?verified=true');
          } else {
            res.redirect('/onboarding?verified=true');
          }
        });
      } else {
        return res.status(400).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  });

  // OAuth callback handlers
  app.get('/api/auth/callback/google', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: authConfig.providers.google.clientId!,
          client_secret: authConfig.providers.google.clientSecret!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${baseUrl}/api/auth/callback/google`,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const googleUser = await userResponse.json();

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));
      
      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.upsertUser({
          id: userId,
          email: googleUser.email,
          firstName: googleUser.given_name || 'User',
          lastName: googleUser.family_name || '',
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: googleUser.picture,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }
        
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ message: 'Google login failed' });
    }
  });

  app.get('/api/auth/callback/github', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: authConfig.providers.github.clientId!,
          client_secret: authConfig.providers.github.clientSecret!,
          code: code as string,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokens.access_token}`,
          'User-Agent': 'AutoJobr',
        },
      });

      const githubUser = await userResponse.json();

      // Get user emails
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${tokens.access_token}`,
          'User-Agent': 'AutoJobr',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary)?.email || githubUser.email;

      if (!primaryEmail) {
        return res.status(400).json({ message: 'No email found in GitHub account' });
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, primaryEmail));
      
      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = githubUser.name || githubUser.login;
        const nameParts = name.split(' ');
        
        user = await storage.upsertUser({
          id: userId,
          email: primaryEmail,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: githubUser.avatar_url,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }
        
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.status(500).json({ message: 'GitHub login failed' });
    }
  });

  app.get('/api/auth/callback/linkedin', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: `${baseUrl}/api/auth/callback/linkedin`,
          client_id: authConfig.providers.linkedin.clientId!,
          client_secret: authConfig.providers.linkedin.clientSecret!,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from LinkedIn
      const userResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const linkedinUser = await userResponse.json();

      // Get user email
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const emailData = await emailResponse.json();
      const email = emailData.elements?.[0]?.['handle~']?.emailAddress;

      if (!email) {
        return res.status(400).json({ message: 'No email found in LinkedIn account' });
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const firstName = linkedinUser.firstName?.localized?.en_US || 'User';
        const lastName = linkedinUser.lastName?.localized?.en_US || '';
        
        user = await storage.upsertUser({
          id: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: linkedinUser.profilePicture?.displayImage?.['~']?.elements?.[0]?.identifiers?.[0]?.identifier,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }
        
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      res.status(500).json({ message: 'LinkedIn login failed' });
    }
  });

  // Send verification email for job seekers
  app.post('/api/auth/send-user-verification', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email || !firstName) {
        return res.status(400).json({ message: 'Email and first name are required' });
      }

      // Generate verification token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      try {
        // Save verification token
        await storage.createEmailVerificationToken({
          email,
          token,
          expiresAt,
          userId: `pending-jobseeker-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          userType: "job_seeker",
        });

        // Send email with appropriate template
        const userName = `${firstName} ${lastName || ''}`.trim();
        const emailHtml = generateVerificationEmail(token, userName, "job_seeker");
        const emailSent = await sendEmail({
          to: email,
          subject: 'Verify Your Email - AutoJobr',
          html: emailHtml,
        });

        if (emailSent) {
          res.json({ 
            message: 'Verification email sent successfully',
            email: email
          });
        } else {
          res.status(500).json({ message: 'Failed to send verification email' });
        }
      } catch (error) {
        console.error('Database error during verification:', error);
        res.status(500).json({ message: 'Database connection issue. Please try again later.' });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const verificationToken = Math.random().toString(36).substr(2, 32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Delete old tokens for this user
      try {
        await storage.deleteEmailVerificationTokensByUserId(user.id);
      } catch (error) {
        console.log('No old tokens to delete');
      }

      // Store new verification token
      await storage.createEmailVerificationToken({
        token: verificationToken,
        email,
        userId: user.id,
        expiresAt,
        verified: false
      });

      // Send verification email
      try {
        const { sendEmail, generateVerificationEmail } = await import('./emailService');
        const emailHtml = generateVerificationEmail(verificationToken, 'AutoJobr');
        
        await sendEmail({
          to: email,
          subject: 'Verify your AutoJobr account',
          html: emailHtml,
        });

        res.json({ 
          message: 'Verification email sent successfully. Please check your inbox.'
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(500).json({ 
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          message: 'If an account with this email exists, you will receive a password reset email shortly.' 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      });

      // Send reset email
      const resetEmailHtml = generatePasswordResetEmail(resetToken, user.email!);
      const emailSent = await sendEmail({
        to: user.email!,
        subject: 'Reset Your AutoJobr Password',
        html: resetEmailHtml,
      });

      if (emailSent) {
        res.json({ 
          message: 'If an account with this email exists, you will receive a password reset email shortly.' 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send password reset email. Please try again later.' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Get token from database
      const tokenRecord = await storage.getPasswordResetToken(token);
      
      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user's password
      await storage.updateUserPassword(tokenRecord.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      // Clean up expired tokens
      await storage.deleteExpiredPasswordResetTokens();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });


}

// Middleware to check authentication
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    console.log('Session check:', req.session?.user ? 'User found' : 'No user in session');
    console.log('Session ID:', req.sessionID);
    
    const sessionUser = req.session?.user;
    
    if (!sessionUser) {
      console.log('No authenticated user in session');
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log('Authenticated user:', sessionUser.id);
    
    // For real users, use session data
    req.user = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim(),
      firstName: sessionUser.firstName || 'User',
      lastName: sessionUser.lastName || 'Name',
      userType: sessionUser.userType || 'job_seeker'
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};