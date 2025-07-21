import { db } from './server/db.ts';
import * as schema from './shared/schema.ts';
import bcrypt from 'bcryptjs';

async function createSimpleDemoUser() {
  try {
    console.log('Creating demo user for landing page screenshots...');

    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const [demoUser] = await db.insert(schema.users).values({
      id: 'demo-user-landing-page-2025',
      email: 'demo.alexandra.chen@example.com',
      password: hashedPassword,
      firstName: 'Alexandra',
      lastName: 'Chen',
      userType: 'candidate',
      currentRole: 'candidate',
      createdAt: new Date('2024-01-15'),
      isVerified: true,
      isActive: true,
      lastLoginAt: new Date()
    }).returning();

    console.log('✅ Demo user created:', demoUser.email);

    // Create impressive profile
    const [profile] = await db.insert(schema.userProfiles).values({
      userId: demoUser.id,
      firstName: 'Alexandra',
      lastName: 'Chen',
      email: 'demo.alexandra.chen@example.com',
      phone: '+1 (555) 123-4567',
      professionalTitle: 'Senior Full Stack Engineer',
      yearsExperience: 6,
      currentLocation: 'San Francisco, CA',
      bio: 'Passionate full-stack engineer with 6+ years building scalable web applications. Expert in React, Node.js, and cloud architecture.',
      linkedinUrl: 'https://linkedin.com/in/alexandra-chen-dev',
      githubUrl: 'https://github.com/alexandra-chen',
      portfolioUrl: 'https://alexandra-chen.dev',
      preferredSalaryRange: '$140,000 - $180,000',
      preferredJobType: 'full-time',
      preferredWorkMode: 'hybrid',
      careerLevel: 'senior',
      isOpenToWork: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    }).returning();

    console.log('✅ Profile created for:', profile.firstName, profile.lastName);

    // Add impressive resume
    await db.insert(schema.resumes).values({
      userId: demoUser.id,
      fileName: 'Alexandra_Chen_Senior_FullStack_Engineer.pdf',
      name: 'Alexandra Chen - Senior Full Stack Engineer Resume',
      filePath: '/demo/resumes/alexandra_chen_resume.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      resumeText: 'ALEXANDRA CHEN - Senior Full Stack Engineer with 6+ years experience in React, Node.js, TypeScript, AWS...',
      atsScore: 94,
      status: 'active',
      isActive: true,
      uploadedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    });

    console.log('✅ Resume added with 94% ATS score');

    // Add job applications
    const applications = [
      {
        jobTitle: 'Senior Software Engineer',
        company: 'Google',
        status: 'interview_scheduled',
        appliedDate: new Date('2024-01-20'),
        source: 'platform',
        matchScore: 96,
        salaryRange: '$180,000 - $250,000',
        location: 'Mountain View, CA',
        workMode: 'hybrid'
      },
      {
        jobTitle: 'Principal Frontend Engineer',
        company: 'Stripe',
        status: 'offer_received',
        appliedDate: new Date('2024-01-18'),
        source: 'platform',
        matchScore: 92,
        salaryRange: '$170,000 - $230,000',
        location: 'San Francisco, CA',
        workMode: 'hybrid'
      },
      {
        jobTitle: 'Tech Lead - Platform Engineering',
        company: 'Netflix',
        status: 'applied',
        appliedDate: new Date('2024-01-22'),
        source: 'extension',
        matchScore: 94,
        salaryRange: '$190,000 - $270,000',
        location: 'Los Gatos, CA',
        workMode: 'hybrid'
      }
    ];

    for (const app of applications) {
      await db.insert(schema.jobApplications).values({
        userId: demoUser.id,
        jobTitle: app.jobTitle,
        company: app.company,
        status: app.status,
        appliedDate: app.appliedDate,
        source: app.source,
        matchScore: app.matchScore,
        salaryRange: app.salaryRange,
        location: app.location,
        workMode: app.workMode,
        createdAt: app.appliedDate
      });
    }

    console.log('✅ Added', applications.length, 'job applications');

    console.log('\n🎉 Demo user setup complete!');
    console.log('📧 Email: alexandra.chen@example.com');
    console.log('🔑 Password: demo123');
    console.log('\nPerfect for landing page screenshots! 📸');

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    process.exit(0);
  }
}

createSimpleDemoUser();