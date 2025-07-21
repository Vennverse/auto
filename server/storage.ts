import {
  users,
  userProfiles,
  userSkills,
  workExperience,
  education,
  jobApplications,
  jobRecommendations,
  aiJobAnalyses,
  resumes,
  jobPostings,
  jobPostingApplications,
  chatConversations,
  chatMessages,
  emailVerificationTokens,
  companyEmailVerifications,
  passwordResetTokens,
  testTemplates,
  testAssignments,
  testRetakePayments,
  testGenerationLogs,
  mockInterviews,
  mockInterviewQuestions,
  interviewPayments,
  userInterviewStats,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type UserSkill,
  type InsertUserSkill,
  type WorkExperience,
  type InsertWorkExperience,
  type Education,
  type InsertEducation,
  type JobApplication,
  type InsertJobApplication,
  type JobRecommendation,
  type InsertJobRecommendation,
  type AiJobAnalysis,
  type InsertAiJobAnalysis,
  type Resume,
  type InsertResume,
  type JobPosting,
  type InsertJobPosting,
  type JobPostingApplication,
  type InsertJobPostingApplication,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type CompanyEmailVerification,
  type InsertCompanyEmailVerification,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type TestTemplate,
  type InsertTestTemplate,
  type TestAssignment,
  type InsertTestAssignment,
  type TestRetakePayment,
  type InsertTestRetakePayment,
  type MockInterview,
  type InsertMockInterview,
  type MockInterviewQuestion,
  type InsertMockInterviewQuestion,
  type InterviewPayment,
  type InsertInterviewPayment,
  type UserInterviewStats,
  type InsertUserInterviewStats,
} from "@shared/schema";
import { db } from "./db";

