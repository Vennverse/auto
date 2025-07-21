import { db } from './server/db.ts';
import * as schema from './shared/schema.ts';
import bcrypt from 'bcryptjs';

async function createDemoUser() {
  try {
    console.log('Creating comprehensive demo user for landing page screenshots...');

    // Hash password for demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const [demoUser] = await db.insert(schema.users).values({
      id: 'demo-user-landing-page',
      email: 'alexandra.chen@example.com',
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
      email: demoUser.email,
      phone: '+1 (555) 123-4567',
      professionalTitle: 'Senior Full Stack Engineer',
      yearsExperience: 6,
      currentLocation: 'San Francisco, CA',
      profilePicture: null,
      bio: 'Passionate full-stack engineer with 6+ years building scalable web applications. Expert in React, Node.js, and cloud architecture. Led teams of 8+ developers and delivered products used by 500K+ users.',
      linkedinUrl: 'https://linkedin.com/in/alexandra-chen-dev',
      githubUrl: 'https://github.com/alexandra-chen',
      portfolioUrl: 'https://alexandra-chen.dev',
      preferredSalaryRange: '$140,000 - $180,000',
      preferredJobType: 'full-time',
      preferredWorkMode: 'hybrid',
      preferredLocations: JSON.stringify(['San Francisco, CA', 'Remote', 'New York, NY']),
      careerLevel: 'senior',
      isOpenToWork: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    }).returning();

    console.log('✅ Profile created for:', profile.firstName, profile.lastName);

    // Add impressive skills
    const skills = [
      { skillName: 'React', category: 'frontend', proficiency: 'expert', yearsUsed: 5 },
      { skillName: 'Node.js', category: 'backend', proficiency: 'expert', yearsUsed: 6 },
      { skillName: 'TypeScript', category: 'programming', proficiency: 'expert', yearsUsed: 4 },
      { skillName: 'Python', category: 'programming', proficiency: 'advanced', yearsUsed: 4 },
      { skillName: 'AWS', category: 'cloud', proficiency: 'advanced', yearsUsed: 4 },
      { skillName: 'PostgreSQL', category: 'database', proficiency: 'advanced', yearsUsed: 5 },
      { skillName: 'Docker', category: 'devops', proficiency: 'advanced', yearsUsed: 3 },
      { skillName: 'GraphQL', category: 'api', proficiency: 'advanced', yearsUsed: 3 },
      { skillName: 'Redis', category: 'database', proficiency: 'intermediate', yearsUsed: 2 },
      { skillName: 'Kubernetes', category: 'devops', proficiency: 'intermediate', yearsUsed: 2 },
      { skillName: 'Machine Learning', category: 'ai', proficiency: 'intermediate', yearsUsed: 2 },
      { skillName: 'Team Leadership', category: 'soft', proficiency: 'expert', yearsUsed: 3 }
    ];

    for (const skill of skills) {
      await db.insert(schema.userSkills).values({
        userId: demoUser.id,
        ...skill,
        createdAt: new Date('2024-01-15')
      });
    }

    console.log('✅ Added', skills.length, 'skills');

    // Add impressive work experience
    const workExperience = [
      {
        company: 'TechNova Inc',
        position: 'Senior Full Stack Engineer',
        startDate: new Date('2022-03-01'),
        endDate: null, // Current job
        isCurrent: true,
        description: 'Leading development of core platform serving 500K+ users. Built microservices architecture reducing load times by 60%. Mentored team of 5 junior developers.',
        location: 'San Francisco, CA',
        achievements: JSON.stringify([
          'Increased platform performance by 60% through microservices migration',
          'Led team of 8 developers on flagship product launch',
          'Implemented AI-powered recommendation system increasing user engagement by 40%',
          'Reduced deployment time from 2 hours to 15 minutes with CI/CD optimization'
        ])
      },
      {
        company: 'DataFlow Solutions',
        position: 'Full Stack Developer',
        startDate: new Date('2020-06-01'),
        endDate: new Date('2022-02-28'),
        isCurrent: false,
        description: 'Developed real-time analytics dashboard processing 1M+ events daily. Built responsive React frontend and scalable Node.js backend services.',
        location: 'San Francisco, CA',
        achievements: JSON.stringify([
          'Built analytics platform processing 1M+ daily events',
          'Reduced API response times by 75% through optimization',
          'Implemented automated testing increasing code coverage to 95%',
          'Led migration from monolith to microservices architecture'
        ])
      },
      {
        company: 'StartupLab',
        position: 'Frontend Developer',
        startDate: new Date('2018-08-01'),
        endDate: new Date('2020-05-31'),
        isCurrent: false,
        description: 'Transformed early-stage startup\'s MVP into production-ready platform. Built modern React applications and established development best practices.',
        location: 'San Francisco, CA',
        achievements: JSON.stringify([
          'Rebuilt entire frontend increasing user satisfaction by 85%',
          'Established code review process and testing standards',
          'Optimized bundle size reducing load times by 50%',
          'Implemented responsive design supporting all device types'
        ])
      }
    ];

    for (const exp of workExperience) {
      await db.insert(schema.workExperience).values({
        userId: demoUser.id,
        ...exp,
        createdAt: new Date('2024-01-15')
      });
    }

    console.log('✅ Added', workExperience.length, 'work experiences');

    // Add education
    await db.insert(schema.education).values({
      userId: demoUser.id,
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: new Date('2014-09-01'),
      endDate: new Date('2018-06-01'),
      gpa: '3.8',
      description: 'Graduated Magna Cum Laude. Specialized in Machine Learning and Web Technologies. Teaching Assistant for Advanced Algorithms course.',
      createdAt: new Date('2024-01-15')
    });

    console.log('✅ Added education');

    // Create impressive resume data
    await db.insert(schema.resumes).values({
      userId: demoUser.id,
      fileName: 'Alexandra_Chen_Senior_FullStack_Engineer.pdf',
      filePath: '/demo/resumes/alexandra_chen_resume.pdf',
      fileSize: 245760, // ~240KB
      mimeType: 'application/pdf',
      extractedText: `ALEXANDRA CHEN
Senior Full Stack Engineer
📧 alexandra.chen@example.com | 📱 (555) 123-4567 | 🌐 alexandra-chen.dev
📍 San Francisco, CA | 💼 LinkedIn: /in/alexandra-chen-dev | 🔗 GitHub: /alexandra-chen

PROFESSIONAL SUMMARY
Passionate Senior Full Stack Engineer with 6+ years of experience building scalable web applications and leading high-performing development teams. Expert in modern JavaScript frameworks, cloud architecture, and agile methodologies. Proven track record of delivering products that serve 500K+ users while maintaining 99.9% uptime.

TECHNICAL SKILLS
• Frontend: React, TypeScript, Vue.js, Next.js, HTML5, CSS3, Sass
• Backend: Node.js, Python, Express.js, Django, RESTful APIs, GraphQL
• Databases: PostgreSQL, MongoDB, Redis, MySQL
• Cloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, CI/CD
• Tools: Git, Jest, Webpack, Figma, Jira, Slack

PROFESSIONAL EXPERIENCE

SENIOR FULL STACK ENGINEER | TechNova Inc | March 2022 - Present
• Led development of core platform serving 500K+ daily active users
• Architected microservices infrastructure reducing load times by 60%
• Mentored team of 8 developers and established engineering best practices
• Implemented AI-powered recommendation system increasing engagement by 40%
• Reduced deployment time from 2 hours to 15 minutes through CI/CD optimization

FULL STACK DEVELOPER | DataFlow Solutions | June 2020 - February 2022
• Developed real-time analytics dashboard processing 1M+ events daily
• Built responsive React frontend with Node.js backend services
• Reduced API response times by 75% through performance optimization
• Achieved 95% test coverage through comprehensive automated testing
• Led successful migration from monolith to microservices architecture

FRONTEND DEVELOPER | StartupLab | August 2018 - May 2020
• Transformed early-stage MVP into production-ready platform
• Rebuilt entire frontend increasing user satisfaction scores by 85%
• Established code review processes and development standards
• Optimized application performance reducing load times by 50%
• Implemented responsive design supporting all device types

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2018
• Graduated Magna Cum Laude (GPA: 3.8/4.0)
• Specialized in Machine Learning and Web Technologies
• Teaching Assistant for Advanced Algorithms course

ACHIEVEMENTS & CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2023)
• Led team that won "Best Technical Innovation" at TechNova Hackathon 2023
• Speaker at React Conference 2023: "Building Scalable Component Libraries"
• Open source contributor with 2,000+ GitHub stars across projects`,
      atsScore: 94,
      status: 'active',
      isActive: true,
      uploadedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    });

    console.log('✅ Added resume with high ATS score');

    // Add some impressive job applications
    const applications = [
      {
        id: 'demo-app-1',
        jobTitle: 'Senior Software Engineer',
        company: 'Google',
        status: 'interview_scheduled',
        appliedDate: new Date('2024-01-20'),
        source: 'platform',
        jobDescription: 'Join Google\'s Core team to build the next generation of search infrastructure...',
        applicationUrl: 'https://careers.google.com/jobs/123',
        matchScore: 96,
        salaryRange: '$180,000 - $250,000',
        location: 'Mountain View, CA',
        workMode: 'hybrid'
      },
      {
        id: 'demo-app-2',
        jobTitle: 'Principal Frontend Engineer',
        company: 'Stripe',
        status: 'offer_received',
        appliedDate: new Date('2024-01-18'),
        source: 'platform',
        jobDescription: 'Lead frontend architecture for Stripe\'s next-generation dashboard...',
        applicationUrl: 'https://stripe.com/jobs/456',
        matchScore: 92,
        salaryRange: '$170,000 - $230,000',
        location: 'San Francisco, CA',
        workMode: 'hybrid'
      },
      {
        id: 'demo-app-3',
        jobTitle: 'Senior Full Stack Developer',
        company: 'Airbnb',
        status: 'final_interview',
        appliedDate: new Date('2024-01-16'),
        source: 'extension',
        jobDescription: 'Build scalable systems for Airbnb\'s host and guest experiences...',
        applicationUrl: 'https://careers.airbnb.com/789',
        matchScore: 89,
        salaryRange: '$160,000 - $220,000',
        location: 'San Francisco, CA',
        workMode: 'remote'
      },
      {
        id: 'demo-app-4',
        jobTitle: 'Tech Lead - Platform Engineering',
        company: 'Netflix',
        status: 'applied',
        appliedDate: new Date('2024-01-22'),
        source: 'platform',
        jobDescription: 'Lead platform engineering initiatives at Netflix scale...',
        applicationUrl: 'https://jobs.netflix.com/101112',
        matchScore: 94,
        salaryRange: '$190,000 - $270,000',
        location: 'Los Gatos, CA',
        workMode: 'hybrid'
      },
      {
        id: 'demo-app-5',
        jobTitle: 'Senior Software Engineer - AI',
        company: 'OpenAI',
        status: 'phone_screening',
        appliedDate: new Date('2024-01-19'),
        source: 'extension',
        jobDescription: 'Build AI-powered applications and infrastructure at OpenAI...',
        applicationUrl: 'https://openai.com/careers/131415',
        matchScore: 87,
        salaryRange: '$175,000 - $240,000',
        location: 'San Francisco, CA',
        workMode: 'hybrid'
      }
    ];

    for (const app of applications) {
      await db.insert(schema.jobApplications).values({
        ...app,
        userId: demoUser.id,
        createdAt: new Date(app.appliedDate),
        updatedAt: new Date()
      });
    }

    console.log('✅ Added', applications.length, 'impressive job applications');

    // Add some job analyses to show AI insights
    const jobAnalyses = [
      {
        userId: demoUser.id,
        jobTitle: 'Senior Software Engineer',
        company: 'Google',
        matchScore: 96,
        matchingSkills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'AWS', 'Team Leadership']),
        missingSkills: JSON.stringify(['Go', 'Kubernetes Advanced']),
        tailoringAdvice: 'Your profile is an excellent match for this role. Highlight your experience leading teams of 8+ developers and your work with large-scale systems serving 500K+ users. Consider mentioning any experience with Go or advanced Kubernetes deployments.',
        interviewPrepTips: 'Prepare for system design questions focusing on scalability. Review your experience with microservices architecture and be ready to discuss trade-offs. Google values innovation - prepare examples of how you\'ve introduced new technologies or processes.',
        aiTier: 'premium',
        createdAt: new Date('2024-01-20')
      },
      {
        userId: demoUser.id,
        jobTitle: 'Principal Frontend Engineer',
        company: 'Stripe',
        matchScore: 92,
        matchingSkills: JSON.stringify(['React', 'TypeScript', 'Frontend Architecture', 'Team Leadership']),
        missingSkills: JSON.stringify(['Design Systems', 'WebAssembly']),
        tailoringAdvice: 'Perfect fit for this principal role. Emphasize your frontend expertise and team leadership experience. Stripe values performance - highlight your 60% performance improvements and optimization work.',
        interviewPrepTips: 'Stripe focuses on high-quality code and user experience. Prepare to discuss your approach to building scalable component libraries and optimizing frontend performance. Be ready for detailed technical discussions about React patterns.',
        aiTier: 'premium',
        createdAt: new Date('2024-01-18')
      }
    ];

    for (const analysis of jobAnalyses) {
      await db.insert(schema.jobAnalyses).values({
        ...analysis,
        createdAt: analysis.createdAt,
        updatedAt: new Date()
      });
    }

    console.log('✅ Added', jobAnalyses.length, 'job analyses');

    console.log('\n🎉 Demo user setup complete!');
    console.log('📧 Email: alexandra.chen@example.com');
    console.log('🔑 Password: demo123');
    console.log('\nThis demo user showcases:');
    console.log('• High ATS score (94%) resume');
    console.log('• 6 years senior-level experience');
    console.log('• Applications to top companies (Google, Stripe, Netflix, etc.)');
    console.log('• High match scores (87-96%)');
    console.log('• Diverse application statuses (interviews, offers, etc.)');
    console.log('• Both platform and extension applications');
    console.log('• Comprehensive skill set and achievements');
    console.log('\nPerfect for landing page screenshots! 📸');

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    process.exit(0);
  }
}

createDemoUser();