// Helper function to handle database errors gracefully
async function handleDbOperation<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.message?.includes('endpoint is disabled') || error.message?.includes('Control plane request failed')) {
      console.warn('Database operation failed due to Replit DB issues, using fallback');
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error('Database temporarily unavailable');
    }
    throw error;
  }
}
import { eq, desc, and, or, ne, sql, lt, isNotNull, count, isNull, asc, like } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  
  // Resume operations
  getUserResumes(userId: string): Promise<any[]>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  // Skills operations
  getUserSkills(userId: string): Promise<UserSkill[]>;
  addUserSkill(skill: InsertUserSkill): Promise<UserSkill>;
  deleteUserSkill(id: number): Promise<void>;
  
  // Work experience operations
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;
  addWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience>;
  updateWorkExperience(id: number, experience: Partial<InsertWorkExperience>): Promise<WorkExperience>;
  deleteWorkExperience(id: number): Promise<void>;
  
  // Education operations
  getUserEducation(userId: string): Promise<Education[]>;
  addEducation(education: InsertEducation): Promise<Education>;
  updateEducation(id: number, education: Partial<InsertEducation>): Promise<Education>;
  deleteEducation(id: number): Promise<void>;
  
  // Job applications operations
  getUserApplications(userId: string): Promise<JobApplication[]>;
  addJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, application: Partial<InsertJobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  getApplicationStats(userId: string): Promise<{
    totalApplications: number;
    interviews: number;
    responseRate: number;
    avgMatchScore: number;
  }>;
  
  // Job recommendations operations
  getUserRecommendations(userId: string): Promise<JobRecommendation[]>;
  addJobRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation>;
  updateJobRecommendation(id: number, recommendation: Partial<InsertJobRecommendation>): Promise<JobRecommendation>;
  toggleBookmark(id: number): Promise<JobRecommendation>;
  
  // AI Job Analysis operations
  getUserJobAnalyses(userId: string): Promise<AiJobAnalysis[]>;
  addJobAnalysis(analysis: InsertAiJobAnalysis): Promise<AiJobAnalysis>;
  getJobAnalysisByUrl(userId: string, jobUrl: string): Promise<AiJobAnalysis | undefined>;
  updateJobAnalysis(id: number, analysis: Partial<InsertAiJobAnalysis>): Promise<AiJobAnalysis>;
  
  // Subscription operations
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User>;
  getUserByPaypalSubscription(paypalSubscriptionId: string): Promise<User | undefined>;

  // Recruiter operations
  // Job postings
  getJobPostings(recruiterId?: string): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, jobPosting: Partial<InsertJobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: number): Promise<void>;
  incrementJobPostingViews(id: number): Promise<void>;
  
  // Job posting applications
  getJobPostingApplications(jobPostingId: number): Promise<JobPostingApplication[]>;
  getJobPostingApplication(id: number): Promise<JobPostingApplication | undefined>;
  getApplicationsForRecruiter(recruiterId: string): Promise<JobPostingApplication[]>;
  getApplicationsForJobSeeker(jobSeekerId: string): Promise<JobPostingApplication[]>;
  createJobPostingApplication(application: InsertJobPostingApplication): Promise<JobPostingApplication>;
  updateJobPostingApplication(id: number, application: Partial<InsertJobPostingApplication>): Promise<JobPostingApplication>;
  deleteJobPostingApplication(id: number): Promise<void>;
  
  // Chat system
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  getChatConversation(id: number): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatMessages(conversationId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  
  // Email verification
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  deleteEmailVerificationTokensByUserId(userId: string): Promise<void>;
  updateUserEmailVerification(userId: string, verified: boolean): Promise<User>;
  
  // Test system operations
  getTestTemplates(jobProfile?: string, isGlobal?: boolean): Promise<TestTemplate[]>;
  getTestTemplate(id: number): Promise<TestTemplate | undefined>;
  createTestTemplate(template: InsertTestTemplate): Promise<TestTemplate>;
  updateTestTemplate(id: number, template: Partial<InsertTestTemplate>): Promise<TestTemplate>;
  deleteTestTemplate(id: number): Promise<void>;
  
  // Test assignments
  getTestAssignments(recruiterId?: string, jobSeekerId?: string): Promise<TestAssignment[]>;
  getTestAssignment(id: number): Promise<TestAssignment | undefined>;
  createTestAssignment(assignment: InsertTestAssignment): Promise<TestAssignment>;
  updateTestAssignment(id: number, assignment: Partial<InsertTestAssignment>): Promise<TestAssignment>;
  deleteTestAssignment(id: number): Promise<void>;
  
  // Test retake payments
  getTestRetakePayments(userId: string): Promise<TestRetakePayment[]>;
  getTestRetakePayment(id: number): Promise<TestRetakePayment | undefined>;
  createTestRetakePayment(payment: InsertTestRetakePayment): Promise<TestRetakePayment>;
  updateTestRetakePayment(id: number, payment: Partial<InsertTestRetakePayment>): Promise<TestRetakePayment>;

  // Mock interview operations
  getMockInterviews(userId: string): Promise<MockInterview[]>;
  getMockInterview(id: number): Promise<MockInterview | undefined>;
  getMockInterviewBySessionId(sessionId: string): Promise<MockInterview | undefined>;
  createMockInterview(interview: InsertMockInterview): Promise<MockInterview>;
  updateMockInterview(id: number, interview: Partial<InsertMockInterview>): Promise<MockInterview>;
  deleteMockInterview(id: number): Promise<void>;
  
  // Mock interview questions
  getMockInterviewQuestions(interviewId: number): Promise<MockInterviewQuestion[]>;
  getMockInterviewQuestion(id: number): Promise<MockInterviewQuestion | undefined>;
  createMockInterviewQuestion(question: InsertMockInterviewQuestion): Promise<MockInterviewQuestion>;
  updateMockInterviewQuestion(id: number, question: Partial<InsertMockInterviewQuestion>): Promise<MockInterviewQuestion>;
  deleteMockInterviewQuestion(id: number): Promise<void>;
  
  // Interview payments
  getInterviewPayments(userId: string): Promise<InterviewPayment[]>;
  getInterviewPayment(id: number): Promise<InterviewPayment | undefined>;
  createInterviewPayment(payment: InsertInterviewPayment): Promise<InterviewPayment>;
  updateInterviewPayment(id: number, payment: Partial<InsertInterviewPayment>): Promise<InterviewPayment>;
  
  // User interview stats
  getUserInterviewStats(userId: string): Promise<UserInterviewStats | undefined>;
  upsertUserInterviewStats(stats: InsertUserInterviewStats): Promise<UserInterviewStats>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    return await handleDbOperation(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    }, undefined);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await handleDbOperation(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    }, undefined);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }, userData as User);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await db
        .update(users)
        .set({ 
          currentRole: role,
          userType: role,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profileData.userId);
    
    if (existing) {
      const [profile] = await db
        .update(userProfiles)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(userProfiles.userId, profileData.userId))
        .returning();
      return profile;
    } else {
      const [profile] = await db
        .insert(userProfiles)
        .values(profileData)
        .returning();
      return profile;
    }
  }

  // Skills operations
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId));
  }

  async addUserSkill(skill: InsertUserSkill): Promise<UserSkill> {
    const [newSkill] = await db
      .insert(userSkills)
      .values(skill)
      .returning();
    return newSkill;
  }

  async deleteUserSkill(id: number): Promise<void> {
    await db.delete(userSkills).where(eq(userSkills.id, id));
  }

  // Work experience operations
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    return await db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId))
      .orderBy(desc(workExperience.startDate));
  }

  async addWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience> {
    const [newExperience] = await db
      .insert(workExperience)
      .values(experience)
      .returning();
    return newExperience;
  }

  async updateWorkExperience(id: number, experienceData: Partial<InsertWorkExperience>): Promise<WorkExperience> {
    const [updatedExperience] = await db
      .update(workExperience)
      .set(experienceData)
      .where(eq(workExperience.id, id))
      .returning();
    return updatedExperience;
  }

  async deleteWorkExperience(id: number): Promise<void> {
    await db.delete(workExperience).where(eq(workExperience.id, id));
  }

  // Education operations
  async getUserEducation(userId: string): Promise<Education[]> {
    return await db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(desc(education.startDate));
  }

  async addEducation(educationData: InsertEducation): Promise<Education> {
    const [newEducation] = await db
      .insert(education)
      .values(educationData)
      .returning();
    return newEducation;
  }

  async updateEducation(id: number, educationData: Partial<InsertEducation>): Promise<Education> {
    const [updatedEducation] = await db
      .update(education)
      .set(educationData)
      .where(eq(education.id, id))
      .returning();
    return updatedEducation;
  }

  async deleteEducation(id: number): Promise<void> {
    await db.delete(education).where(eq(education.id, id));
  }

  // Job applications operations
  async getUserApplications(userId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedDate));
  }

  async addJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateJobApplication(id: number, applicationData: Partial<InsertJobApplication>): Promise<JobApplication> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({ ...applicationData, lastUpdated: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
  }

  async getApplicationStats(userId: string): Promise<{
    totalApplications: number;
    interviews: number;
    responseRate: number;
    avgMatchScore: number;
  }> {
    const applications = await this.getUserApplications(userId);
    
    const totalApplications = applications.length;
    const interviews = applications.filter(app => app.status === 'interview' || app.status === 'offer').length;
    const responseRate = totalApplications > 0 ? Math.round((interviews / totalApplications) * 100) : 0;
    const avgMatchScore = applications.length > 0 
      ? Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applications.length)
      : 0;

    return {
      totalApplications,
      interviews,
      responseRate,
      avgMatchScore,
    };
  }

  // Job recommendations operations
  async getUserRecommendations(userId: string): Promise<JobRecommendation[]> {
    return await db
      .select()
      .from(jobRecommendations)
      .where(eq(jobRecommendations.userId, userId))
      .orderBy(desc(jobRecommendations.matchScore));
  }

  async addJobRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation> {
    const [newRecommendation] = await db
      .insert(jobRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async updateJobRecommendation(id: number, recommendationData: Partial<InsertJobRecommendation>): Promise<JobRecommendation> {
    const [updatedRecommendation] = await db
      .update(jobRecommendations)
      .set(recommendationData)
      .where(eq(jobRecommendations.id, id))
      .returning();
    return updatedRecommendation;
  }

  async toggleBookmark(id: number): Promise<JobRecommendation> {
    const [recommendation] = await db
      .select()
      .from(jobRecommendations)
      .where(eq(jobRecommendations.id, id));
    
    const [updated] = await db
      .update(jobRecommendations)
      .set({ isBookmarked: !recommendation.isBookmarked })
      .where(eq(jobRecommendations.id, id))
      .returning();
    
    return updated;
  }

  // AI Job Analysis operations
  async getUserJobAnalyses(userId: string): Promise<AiJobAnalysis[]> {
    return await db
      .select()
      .from(aiJobAnalyses)
      .where(eq(aiJobAnalyses.userId, userId))
      .orderBy(desc(aiJobAnalyses.createdAt));
  }

  async addJobAnalysis(analysis: InsertAiJobAnalysis): Promise<AiJobAnalysis> {
    const [newAnalysis] = await db
      .insert(aiJobAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getJobAnalysisByUrl(userId: string, jobUrl: string): Promise<AiJobAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(aiJobAnalyses)
      .where(and(eq(aiJobAnalyses.userId, userId), eq(aiJobAnalyses.jobUrl, jobUrl)))
      .orderBy(desc(aiJobAnalyses.createdAt));
    return analysis;
  }

  async updateJobAnalysis(id: number, analysisData: Partial<InsertAiJobAnalysis>): Promise<AiJobAnalysis> {
    const [updatedAnalysis] = await db
      .update(aiJobAnalyses)
      .set(analysisData)
      .where(eq(aiJobAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByPaypalSubscription(paypalSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.paypalSubscriptionId, paypalSubscriptionId));
    return user;
  }

  // Resume operations for demo user
  async getUserResumes(userId: string): Promise<any[]> {
    // For demo user, manage state in memory
    if (userId === 'demo-user-id') {
      // Initialize with demo resume if no uploads exist
      if (!(global as any).demoUserResumes) {
        (global as any).demoUserResumes = [
          {
            id: 1,
            name: "Demo Resume",
            fileName: "demo_resume.pdf",
            isActive: true,
            atsScore: 85,
            uploadedAt: new Date('2024-01-15'),
            fileSize: 245000,
            fileType: 'application/pdf',
            analysis: {
              atsScore: 85,
              recommendations: ["Add more technical keywords", "Improve formatting"],
              keywordOptimization: {
                missingKeywords: ["React", "TypeScript"],
                overusedKeywords: [],
                suggestions: ["Include specific technologies"]
              },
              formatting: {
                score: 80,
                issues: ["Inconsistent spacing"],
                improvements: ["Use consistent bullet points"]
              },
              content: {
                strengthsFound: ["Strong technical background"],
                weaknesses: ["Could add more quantified achievements"],
                suggestions: ["Include metrics and numbers"]
              }
            }
          }
        ];
      }
      
      return (global as any).demoUserResumes;
    }
    
    // For real users, query the database
    try {
      console.log(`[DEBUG] Fetching resumes for user: ${userId}`);
      const userResumes = await db.select().from(resumes).where(eq(resumes.userId, userId));
      console.log(`[DEBUG] Found ${userResumes.length} resumes for user ${userId}`);
      const formattedResumes = userResumes.map(resume => ({
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        filename: resume.fileName, // Keep both for compatibility
        text: resume.resumeText,
        atsScore: resume.atsScore,
        uploadedAt: resume.createdAt,
        userId: resume.userId,
        fileSize: resume.fileSize,
        fileType: resume.mimeType,
        mimeType: resume.mimeType,
        isActive: resume.isActive,
        analysis: resume.analysisData || null,
        recommendations: resume.recommendations || [],
        filePath: resume.filePath // Add file path for new storage system
      }));
      console.log(`[DEBUG] Returning ${formattedResumes.length} formatted resumes for user ${userId}`);
      return formattedResumes;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch resumes for user ${userId}:`, error);
      return [];
    }
  }

  async storeResume(userId: string, resumeData: any): Promise<any> {
    return await handleDbOperation(async () => {
      // Store the original file data without compression
      let fileData = resumeData.fileData;
      
      console.log(`[DEBUG] Storing resume for user: ${userId}, file: ${resumeData.fileName}`);
      
      const [newResume] = await db.insert(resumes).values({
        userId,
        name: resumeData.name,
        fileName: resumeData.fileName,
        fileData: fileData, // Store original file data
        resumeText: resumeData.resumeText,
        atsScore: resumeData.atsScore,
        analysisData: resumeData.analysis,
        recommendations: resumeData.recommendations,
        fileSize: resumeData.fileSize,
        mimeType: resumeData.mimeType,
        isActive: resumeData.isActive || false,
        lastAnalyzed: new Date(),
      }).returning();
      
      console.log(`[DEBUG] Resume stored in database for user: ${userId}, resume ID: ${newResume.id}`);
      return newResume;
    });
  }

  private async compressData(buffer: Buffer): Promise<Buffer> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    return await gzipAsync(buffer);
  }

  private async decompressData(buffer: Buffer): Promise<Buffer> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    return await gunzipAsync(buffer);
  }

  // Recruiter operations - Job postings
  async getJobPostings(recruiterId?: string): Promise<JobPosting[]> {
    return await handleDbOperation(async () => {
      if (recruiterId) {
        return await db.select().from(jobPostings).where(eq(jobPostings.recruiterId, recruiterId)).orderBy(desc(jobPostings.createdAt));
      }
      return await db.select().from(jobPostings).where(eq(jobPostings.isActive, true)).orderBy(desc(jobPostings.createdAt));
    }, []);
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(jobPostings).where(eq(jobPostings.isActive, true)).orderBy(desc(jobPostings.createdAt));
    }, []);
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
      return jobPosting;
    });
  }

  async createJobPosting(jobPostingData: InsertJobPosting): Promise<JobPosting> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await db.insert(jobPostings).values(jobPostingData).returning();
      return jobPosting;
    });
  }

  async updateJobPosting(id: number, jobPostingData: Partial<InsertJobPosting>): Promise<JobPosting> {
    return await handleDbOperation(async () => {
      const [jobPosting] = await db
        .update(jobPostings)
        .set({ ...jobPostingData, updatedAt: new Date() })
        .where(eq(jobPostings.id, id))
        .returning();
      return jobPosting;
    });
  }

  async deleteJobPosting(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(jobPostings).where(eq(jobPostings.id, id));
    });
  }

  async incrementJobPostingViews(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db
        .update(jobPostings)
        .set({ viewsCount: sql`${jobPostings.viewsCount} + 1` })
        .where(eq(jobPostings.id, id));
    });
  }

  // Job posting applications
  async getJobPostingApplications(jobPostingId: number): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(jobPostingApplications).where(eq(jobPostingApplications.jobPostingId, jobPostingId)).orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async getJobPostingApplication(id: number): Promise<JobPostingApplication | undefined> {
    return await handleDbOperation(async () => {
      const [application] = await db.select().from(jobPostingApplications).where(eq(jobPostingApplications.id, id));
      return application;
    });
  }

  async getApplicationsForRecruiter(recruiterId: string): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await db
        .select({
          id: jobPostingApplications.id,
          jobPostingId: jobPostingApplications.jobPostingId,
          applicantId: jobPostingApplications.applicantId,
          resumeId: jobPostingApplications.resumeId,
          coverLetter: jobPostingApplications.coverLetter,
          status: jobPostingApplications.status,
          matchScore: jobPostingApplications.matchScore,
          recruiterNotes: jobPostingApplications.recruiterNotes,
          appliedAt: jobPostingApplications.appliedAt,
          reviewedAt: jobPostingApplications.reviewedAt,
          updatedAt: jobPostingApplications.updatedAt,
          resumeData: sql`NULL`.as('resumeData'),
          // Include job posting information directly as separate fields
          jobPostingTitle: jobPostings.title,
          jobPostingCompany: jobPostings.companyName,
          jobPostingLocation: jobPostings.location,
          jobPostingType: jobPostings.jobType,
          jobPostingWorkMode: jobPostings.workMode,
          // Include applicant information
          applicantName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('applicantName'),
          applicantEmail: users.email,
          applicantFirstName: users.firstName,
          applicantLastName: users.lastName,
        })
        .from(jobPostingApplications)
        .innerJoin(jobPostings, eq(jobPostingApplications.jobPostingId, jobPostings.id))
        .leftJoin(users, eq(jobPostingApplications.applicantId, users.id))
        .where(eq(jobPostings.recruiterId, recruiterId))
        .orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async getApplicationsForJobSeeker(jobSeekerId: string): Promise<JobPostingApplication[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(jobPostingApplications).where(eq(jobPostingApplications.applicantId, jobSeekerId)).orderBy(desc(jobPostingApplications.appliedAt));
    }, []);
  }

  async createJobPostingApplication(applicationData: InsertJobPostingApplication): Promise<JobPostingApplication> {
    return await handleDbOperation(async () => {
      const [application] = await db.insert(jobPostingApplications).values(applicationData).returning();
      
      // Increment applications count
      await db
        .update(jobPostings)
        .set({ applicationsCount: sql`${jobPostings.applicationsCount} + 1` })
        .where(eq(jobPostings.id, applicationData.jobPostingId));
      
      return application;
    });
  }

  async updateJobPostingApplication(id: number, applicationData: Partial<InsertJobPostingApplication>): Promise<JobPostingApplication> {
    return await handleDbOperation(async () => {
      const [application] = await db
        .update(jobPostingApplications)
        .set({ ...applicationData, updatedAt: new Date() })
        .where(eq(jobPostingApplications.id, id))
        .returning();
      return application;
    });
  }

  async deleteJobPostingApplication(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(jobPostingApplications).where(eq(jobPostingApplications.id, id));
    });
  }

  // Chat system
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return await handleDbOperation(async () => {
      return await db
        .select()
        .from(chatConversations)
        .where(
          or(
            eq(chatConversations.recruiterId, userId),
            eq(chatConversations.jobSeekerId, userId)
          )
        )
        .orderBy(desc(chatConversations.lastMessageAt));
    }, []);
  }

  async getChatConversation(id: number): Promise<ChatConversation | undefined> {
    return await handleDbOperation(async () => {
      const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
      return conversation;
    });
  }

  async createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation> {
    return await handleDbOperation(async () => {
      const [conversation] = await db.insert(chatConversations).values(conversationData).returning();
      return conversation;
    });
  }

  async getChatMessages(conversationId: number): Promise<ChatMessage[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
    }, []);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    return await handleDbOperation(async () => {
      const [message] = await db.insert(chatMessages).values(messageData).returning();
      
      // Update conversation's last message timestamp
      await db
        .update(chatConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatConversations.id, messageData.conversationId));
      
      return message;
    });
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    return await handleDbOperation(async () => {
      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(chatMessages.conversationId, conversationId),
            ne(chatMessages.senderId, userId)
          )
        );
    });
  }

  // Email verification
  async createEmailVerificationToken(tokenData: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    return await handleDbOperation(async () => {
      const [token] = await db.insert(emailVerificationTokens).values(tokenData).returning();
      return token;
    });
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    return await handleDbOperation(async () => {
      const [tokenRecord] = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
      return tokenRecord;
    });
  }

  async deleteEmailVerificationToken(token: string): Promise<void> {
    return await handleDbOperation(async () => {
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    });
  }

  async deleteEmailVerificationTokensByUserId(userId: string): Promise<void> {
    return await handleDbOperation(async () => {
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
    });
  }



  async updateUserEmailVerification(userId: string, verified: boolean): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await db
        .update(users)
        .set({ emailVerified: verified, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  // Password Reset Token methods
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    return await handleDbOperation(async () => {
      const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
      return token;
    });
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return await handleDbOperation(async () => {
      const [tokenRecord] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return tokenRecord;
    });
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    });
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await handleDbOperation(async () => {
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.token, token));
    });
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await handleDbOperation(async () => {
      await db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, new Date()));
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    return await handleDbOperation(async () => {
      const [user] = await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  // Company Email Verification methods
  async createCompanyEmailVerification(verificationData: InsertCompanyEmailVerification): Promise<CompanyEmailVerification> {
    return await handleDbOperation(async () => {
      const [verification] = await db.insert(companyEmailVerifications).values(verificationData).returning();
      return verification;
    });
  }

  async getCompanyEmailVerification(token: string): Promise<CompanyEmailVerification | undefined> {
    return await handleDbOperation(async () => {
      const [verification] = await db.select().from(companyEmailVerifications)
        .where(eq(companyEmailVerifications.verificationToken, token));
      return verification;
    });
  }

  async verifyCompanyEmail(token: string): Promise<CompanyEmailVerification> {
    return await handleDbOperation(async () => {
      const [verification] = await db
        .update(companyEmailVerifications)
        .set({ 
          isVerified: true, 
          verifiedAt: new Date() 
        })
        .where(eq(companyEmailVerifications.verificationToken, token))
        .returning();
      return verification;
    });
  }

  async getCompanyEmailVerificationByUserId(userId: string): Promise<CompanyEmailVerification[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(companyEmailVerifications)
        .where(eq(companyEmailVerifications.userId, userId))
        .orderBy(desc(companyEmailVerifications.createdAt));
    }, []);
  }

  // Test system operations
  async getTestTemplates(jobProfile?: string, isGlobal?: boolean): Promise<TestTemplate[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [eq(testTemplates.isActive, true)];
      
      if (jobProfile) {
        conditions.push(eq(testTemplates.jobProfile, jobProfile));
      }
      
      if (isGlobal !== undefined) {
        conditions.push(eq(testTemplates.isGlobal, isGlobal));
      }
      
      return await db.select().from(testTemplates)
        .where(and(...conditions))
        .orderBy(desc(testTemplates.createdAt));
    }, []);
  }

  async getTestTemplate(id: number): Promise<TestTemplate | undefined> {
    return await handleDbOperation(async () => {
      const [template] = await db.select().from(testTemplates).where(eq(testTemplates.id, id));
      return template;
    }, undefined);
  }

  async createTestTemplate(template: InsertTestTemplate): Promise<TestTemplate> {
    return await handleDbOperation(async () => {
      const [newTemplate] = await db.insert(testTemplates).values(template).returning();
      return newTemplate;
    });
  }

  async updateTestTemplate(id: number, template: Partial<InsertTestTemplate>): Promise<TestTemplate> {
    return await handleDbOperation(async () => {
      const [updatedTemplate] = await db
        .update(testTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(testTemplates.id, id))
        .returning();
      return updatedTemplate;
    });
  }

  async deleteTestTemplate(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(testTemplates).where(eq(testTemplates.id, id));
    });
  }

  // Individual test question operations (these decode JSON from template.questions field)
  async getTestTemplateQuestions(templateId: number): Promise<any[]> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(templateId);
      if (!template || !template.questions) {
        return [];
      }
      
      try {
        const questions = JSON.parse(template.questions);
        return Array.isArray(questions) ? questions : [];
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
        return [];
      }
    }, []);
  }

  async createTestQuestion(question: any): Promise<any> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(question.testTemplateId);
      if (!template) {
        throw new Error('Test template not found');
      }
      
      let questions = [];
      try {
        questions = template.questions ? JSON.parse(template.questions) : [];
      } catch (error) {
        questions = [];
      }
      
      // Add new question with unique ID
      const newQuestion = {
        ...question,
        id: `q${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      questions.push(newQuestion);
      
      // Update template with new questions array
      await this.updateTestTemplate(question.testTemplateId, {
        questions: JSON.stringify(questions)
      });
      
      return newQuestion;
    });
  }

  async updateTestQuestion(questionId: string, updatedQuestion: any): Promise<any> {
    return await handleDbOperation(async () => {
      const template = await this.getTestTemplate(updatedQuestion.testTemplateId);
      if (!template) {
        throw new Error('Test template not found');
      }
      
      let questions = [];
      try {
        questions = template.questions ? JSON.parse(template.questions) : [];
      } catch (error) {
        questions = [];
      }
      
      // Find and update the question
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);
      if (questionIndex === -1) {
        throw new Error('Question not found');
      }
      
      questions[questionIndex] = {
        ...questions[questionIndex],
        ...updatedQuestion,
        updatedAt: new Date().toISOString()
      };
      
      // Update template with modified questions array
      await this.updateTestTemplate(updatedQuestion.testTemplateId, {
        questions: JSON.stringify(questions)
      });
      
      return questions[questionIndex];
    });
  }

  async deleteTestQuestion(questionId: string): Promise<void> {
    // This function needs the template ID, which we'll need to find first
    // For now, we'll implement it in a way that searches through templates
    await handleDbOperation(async () => {
      // Find all templates to locate the question
      const templates = await this.getTestTemplates();
      
      for (const template of templates) {
        if (!template.questions) continue;
        
        try {
          let questions = JSON.parse(template.questions);
          const originalLength = questions.length;
          questions = questions.filter((q: any) => q.id !== questionId);
          
          if (questions.length < originalLength) {
            // Question was found and removed
            await this.updateTestTemplate(template.id, {
              questions: JSON.stringify(questions)
            });
            return;
          }
        } catch (error) {
          continue;
        }
      }
      
      throw new Error('Question not found');
    });
  }

  // Test assignments
  async getTestAssignments(recruiterId?: string, jobSeekerId?: string): Promise<TestAssignment[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [];
      
      if (recruiterId) {
        conditions.push(eq(testAssignments.recruiterId, recruiterId));
      }
      
      if (jobSeekerId) {
        conditions.push(eq(testAssignments.jobSeekerId, jobSeekerId));
      }
      
      if (conditions.length > 0) {
        return await db.select().from(testAssignments)
          .where(and(...conditions))
          .orderBy(desc(testAssignments.assignedAt));
      } else {
        return await db.select().from(testAssignments)
          .orderBy(desc(testAssignments.assignedAt));
      }
    }, []);
  }

  async getTestAssignment(id: number): Promise<TestAssignment | undefined> {
    return await handleDbOperation(async () => {
      const [assignment] = await db.select().from(testAssignments).where(eq(testAssignments.id, id));
      return assignment;
    }, undefined);
  }

  async createTestAssignment(assignment: InsertTestAssignment): Promise<TestAssignment> {
    return await handleDbOperation(async () => {
      const [newAssignment] = await db.insert(testAssignments).values(assignment).returning();
      return newAssignment;
    });
  }

  async updateTestAssignment(id: number, assignment: Partial<InsertTestAssignment>): Promise<TestAssignment> {
    return await handleDbOperation(async () => {
      const [updatedAssignment] = await db
        .update(testAssignments)
        .set({ ...assignment, updatedAt: new Date() })
        .where(eq(testAssignments.id, id))
        .returning();
      return updatedAssignment;
    });
  }

  async deleteTestAssignment(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(testAssignments).where(eq(testAssignments.id, id));
    });
  }

  // Test retake payments
  async getTestRetakePayments(userId: string): Promise<TestRetakePayment[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(testRetakePayments)
        .where(eq(testRetakePayments.userId, userId))
        .orderBy(desc(testRetakePayments.createdAt));
    }, []);
  }

  async getTestRetakePayment(id: number): Promise<TestRetakePayment | undefined> {
    return await handleDbOperation(async () => {
      const [payment] = await db.select().from(testRetakePayments).where(eq(testRetakePayments.id, id));
      return payment;
    }, undefined);
  }

  async createTestRetakePayment(payment: InsertTestRetakePayment): Promise<TestRetakePayment> {
    return await handleDbOperation(async () => {
      const [newPayment] = await db.insert(testRetakePayments).values(payment).returning();
      return newPayment;
    });
  }

  async updateTestRetakePayment(id: number, payment: Partial<InsertTestRetakePayment>): Promise<TestRetakePayment> {
    return await handleDbOperation(async () => {
      const [updatedPayment] = await db
        .update(testRetakePayments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(testRetakePayments.id, id))
        .returning();
      return updatedPayment;
    });
  }

  // Test generation logs for tracking auto-generated tests
  async createTestGenerationLog(log: {
    testTemplateId: number;
    assignmentId: number;
    generatedQuestions: any[];
    generationParams: any;
    totalQuestions: number;
    aptitudeCount: number;
    englishCount: number;
    domainCount: number;
    extremeCount: number;
  }): Promise<any> {
    return await handleDbOperation(async () => {
      const [newLog] = await db.insert(testGenerationLogs).values(log).returning();
      return newLog;
    });
  }

  async getTestGenerationLogs(testTemplateId?: number, assignmentId?: number): Promise<any[]> {
    return await handleDbOperation(async () => {
      let conditions: any[] = [];
      
      if (testTemplateId) {
        conditions.push(eq(testGenerationLogs.testTemplateId, testTemplateId));
      }
      
      if (assignmentId) {
        conditions.push(eq(testGenerationLogs.assignmentId, assignmentId));
      }
      
      if (conditions.length > 0) {
        return await db.select().from(testGenerationLogs)
          .where(and(...conditions))
          .orderBy(desc(testGenerationLogs.createdAt));
      } else {
        return await db.select().from(testGenerationLogs)
          .orderBy(desc(testGenerationLogs.createdAt));
      }
    }, []);
  }

  // Mock interview operations
  async getMockInterviews(userId: string): Promise<MockInterview[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(mockInterviews)
        .where(eq(mockInterviews.userId, userId))
        .orderBy(desc(mockInterviews.createdAt));
    }, []);
  }

  async getMockInterview(id: number): Promise<MockInterview | undefined> {
    return await handleDbOperation(async () => {
      const [interview] = await db.select().from(mockInterviews).where(eq(mockInterviews.id, id));
      return interview;
    }, undefined);
  }

  async getMockInterviewBySessionId(sessionId: string, userId?: string): Promise<MockInterview | undefined> {
    return await handleDbOperation(async () => {
      const conditions = [eq(mockInterviews.sessionId, sessionId)];
      if (userId) {
        conditions.push(eq(mockInterviews.userId, userId));
      }
      const [interview] = await db.select().from(mockInterviews).where(and(...conditions));
      return interview;
    }, undefined);
  }

  async createMockInterview(interview: InsertMockInterview): Promise<MockInterview> {
    return await handleDbOperation(async () => {
      console.log('🔍 Inserting interview into database:', interview);
      const [newInterview] = await db.insert(mockInterviews).values(interview).returning();
      console.log('🔍 Interview inserted, result:', newInterview);
      return newInterview;
    });
  }

  async updateMockInterview(id: number, interview: Partial<InsertMockInterview>): Promise<MockInterview> {
    return await handleDbOperation(async () => {
      const [updatedInterview] = await db
        .update(mockInterviews)
        .set({ ...interview, updatedAt: new Date() })
        .where(eq(mockInterviews.id, id))
        .returning();
      return updatedInterview;
    });
  }

  async deleteMockInterview(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(mockInterviews).where(eq(mockInterviews.id, id));
    });
  }

  // Mock interview questions
  async getMockInterviewQuestions(interviewId: number): Promise<MockInterviewQuestion[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(mockInterviewQuestions)
        .where(eq(mockInterviewQuestions.interviewId, interviewId))
        .orderBy(mockInterviewQuestions.questionNumber);
    }, []);
  }

  async getMockInterviewQuestion(id: number): Promise<MockInterviewQuestion | undefined> {
    return await handleDbOperation(async () => {
      const [question] = await db.select().from(mockInterviewQuestions).where(eq(mockInterviewQuestions.id, id));
      return question;
    }, undefined);
  }

  async createMockInterviewQuestion(question: InsertMockInterviewQuestion): Promise<MockInterviewQuestion> {
    return await handleDbOperation(async () => {
      const [newQuestion] = await db.insert(mockInterviewQuestions).values(question).returning();
      return newQuestion;
    });
  }

  async updateMockInterviewQuestion(id: number, question: Partial<InsertMockInterviewQuestion>): Promise<MockInterviewQuestion> {
    return await handleDbOperation(async () => {
      const [updatedQuestion] = await db
        .update(mockInterviewQuestions)
        .set({ ...question, updatedAt: new Date() })
        .where(eq(mockInterviewQuestions.id, id))
        .returning();
      return updatedQuestion;
    });
  }

  async deleteMockInterviewQuestion(id: number): Promise<void> {
    await handleDbOperation(async () => {
      await db.delete(mockInterviewQuestions).where(eq(mockInterviewQuestions.id, id));
    });
  }

  // Interview payments
  async getInterviewPayments(userId: string): Promise<InterviewPayment[]> {
    return await handleDbOperation(async () => {
      return await db.select().from(interviewPayments)
        .where(eq(interviewPayments.userId, userId))
        .orderBy(desc(interviewPayments.createdAt));
    }, []);
  }

  async getInterviewPayment(id: number): Promise<InterviewPayment | undefined> {
    return await handleDbOperation(async () => {
      const [payment] = await db.select().from(interviewPayments).where(eq(interviewPayments.id, id));
      return payment;
    }, undefined);
  }

  async createInterviewPayment(payment: InsertInterviewPayment): Promise<InterviewPayment> {
    return await handleDbOperation(async () => {
      const [newPayment] = await db.insert(interviewPayments).values(payment).returning();
      return newPayment;
    });
  }

  async updateInterviewPayment(id: number, payment: Partial<InsertInterviewPayment>): Promise<InterviewPayment> {
    return await handleDbOperation(async () => {
      const [updatedPayment] = await db
        .update(interviewPayments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(interviewPayments.id, id))
        .returning();
      return updatedPayment;
    });
  }

  // User interview stats
  async getUserInterviewStats(userId: string): Promise<UserInterviewStats | undefined> {
    return await handleDbOperation(async () => {
      let [stats] = await db.select().from(userInterviewStats).where(eq(userInterviewStats.userId, userId));
      
      // If no stats exist, create default stats
      if (!stats) {
        const defaultStats = {
          userId,
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          freeInterviewsUsed: 0,
          bestScore: 0,
          totalTimeSpent: 0
        };
        
        [stats] = await db.insert(userInterviewStats).values(defaultStats).returning();
      }
      
      return stats;
    }, undefined);
  }

  async upsertUserInterviewStats(stats: InsertUserInterviewStats): Promise<UserInterviewStats> {
    return await handleDbOperation(async () => {
      const [upsertedStats] = await db
        .insert(userInterviewStats)
        .values(stats)
        .onConflictDoUpdate({
          target: userInterviewStats.userId,
          set: {
            ...stats,
            updatedAt: new Date(),
          },
        })
        .returning();
      return upsertedStats;
    });
  }
}

export const storage = new DatabaseStorage();
