import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password"), // For email authentication
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").default("job_seeker"), // job_seeker, recruiter
  availableRoles: text("available_roles").default("job_seeker"), // comma-separated: job_seeker,recruiter
  currentRole: varchar("current_role").default("job_seeker"), // active role for current session
  emailVerified: boolean("email_verified").default(false),
  companyName: varchar("company_name"), // For recruiters
  companyWebsite: varchar("company_website"), // For recruiters
  companyLogoUrl: varchar("company_logo_url"), // For recruiters
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  paypalOrderId: varchar("paypal_order_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  razorpayOrderId: varchar("razorpay_order_id"),
  paymentProvider: varchar("payment_provider"), // stripe, paypal, razorpay
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  planType: varchar("plan_type").default("free"), // free, premium, enterprise
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // AI Model Access Control
  aiModelTier: varchar("ai_model_tier").default("premium"), // premium, basic
  premiumTrialStartDate: timestamp("premium_trial_start_date").defaultNow(),
  premiumTrialEndDate: timestamp("premium_trial_end_date").defaultNow(),
  hasUsedPremiumTrial: boolean("has_used_premium_trial").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles with comprehensive onboarding information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Basic Information
  fullName: varchar("full_name"),
  phone: varchar("phone"),
  professionalTitle: varchar("professional_title"),
  location: varchar("location"),
  linkedinUrl: varchar("linkedin_url"),
  githubUrl: varchar("github_url"),
  portfolioUrl: varchar("portfolio_url"),
  
  // Personal Details (commonly asked in forms)
  dateOfBirth: varchar("date_of_birth"),
  gender: varchar("gender"),
  nationality: varchar("nationality"),
  
  // Work Authorization
  workAuthorization: varchar("work_authorization"), // "citizen", "permanent_resident", "visa_required"
  visaStatus: varchar("visa_status"),
  requiresSponsorship: boolean("requires_sponsorship").default(false),
  
  // Location Preferences
  currentAddress: text("current_address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("United States"),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  
  // Work Preferences
  preferredWorkMode: varchar("preferred_work_mode"), // "remote", "hybrid", "onsite"
  desiredSalaryMin: integer("desired_salary_min"),
  desiredSalaryMax: integer("desired_salary_max"),
  salaryCurrency: varchar("salary_currency").default("USD"),
  noticePeriod: varchar("notice_period"), // "immediate", "2_weeks", "1_month", "2_months"
  
  // Education Summary (for quick form filling)  
  highestDegree: varchar("highest_degree"),
  majorFieldOfStudy: varchar("major_field_of_study"),
  graduationYear: integer("graduation_year"),
  
  // Professional Summary
  summary: text("summary"),
  yearsExperience: integer("years_experience"),
  
  // Emergency Contact (sometimes required)
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactRelation: varchar("emergency_contact_relation"),
  
  // Military/Veteran Status (common question)
  veteranStatus: varchar("veteran_status"), // "not_veteran", "veteran", "disabled_veteran"
  
  // Diversity Questions (optional but commonly asked)
  ethnicity: varchar("ethnicity"),
  disabilityStatus: varchar("disability_status"),
  
  // Background Check Consent
  backgroundCheckConsent: boolean("background_check_consent").default(false),
  drugTestConsent: boolean("drug_test_consent").default(false),
  
  // Profile Status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  profileCompletion: integer("profile_completion").default(0),
  lastResumeAnalysis: timestamp("last_resume_analysis"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User skills
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  skillName: varchar("skill_name").notNull(),
  proficiencyLevel: varchar("proficiency_level"), // beginner, intermediate, advanced, expert
  yearsExperience: integer("years_experience"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work experience
export const workExperience = pgTable("work_experience", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  company: varchar("company").notNull(),
  position: varchar("position").notNull(),
  location: varchar("location"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education
export const education = pgTable("education", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institution: varchar("institution").notNull(),
  degree: varchar("degree").notNull(),
  fieldOfStudy: varchar("field_of_study"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  gpa: varchar("gpa"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resumes - stores multiple resumes per user
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(), // User-given name like "Software Engineer Resume"
  fileName: varchar("file_name").notNull(), // Original file name
  filePath: varchar("file_path").notNull(), // Local file system path
  resumeText: text("resume_text"), // Extracted text content for analysis
  isActive: boolean("is_active").default(false), // Which resume to use for applications
  
  // ATS Analysis
  atsScore: integer("ats_score"), // 0-100 ATS compatibility score
  analysisData: jsonb("analysis_data"), // Full Groq analysis results
  recommendations: text("recommendations").array(), // ATS improvement suggestions
  
  // Metadata
  fileSize: integer("file_size"), // File size in bytes
  mimeType: varchar("mime_type"), // application/pdf, etc.
  lastAnalyzed: timestamp("last_analyzed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  jobUrl: varchar("job_url"),
  applicationUrl: varchar("application_url"),
  location: varchar("location"),
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  salaryRange: varchar("salary_range"),
  status: varchar("status").notNull().default("applied"), // applied, under_review, interview, offer, rejected
  appliedDate: timestamp("applied_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  jobDescription: text("job_description"),
  requiredSkills: text("required_skills").array(),
  matchScore: integer("match_score"), // 0-100
  notes: text("notes"),
  source: varchar("source"), // linkedin, indeed, company_website, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Job recommendations
export const jobRecommendations = pgTable("job_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  location: varchar("location"),
  jobUrl: varchar("job_url"),
  salary: varchar("salary"),
  jobType: varchar("job_type"),
  workMode: varchar("work_mode"),
  matchScore: integer("match_score"),
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  jobDescription: text("job_description"),
  requiredSkills: text("required_skills").array(),
  isBookmarked: boolean("is_bookmarked").default(false),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Job Analysis - stores detailed AI analysis of job postings
export const aiJobAnalyses = pgTable("ai_job_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobUrl: varchar("job_url").notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  
  // Raw job data
  jobDescription: text("job_description"),
  requirements: text("requirements"),
  qualifications: text("qualifications"),
  benefits: text("benefits"),
  
  // AI Analysis Results
  matchScore: integer("match_score"), // 0-100
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  skillGaps: jsonb("skill_gaps"), // detailed analysis of missing skills
  
  // Job characteristics extracted by AI
  seniorityLevel: varchar("seniority_level"), // entry, mid, senior, lead, principal
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  salaryRange: varchar("salary_range"),
  location: varchar("location"),
  
  // AI-generated insights
  roleComplexity: varchar("role_complexity"), // low, medium, high
  careerProgression: varchar("career_progression"), // lateral, step-up, stretch
  industryFit: varchar("industry_fit"), // perfect, good, acceptable, poor
  cultureFit: varchar("culture_fit"), // strong, moderate, weak
  
  // Recommendations
  applicationRecommendation: varchar("application_recommendation"), // strongly_recommended, recommended, consider, not_recommended
  tailoringAdvice: text("tailoring_advice"), // AI advice on how to tailor application
  interviewPrepTips: text("interview_prep_tips"),
  
  // Metadata
  analysisVersion: varchar("analysis_version").default("1.0"),
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily usage tracking table for premium limits
export const dailyUsage = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  jobAnalysesCount: integer("job_analyses_count").default(0),
  resumeAnalysesCount: integer("resume_analyses_count").default(0),
  applicationsCount: integer("applications_count").default(0),
  autoFillsCount: integer("auto_fills_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("daily_usage_user_date_idx").on(table.userId, table.date),
]);

// Job postings created by recruiters
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  companyName: varchar("company_name").notNull(),
  companyLogo: varchar("company_logo"), // URL to company logo
  location: varchar("location"),
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  experienceLevel: varchar("experience_level"), // entry, mid, senior, lead
  skills: text("skills").array(), // Required skills
  minSalary: integer("min_salary"),
  maxSalary: integer("max_salary"),
  currency: varchar("currency").default("USD"),
  benefits: text("benefits"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  
  // Promotion and sharing features
  isPromoted: boolean("is_promoted").default(false),
  promotedUntil: timestamp("promoted_until"),
  shareableLink: varchar("shareable_link"),
  
  isActive: boolean("is_active").default(true),
  applicationsCount: integer("applications_count").default(0),
  viewsCount: integer("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced job postings with targeting features
export const jobTargeting = pgTable("job_targeting", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  
  // Targeting criteria
  targetEducationLevel: text("target_education_level").array(), // bachelor, master, phd, etc.
  targetSchools: text("target_schools").array(), // specific universities/colleges
  targetMajors: text("target_majors").array(), // Computer Science, Engineering, etc.
  targetSkills: text("target_skills").array(), // Required or preferred skills
  targetExperienceMin: integer("target_experience_min"),
  targetExperienceMax: integer("target_experience_max"),
  targetLocation: text("target_location").array(), // Specific cities/regions
  targetClubs: text("target_clubs").array(), // Professional organizations, clubs
  targetCertifications: text("target_certifications").array(),
  targetCompanies: text("target_companies").array(), // Previous companies
  
  // Premium features
  isPremiumTargeted: boolean("is_premium_targeted").default(false),
  targetingBudget: integer("targeting_budget"), // Cost in credits/dollars
  targetingStartDate: timestamp("targeting_start_date"),
  targetingEndDate: timestamp("targeting_end_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Scraped jobs from external sources (Spotify-like playlists)
export const scrapedJobs = pgTable("scraped_jobs", {
  id: serial("id").primaryKey(),
  
  // Job details
  title: varchar("title").notNull(),
  company: varchar("company").notNull(),
  description: text("description"),
  location: varchar("location"),
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract
  experienceLevel: varchar("experience_level"),
  salaryRange: varchar("salary_range"),
  skills: text("skills").array(),
  
  // Source information
  sourceUrl: varchar("source_url").notNull(),
  sourcePlatform: varchar("source_platform").notNull(), // linkedin, indeed, glassdoor, etc.
  externalId: varchar("external_id"), // Original job ID from source
  
  // Playlist categorization
  category: varchar("category"), // tech, marketing, sales, design, etc.
  subcategory: varchar("subcategory"), // frontend, backend, full-stack, etc.
  tags: text("tags").array(), // startup, remote-first, benefits, etc.
  
  // Engagement metrics
  viewsCount: integer("views_count").default(0),
  appliedCount: integer("applied_count").default(0),
  savedCount: integer("saved_count").default(0),
  
  // Status and freshness
  isActive: boolean("is_active").default(true),
  lastScraped: timestamp("last_scraped").defaultNow(),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("scraped_jobs_category_idx").on(table.category),
  index("scraped_jobs_source_idx").on(table.sourcePlatform),
  index("scraped_jobs_location_idx").on(table.location),
]);

// Job playlists (Spotify-like collections)
export const jobPlaylists = pgTable("job_playlists", {
  id: serial("id").primaryKey(),
  
  // Playlist metadata
  name: varchar("name").notNull(), // "Remote Frontend Jobs", "AI/ML Opportunities"
  description: text("description"),
  coverImage: varchar("cover_image"), // Playlist thumbnail
  
  // Curation
  curatorId: varchar("curator_id").references(() => users.id), // System or user curated
  isSystemGenerated: boolean("is_system_generated").default(true),
  category: varchar("category").notNull(), // tech, design, marketing, etc.
  
  // Filtering criteria for auto-curation
  autoFilters: jsonb("auto_filters"), // Skills, location, experience criteria
  
  // Engagement
  followersCount: integer("followers_count").default(0),
  jobsCount: integer("jobs_count").default(0),
  
  // Visibility
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("job_playlists_category_idx").on(table.category),
  index("job_playlists_featured_idx").on(table.isFeatured),
]);

// Jobs in playlists (many-to-many relationship)
export const playlistJobs = pgTable("playlist_jobs", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => jobPlaylists.id).notNull(),
  scrapedJobId: integer("scraped_job_id").references(() => scrapedJobs.id),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // Include company posts
  
  // Position in playlist
  order: integer("order").default(0),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("playlist_jobs_playlist_idx").on(table.playlistId),
  index("playlist_jobs_scraped_idx").on(table.scrapedJobId),
]);

// User playlist follows (like Spotify follows)
export const userPlaylistFollows = pgTable("user_playlist_follows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  playlistId: integer("playlist_id").references(() => jobPlaylists.id).notNull(),
  followedAt: timestamp("followed_at").defaultNow(),
}, (table) => [
  index("user_playlist_follows_user_idx").on(table.userId),
]);

// User saved/bookmarked jobs
export const userSavedJobs = pgTable("user_saved_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  scrapedJobId: integer("scraped_job_id").references(() => scrapedJobs.id),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  index("user_saved_jobs_user_idx").on(table.userId),
]);

// Applications to job postings from job seekers
export const jobPostingApplications = pgTable("job_posting_applications", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  applicantId: varchar("applicant_id").references(() => users.id).notNull(),
  resumeId: integer("resume_id").references(() => resumes.id), // Which resume was used
  resumeData: jsonb("resume_data"), // Complete resume data for recruiter access
  coverLetter: text("cover_letter"), // Custom cover letter for this application
  status: varchar("status").default("pending"), // pending, reviewed, shortlisted, interviewed, hired, rejected
  matchScore: integer("match_score"), // AI-calculated compatibility score
  recruiterNotes: text("recruiter_notes"), // Private notes from recruiter
  appliedAt: timestamp("applied_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("job_posting_applications_job_idx").on(table.jobPostingId),
  index("job_posting_applications_applicant_idx").on(table.applicantId),
]);

// Chat system between recruiters and job seekers
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  jobSeekerId: varchar("job_seeker_id").references(() => users.id).notNull(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // Context of the conversation
  applicationId: integer("application_id").references(() => jobPostingApplications.id), // Related application
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chat_conversations_recruiter_idx").on(table.recruiterId),
  index("chat_conversations_job_seeker_idx").on(table.jobSeekerId),
]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, file, system
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chat_messages_conversation_idx").on(table.conversationId),
  index("chat_messages_sender_idx").on(table.senderId),
]);

// Email verification tokens for users
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token").notNull().unique(),
  email: varchar("email").notNull(),
  userId: varchar("user_id").notNull(),
  userType: varchar("user_type").default("job_seeker"), // 'job_seeker' or 'recruiter'
  companyName: varchar("company_name"), // Optional: for recruiter verification
  companyWebsite: varchar("company_website"), // Optional: for recruiter verification
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("email_verification_tokens_token_idx").on(table.token),
  index("email_verification_tokens_email_idx").on(table.email),
  index("email_verification_tokens_user_id_idx").on(table.userId),
]);

// Company email verification tracking
export const companyEmailVerifications = pgTable("company_email_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  companyName: varchar("company_name").notNull(),
  companyWebsite: varchar("company_website"),
  verificationToken: varchar("verification_token").notNull().unique(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("company_email_verifications_user_idx").on(table.userId),
  index("company_email_verifications_email_idx").on(table.email),
  index("company_email_verifications_token_idx").on(table.verificationToken),
]);

// Advanced recruiter features - Job templates for faster posting
export const jobTemplates = pgTable("job_templates", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  templateName: varchar("template_name").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  benefits: text("benefits"),
  skills: text("skills").array(),
  experienceLevel: varchar("experience_level"),
  workMode: varchar("work_mode"),
  jobType: varchar("job_type"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart candidate matching and AI insights
export const candidateMatches = pgTable("candidate_matches", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  matchScore: integer("match_score").notNull(), // 0-100
  skillMatchScore: integer("skill_match_score").notNull(),
  experienceMatchScore: integer("experience_match_score").notNull(),
  locationMatchScore: integer("location_match_score").notNull(),
  salaryMatchScore: integer("salary_match_score").notNull(),
  
  // AI insights
  joinProbability: integer("join_probability"), // 0-100
  engagementScore: integer("engagement_score"), // 0-100
  flightRisk: varchar("flight_risk"), // low, medium, high
  
  // Matching details
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  skillGaps: jsonb("skill_gaps"),
  
  // Recommendations
  approachRecommendation: text("approach_recommendation"),
  personalizedMessage: text("personalized_message"),
  salaryBenchmark: jsonb("salary_benchmark"),
  
  // Status
  isViewed: boolean("is_viewed").default(false),
  isContacted: boolean("is_contacted").default(false),
  recruiterRating: integer("recruiter_rating"), // 1-5 stars
  recruiterNotes: text("recruiter_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_matches_job_idx").on(table.jobPostingId),
  index("candidate_matches_candidate_idx").on(table.candidateId),
  index("candidate_matches_score_idx").on(table.matchScore),
]);

// Interview scheduling and management
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  interviewType: varchar("interview_type").notNull(), // phone, video, onsite, technical
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(60), // minutes
  meetingLink: varchar("meeting_link"),
  location: varchar("location"),
  
  // Interview details
  interviewerName: varchar("interviewer_name"),
  interviewerEmail: varchar("interviewer_email"),
  instructions: text("instructions"),
  questionsTemplate: text("questions_template"),
  
  // Status and results
  status: varchar("status").default("scheduled"), // scheduled, confirmed, completed, cancelled, no_show
  candidateConfirmed: boolean("candidate_confirmed").default(false),
  recruiterNotes: text("recruiter_notes"),
  candidateFeedback: text("candidate_feedback"),
  score: integer("score"), // 1-10
  recommendation: varchar("recommendation"), // hire, maybe, no_hire
  
  // Notifications
  reminderSent: boolean("reminder_sent").default(false),
  confirmationSent: boolean("confirmation_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("interviews_application_idx").on(table.applicationId),
  index("interviews_recruiter_idx").on(table.recruiterId),
  index("interviews_candidate_idx").on(table.candidateId),
  index("interviews_date_idx").on(table.scheduledDate),
]);

// Team collaboration and permissions
export const recruiterTeams = pgTable("recruiter_teams", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull(), // Company identifier
  teamName: varchar("team_name").notNull(),
  teamLead: varchar("team_lead").references(() => users.id).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_teams_company_idx").on(table.companyId),
  index("recruiter_teams_lead_idx").on(table.teamLead),
]);

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => recruiterTeams.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(), // admin, recruiter, viewer
  permissions: text("permissions").array(), // view_jobs, edit_jobs, view_applications, edit_applications, etc.
  addedBy: varchar("added_by").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("team_members_team_idx").on(table.teamId),
  index("team_members_recruiter_idx").on(table.recruiterId),
]);

// Shared notes and collaboration
export const sharedNotes = pgTable("shared_notes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  noteType: varchar("note_type").default("general"), // general, interview, technical, cultural
  isPrivate: boolean("is_private").default(false),
  taggedUsers: text("tagged_users").array(), // user IDs who should be notified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("shared_notes_application_idx").on(table.applicationId),
  index("shared_notes_author_idx").on(table.authorId),
]);

// ATS/CRM integrations
export const atsIntegrations = pgTable("ats_integrations", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  platformName: varchar("platform_name").notNull(), // greenhouse, workday, lever, etc.
  apiKey: varchar("api_key"),
  apiSecret: varchar("api_secret"),
  webhookUrl: varchar("webhook_url"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: varchar("sync_status"), // success, failed, pending
  syncErrors: text("sync_errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ats_integrations_recruiter_idx").on(table.recruiterId),
  index("ats_integrations_platform_idx").on(table.platformName),
]);

// Employer branding and career pages
export const careerPages = pgTable("career_pages", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  companyName: varchar("company_name").notNull(),
  pageName: varchar("page_name").notNull(),
  customUrl: varchar("custom_url").unique(),
  
  // Branding
  logo: varchar("logo"),
  coverImage: varchar("cover_image"),
  brandColors: jsonb("brand_colors"),
  companyDescription: text("company_description"),
  mission: text("mission"),
  values: text("values").array(),
  
  // Content
  videoIntro: varchar("video_intro"),
  teamPhotos: text("team_photos").array(),
  officePhotos: text("office_photos").array(),
  testimonials: jsonb("testimonials"),
  perks: text("perks").array(),
  
  // Settings
  isPublic: boolean("is_public").default(true),
  allowApplications: boolean("allow_applications").default(true),
  customDomain: varchar("custom_domain"),
  
  // Analytics
  viewsCount: integer("views_count").default(0),
  applicationsCount: integer("applications_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("career_pages_recruiter_idx").on(table.recruiterId),
  index("career_pages_url_idx").on(table.customUrl),
]);

// Candidate feedback and surveys
export const candidateFeedback = pgTable("candidate_feedback", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  
  // Feedback scores (1-5)
  applicationProcessRating: integer("application_process_rating"),
  communicationRating: integer("communication_rating"),
  interviewExperienceRating: integer("interview_experience_rating"),
  overallExperienceRating: integer("overall_experience_rating"),
  
  // Feedback details
  whatWorkedWell: text("what_worked_well"),
  whatCouldImprove: text("what_could_improve"),
  wouldRecommend: boolean("would_recommend"),
  additionalComments: text("additional_comments"),
  
  // Status
  surveyCompleted: boolean("survey_completed").default(false),
  feedbackPublic: boolean("feedback_public").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_feedback_application_idx").on(table.applicationId),
  index("candidate_feedback_candidate_idx").on(table.candidateId),
  index("candidate_feedback_recruiter_idx").on(table.recruiterId),
]);

// Security and verification
export const securityVerifications = pgTable("security_verifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  verificationType: varchar("verification_type").notNull(), // identity, employment, education, background
  
  // Verification details
  documentType: varchar("document_type"),
  documentUrl: varchar("document_url"),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, failed, expired
  verificationProvider: varchar("verification_provider"),
  verificationId: varchar("verification_id"),
  
  // Results
  verificationScore: integer("verification_score"), // 0-100
  riskLevel: varchar("risk_level"), // low, medium, high
  flaggedReasons: text("flagged_reasons").array(),
  verificationReport: jsonb("verification_report"),
  
  // Metadata
  requestedBy: varchar("requested_by").references(() => users.id).notNull(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("security_verifications_application_idx").on(table.applicationId),
  index("security_verifications_candidate_idx").on(table.candidateId),
  index("security_verifications_type_idx").on(table.verificationType),
]);

// Performance metrics and analytics
export const recruiterAnalytics = pgTable("recruiter_analytics", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  
  // Job posting metrics
  jobsPosted: integer("jobs_posted").default(0),
  jobsActive: integer("jobs_active").default(0),
  jobViews: integer("job_views").default(0),
  jobApplications: integer("job_applications").default(0),
  
  // Application metrics
  applicationsReviewed: integer("applications_reviewed").default(0),
  applicationsShortlisted: integer("applications_shortlisted").default(0),
  interviewsScheduled: integer("interviews_scheduled").default(0),
  interviewsCompleted: integer("interviews_completed").default(0),
  offersExtended: integer("offers_extended").default(0),
  hires: integer("hires").default(0),
  
  // Performance metrics
  averageTimeToReview: integer("average_time_to_review"), // hours
  averageTimeToInterview: integer("average_time_to_interview"), // hours  
  averageTimeToHire: integer("average_time_to_hire"), // hours
  conversionRate: integer("conversion_rate"), // percentage
  
  // Candidate experience
  averageCandidateRating: integer("average_candidate_rating"), // 1-5
  responseRate: integer("response_rate"), // percentage
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_analytics_recruiter_idx").on(table.recruiterId),
  index("recruiter_analytics_date_idx").on(table.date),
]);

// Test system tables
export const testTemplates = pgTable("test_templates", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "technical", "behavioral", "general"
  jobProfile: varchar("job_profile").notNull(), // "software_engineer", "data_scientist", "marketing", etc.
  difficultyLevel: varchar("difficulty_level").notNull(), // "beginner", "intermediate", "advanced", "expert"
  timeLimit: integer("time_limit").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // percentage (0-100)
  questions: jsonb("questions").notNull(), // array of question objects
  createdBy: varchar("created_by").references(() => users.id), // null for platform templates
  isGlobal: boolean("is_global").default(false), // platform-wide templates
  isActive: boolean("is_active").default(true),
  
  // Question bank integration
  useQuestionBank: boolean("use_question_bank").default(false), // Auto-generate from question bank
  tags: text("tags").array(), // job profile tags for question selection
  aptitudeQuestions: integer("aptitude_questions").default(15), // 50%
  englishQuestions: integer("english_questions").default(6), // 20%
  domainQuestions: integer("domain_questions").default(9), // 30%
  includeExtremeQuestions: boolean("include_extreme_questions").default(true),
  customQuestions: jsonb("custom_questions").default("[]"), // Manual questions
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_templates_job_profile_idx").on(table.jobProfile),
  index("test_templates_difficulty_idx").on(table.difficultyLevel),
  index("test_templates_category_idx").on(table.category),
  index("test_templates_created_by_idx").on(table.createdBy),
]);

// Question bank table for storing pre-built questions
export const questionBank = pgTable("question_bank", {
  id: serial("id").primaryKey(),
  questionId: varchar("question_id").unique().notNull(), // unique identifier from question bank
  type: varchar("type").notNull(), // multiple_choice, coding, etc.
  category: varchar("category").notNull(), // general_aptitude, english, domain_specific
  domain: varchar("domain").notNull(), // general, technical, finance, marketing, etc.
  subCategory: varchar("sub_category").notNull(),
  difficulty: varchar("difficulty").notNull(), // easy, medium, hard, extreme
  question: text("question").notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  points: integer("points").default(5),
  timeLimit: integer("time_limit").default(2), // in minutes
  tags: text("tags").array(),
  keywords: text("keywords").array(),
  
  // Coding question specific fields
  testCases: text("test_cases"),
  boilerplate: text("boilerplate"),
  language: varchar("language"),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("question_bank_category_idx").on(table.category),
  index("question_bank_domain_idx").on(table.domain),
  index("question_bank_difficulty_idx").on(table.difficulty),
  index("question_bank_tags_idx").on(table.tags),
]);

// Test generation logs for tracking auto-generated tests
export const testGenerationLogs = pgTable("test_generation_logs", {
  id: serial("id").primaryKey(),
  testTemplateId: integer("test_template_id").references(() => testTemplates.id),
  assignmentId: integer("assignment_id").references(() => testAssignments.id),
  generatedQuestions: jsonb("generated_questions").notNull(), // Questions selected from bank
  generationParams: jsonb("generation_params").notNull(), // Parameters used for generation
  totalQuestions: integer("total_questions").notNull(),
  aptitudeCount: integer("aptitude_count").default(0),
  englishCount: integer("english_count").default(0),
  domainCount: integer("domain_count").default(0),
  extremeCount: integer("extreme_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("test_generation_logs_template_idx").on(table.testTemplateId),
  index("test_generation_logs_assignment_idx").on(table.assignmentId),
]);

export const testAssignments = pgTable("test_assignments", {
  id: serial("id").primaryKey(),
  testTemplateId: integer("test_template_id").references(() => testTemplates.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  jobSeekerId: varchar("job_seeker_id").references(() => users.id).notNull(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // optional link to job
  
  // Assignment details
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").default("assigned"), // "assigned", "started", "completed", "expired"
  
  // Test taking details
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // percentage (0-100)
  answers: jsonb("answers"), // user's answers
  timeSpent: integer("time_spent"), // in seconds
  
  // Retake system
  retakeAllowed: boolean("retake_allowed").default(false),
  retakePaymentId: varchar("retake_payment_id"), // payment for retake
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(1),
  
  // Notifications
  emailSent: boolean("email_sent").default(false),
  remindersSent: integer("reminders_sent").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_assignments_recruiter_idx").on(table.recruiterId),
  index("test_assignments_job_seeker_idx").on(table.jobSeekerId),
  index("test_assignments_job_posting_idx").on(table.jobPostingId),
  index("test_assignments_status_idx").on(table.status),
  index("test_assignments_due_date_idx").on(table.dueDate),
]);

export const testRetakePayments = pgTable("test_retake_payments", {
  id: serial("id").primaryKey(),
  testAssignmentId: integer("test_assignment_id").references(() => testAssignments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Payment details
  amount: integer("amount").notNull(), // in cents ($5 = 500)
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // "stripe", "paypal", "razorpay"
  paymentIntentId: varchar("payment_intent_id"),
  paymentStatus: varchar("payment_status").default("pending"), // "pending", "completed", "failed"
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_retake_payments_assignment_idx").on(table.testAssignmentId),
  index("test_retake_payments_user_idx").on(table.userId),
  index("test_retake_payments_status_idx").on(table.paymentStatus),
]);

// Ranking Test System - Users can take paid tests for ranking
export const rankingTests = pgTable("ranking_tests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testTemplateId: integer("test_template_id").references(() => testTemplates.id),
  
  // Test details
  testTitle: varchar("test_title").notNull(),
  category: varchar("category").notNull(), // "technical", "behavioral", "general"
  domain: varchar("domain").notNull(), // "general", "technical", "finance", "marketing", etc.
  difficultyLevel: varchar("difficulty_level").notNull(),
  
  // Performance metrics
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  totalScore: integer("total_score").notNull(),
  maxScore: integer("max_score").notNull(),
  percentageScore: integer("percentage_score").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  
  // Ranking data
  rank: integer("rank"), // Global rank at time of completion
  weeklyRank: integer("weekly_rank"), // Rank within the week
  monthlyRank: integer("monthly_rank"), // Rank within the month
  categoryRank: integer("category_rank"), // Rank within category
  
  // Test session data
  answers: jsonb("answers").notNull(), // detailed answers
  questions: jsonb("questions").notNull(), // questions asked
  antiCheatViolations: integer("anti_cheat_violations").default(0),
  
  // Status
  status: varchar("status").default("completed"), // completed, disqualified
  isSharedToRecruiters: boolean("is_shared_to_recruiters").default(false),
  
  // Payment
  paymentId: varchar("payment_id"),
  paymentProvider: varchar("payment_provider"), // stripe, paypal, razorpay
  paymentStatus: varchar("payment_status").default("pending"), // pending, completed, failed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ranking_tests_user_idx").on(table.userId),
  index("ranking_tests_category_idx").on(table.category),
  index("ranking_tests_domain_idx").on(table.domain),
  index("ranking_tests_rank_idx").on(table.rank),
  index("ranking_tests_weekly_rank_idx").on(table.weeklyRank),
  index("ranking_tests_monthly_rank_idx").on(table.monthlyRank),
  index("ranking_tests_created_at_idx").on(table.createdAt),
]);

// Weekly ranking leaderboard
export const weeklyRankings = pgTable("weekly_rankings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testId: integer("test_id").references(() => rankingTests.id).notNull(),
  
  // Week info
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  
  // Ranking data
  rank: integer("rank").notNull(),
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  totalScore: integer("total_score").notNull(),
  percentageScore: integer("percentage_score").notNull(),
  
  // Reward status
  isTopPerformer: boolean("is_top_performer").default(false), // Top 10
  resumeSharedToRecruiters: boolean("resume_shared_to_recruiters").default(false),
  shareCount: integer("share_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("weekly_rankings_user_idx").on(table.userId),
  index("weekly_rankings_week_idx").on(table.weekStart),
  index("weekly_rankings_rank_idx").on(table.rank),
  index("weekly_rankings_category_idx").on(table.category),
  index("weekly_rankings_top_performer_idx").on(table.isTopPerformer),
]);

// Monthly ranking leaderboard
export const monthlyRankings = pgTable("monthly_rankings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Month info
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  
  // Ranking data
  rank: integer("rank").notNull(),
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  totalTests: integer("total_tests").default(0),
  averageScore: integer("average_score").notNull(),
  bestScore: integer("best_score").notNull(),
  
  // Profile sharing
  profileSharedCount: integer("profile_shared_count").default(0), // Times shared this month
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("monthly_rankings_user_idx").on(table.userId),
  index("monthly_rankings_month_year_idx").on(table.month, table.year),
  index("monthly_rankings_rank_idx").on(table.rank),
  index("monthly_rankings_category_idx").on(table.category),
]);

// Recruiter access to rankings
export const recruiterRankingAccess = pgTable("recruiter_ranking_access", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  
  // Access details
  accessType: varchar("access_type").notNull(), // "weekly_top", "monthly_share", "direct_access"
  rankingType: varchar("ranking_type").notNull(), // "weekly", "monthly", "category"
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  
  // Candidate performance
  candidateRank: integer("candidate_rank").notNull(),
  candidateScore: integer("candidate_score").notNull(),
  testDetails: jsonb("test_details").notNull(),
  
  // Recruiter interaction
  viewed: boolean("viewed").default(false),
  contacted: boolean("contacted").default(false),
  interviewScheduled: boolean("interview_scheduled").default(false),
  notes: text("notes"),
  
  // Timing
  sharedAt: timestamp("shared_at").defaultNow(),
  viewedAt: timestamp("viewed_at"),
  contactedAt: timestamp("contacted_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_ranking_access_recruiter_idx").on(table.recruiterId),
  index("recruiter_ranking_access_candidate_idx").on(table.candidateId),
  index("recruiter_ranking_access_type_idx").on(table.accessType),
  index("recruiter_ranking_access_viewed_idx").on(table.viewed),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  skills: many(userSkills),
  workExperience: many(workExperience),
  education: many(education),
  applications: many(jobApplications),
  recommendations: many(jobRecommendations),
  aiJobAnalyses: many(aiJobAnalyses),
  dailyUsage: many(dailyUsage),
  // Recruiter relations
  jobPostings: many(jobPostings),
  jobPostingApplications: many(jobPostingApplications),
  recruiterConversations: many(chatConversations, { relationName: "recruiterChats" }),
  jobSeekerConversations: many(chatConversations, { relationName: "jobSeekerChats" }),
  sentMessages: many(chatMessages),
  emailVerificationTokens: many(emailVerificationTokens),
  // Test system relations
  createdTestTemplates: many(testTemplates),
  assignedTests: many(testAssignments, { relationName: "assignedTests" }),
  receivedTests: many(testAssignments, { relationName: "receivedTests" }),
  testRetakePayments: many(testRetakePayments),
  // Mock interview relations
  mockInterviews: many(mockInterviews),
  interviewPayments: many(interviewPayments),
  interviewStats: one(userInterviewStats),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  recruiter: one(users, {
    fields: [jobPostings.recruiterId],
    references: [users.id],
  }),
  applications: many(jobPostingApplications),
  conversations: many(chatConversations),
}));

export const jobPostingApplicationsRelations = relations(jobPostingApplications, ({ one }) => ({
  jobPosting: one(jobPostings, {
    fields: [jobPostingApplications.jobPostingId],
    references: [jobPostings.id],
  }),
  applicant: one(users, {
    fields: [jobPostingApplications.applicantId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [jobPostingApplications.resumeId],
    references: [resumes.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  recruiter: one(users, {
    fields: [chatConversations.recruiterId],
    references: [users.id],
    relationName: "recruiterChats",
  }),
  jobSeeker: one(users, {
    fields: [chatConversations.jobSeekerId],
    references: [users.id],
    relationName: "jobSeekerChats",
  }),
  jobPosting: one(jobPostings, {
    fields: [chatConversations.jobPostingId],
    references: [jobPostings.id],
  }),
  application: one(jobPostingApplications, {
    fields: [chatConversations.applicationId],
    references: [jobPostingApplications.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// No relations needed for email verification tokens as they are temporary

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
}));

export const workExperienceRelations = relations(workExperience, ({ one }) => ({
  user: one(users, {
    fields: [workExperience.userId],
    references: [users.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  user: one(users, {
    fields: [education.userId],
    references: [users.id],
  }),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  user: one(users, {
    fields: [jobApplications.userId],
    references: [users.id],
  }),
}));

export const jobRecommendationsRelations = relations(jobRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [jobRecommendations.userId],
    references: [users.id],
  }),
}));

export const aiJobAnalysesRelations = relations(aiJobAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [aiJobAnalyses.userId],
    references: [users.id],
  }),
}));

export const dailyUsageRelations = relations(dailyUsage, ({ one }) => ({
  user: one(users, {
    fields: [dailyUsage.userId],
    references: [users.id],
  }),
}));

// Test system relations
export const testTemplatesRelations = relations(testTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testTemplates.createdBy],
    references: [users.id],
  }),
  assignments: many(testAssignments),
}));

export const testAssignmentsRelations = relations(testAssignments, ({ one, many }) => ({
  testTemplate: one(testTemplates, {
    fields: [testAssignments.testTemplateId],
    references: [testTemplates.id],
  }),
  recruiter: one(users, {
    fields: [testAssignments.recruiterId],
    references: [users.id],
    relationName: "assignedTests",
  }),
  jobSeeker: one(users, {
    fields: [testAssignments.jobSeekerId],
    references: [users.id],
    relationName: "receivedTests",
  }),
  jobPosting: one(jobPostings, {
    fields: [testAssignments.jobPostingId],
    references: [jobPostings.id],
  }),
  retakePayments: many(testRetakePayments),
}));

export const testRetakePaymentsRelations = relations(testRetakePayments, ({ one }) => ({
  testAssignment: one(testAssignments, {
    fields: [testRetakePayments.testAssignmentId],
    references: [testAssignments.id],
  }),
  user: one(users, {
    fields: [testRetakePayments.userId],
    references: [users.id],
  }),
}));

// Subscription management for premium plans
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tier: varchar("tier").notNull(), // subscription tier ID
  status: varchar("status").notNull(), // 'pending', 'active', 'cancelled', 'expired'
  paymentMethod: varchar("payment_method").notNull(), // 'paypal', 'razorpay'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  billingCycle: varchar("billing_cycle").notNull(), // 'monthly', 'yearly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paymentId: varchar("payment_id"),
  autoRenew: boolean("auto_renew").default(true),
  activatedAt: timestamp("activated_at"),
  cancelledAt: timestamp("cancelled_at"),
  renewedAt: timestamp("renewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("subscriptions_user_idx").on(table.userId),
  index("subscriptions_status_idx").on(table.status),
  index("subscriptions_tier_idx").on(table.tier),
]);

// Career AI Analysis storage for persistence
export const careerAiAnalyses = pgTable("career_ai_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  careerGoal: varchar("career_goal").notNull(),
  location: varchar("location"),
  timeframe: varchar("timeframe"),
  progressUpdate: text("progress_update"),
  completedTasks: text("completed_tasks").array(),
  analysisData: jsonb("analysis_data").notNull(), // Full AI response
  insights: jsonb("insights"), // Structured insights array
  careerPath: jsonb("career_path"), // Career path object
  skillGaps: jsonb("skill_gaps"), // Skill gaps array
  networkingOpportunities: jsonb("networking_opportunities"), // Networking data
  marketTiming: jsonb("market_timing"), // Market timing insights
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("career_ai_analyses_user_idx").on(table.userId),
  index("career_ai_analyses_active_idx").on(table.isActive),
]);

export const careerAiAnalysesRelations = relations(careerAiAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [careerAiAnalyses.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  id: true,
  createdAt: true,
});

export const insertWorkExperienceSchema = createInsertSchema(workExperience).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(education).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  appliedDate: true,
  lastUpdated: true,
});

export const insertJobRecommendationSchema = createInsertSchema(jobRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertAiJobAnalysisSchema = createInsertSchema(aiJobAnalyses).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;
export type WorkExperience = typeof workExperience.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Education = typeof education.$inferSelect;

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobRecommendation = z.infer<typeof insertJobRecommendationSchema>;
export type JobRecommendation = typeof jobRecommendations.$inferSelect;
export type InsertAiJobAnalysis = z.infer<typeof insertAiJobAnalysisSchema>;
export type AiJobAnalysis = typeof aiJobAnalyses.$inferSelect;

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New insert schemas for recruiter functionality
export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  applicationsCount: true,
  viewsCount: true,
});

export const insertJobPostingApplicationSchema = createInsertSchema(jobPostingApplications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Test system insert schemas
export const insertTestTemplateSchema = createInsertSchema(testTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestAssignmentSchema = createInsertSchema(testAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestRetakePaymentSchema = createInsertSchema(testRetakePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerAiAnalysisSchema = createInsertSchema(careerAiAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Ranking system schemas
export const insertRankingTestSchema = createInsertSchema(rankingTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyRankingSchema = createInsertSchema(weeklyRankings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyRankingSchema = createInsertSchema(monthlyRankings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecruiterRankingAccessSchema = createInsertSchema(recruiterRankingAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertDailyUsage = z.infer<typeof insertDailyUsageSchema>;
export type DailyUsage = typeof dailyUsage.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPostingApplication = z.infer<typeof insertJobPostingApplicationSchema>;
export type JobPostingApplication = typeof jobPostingApplications.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

// Company email verification schemas
export const insertCompanyEmailVerificationSchema = createInsertSchema(companyEmailVerifications);
export type InsertCompanyEmailVerification = z.infer<typeof insertCompanyEmailVerificationSchema>;
export type CompanyEmailVerification = typeof companyEmailVerifications.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Test system types
export type TestTemplate = typeof testTemplates.$inferSelect;
export type InsertTestTemplate = z.infer<typeof insertTestTemplateSchema>;
export type TestAssignment = typeof testAssignments.$inferSelect;
export type InsertTestAssignment = z.infer<typeof insertTestAssignmentSchema>;
export type TestRetakePayment = typeof testRetakePayments.$inferSelect;
export type InsertTestRetakePayment = z.infer<typeof insertTestRetakePaymentSchema>;

// Career AI Analysis types
export type CareerAiAnalysis = typeof careerAiAnalyses.$inferSelect;
export type InsertCareerAiAnalysis = z.infer<typeof insertCareerAiAnalysisSchema>;

// Ranking system types
export type RankingTest = typeof rankingTests.$inferSelect;
export type InsertRankingTest = z.infer<typeof insertRankingTestSchema>;
export type WeeklyRanking = typeof weeklyRankings.$inferSelect;
export type InsertWeeklyRanking = z.infer<typeof insertWeeklyRankingSchema>;
export type MonthlyRanking = typeof monthlyRankings.$inferSelect;
export type InsertMonthlyRanking = z.infer<typeof insertMonthlyRankingSchema>;
export type RecruiterRankingAccess = typeof recruiterRankingAccess.$inferSelect;
export type InsertRecruiterRankingAccess = z.infer<typeof insertRecruiterRankingAccessSchema>;

// Mock Interview Sessions
export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").unique().notNull(),
  interviewType: varchar("interview_type").default("technical"), // technical, behavioral, system_design
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  role: varchar("role").default("software_engineer"), // role being interviewed for
  company: varchar("company"), // optional company context
  language: varchar("language").default("javascript"), // programming language
  status: varchar("status").default("active"), // active, completed, abandoned
  currentQuestion: integer("current_question").default(1),
  totalQuestions: integer("total_questions").default(3),
  timeRemaining: integer("time_remaining").default(3600), // in seconds
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"), // overall score 0-100
  feedback: text("feedback"), // AI generated feedback
  isPaid: boolean("is_paid").default(false), // whether this interview was paid for
  paymentId: varchar("payment_id"), // reference to payment transaction
  
  // Recruiter assignment system
  assignedBy: varchar("assigned_by").references(() => users.id), // recruiter who assigned this interview
  assignmentType: varchar("assignment_type").default("self"), // self, recruiter_assigned
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // linked job posting
  assignedAt: timestamp("assigned_at"),
  dueDate: timestamp("due_date"),
  emailSent: boolean("email_sent").default(false),
  
  // Result sharing control
  resultsSharedWithRecruiter: boolean("results_shared_with_recruiter").default(false),
  partialResultsOnly: boolean("partial_results_only").default(true), // only show summary to recruiter
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(2),
  bestAttemptId: integer("best_attempt_id"), // ID of best scoring attempt
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("mock_interviews_user_idx").on(table.userId),
  index("mock_interviews_status_idx").on(table.status),
  index("mock_interviews_assigned_by_idx").on(table.assignedBy),
  index("mock_interviews_assignment_type_idx").on(table.assignmentType),
  index("mock_interviews_job_posting_idx").on(table.jobPostingId),
]);

// Mock Interview Questions
export const mockInterviewQuestions = pgTable("mock_interview_questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => mockInterviews.id).notNull(),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  questionType: varchar("question_type").default("coding"), // coding, behavioral, system_design
  difficulty: varchar("difficulty").default("medium"),
  hints: jsonb("hints").default("[]"), // Array of hints
  testCases: jsonb("test_cases").default("[]"), // For coding questions
  sampleAnswer: text("sample_answer"), // Expected answer/solution
  userAnswer: text("user_answer"), // User's submitted answer
  userCode: text("user_code"), // User's code submission
  score: integer("score"), // question score 0-100
  timeSpent: integer("time_spent"), // time spent in seconds
  feedback: text("feedback"), // AI feedback for this question
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions for mock interviews
export const interviewPayments = pgTable("interview_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interviewId: integer("interview_id").references(() => mockInterviews.id),
  amount: integer("amount").notNull(), // amount in cents
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // stripe, paypal, razorpay
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent ID
  paypalOrderId: varchar("paypal_order_id"), // PayPal order ID
  razorpayPaymentId: varchar("razorpay_payment_id"), // Razorpay payment ID
  razorpayOrderId: varchar("razorpay_order_id"), // Razorpay order ID
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  metadata: jsonb("metadata"), // Additional payment metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Retake payments for both mock and virtual interviews
export const interviewRetakePayments = pgTable("interview_retake_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interviewType: varchar("interview_type").notNull(), // mock, virtual
  interviewId: integer("interview_id").notNull(), // references either mock or virtual interview
  
  // Payment details
  amount: integer("amount").notNull().default(500), // $5 in cents
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // stripe, paypal, razorpay
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent ID
  paypalOrderId: varchar("paypal_order_id"), // PayPal order ID
  razorpayPaymentId: varchar("razorpay_payment_id"), // Razorpay payment ID
  razorpayOrderId: varchar("razorpay_order_id"), // Razorpay order ID
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  
  // Retake info
  retakeNumber: integer("retake_number").notNull(),
  previousScore: integer("previous_score"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("interview_retake_payments_user_idx").on(table.userId),
  index("interview_retake_payments_interview_idx").on(table.interviewId, table.interviewType),
  index("interview_retake_payments_status_idx").on(table.status),
]);

// User interview statistics
export const userInterviewStats = pgTable("user_interview_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalInterviews: integer("total_interviews").default(0),
  freeInterviewsUsed: integer("free_interviews_used").default(0),
  paidInterviews: integer("paid_interviews").default(0),
  averageScore: integer("average_score").default(0),
  bestScore: integer("best_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  lastInterviewDate: timestamp("last_interview_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mock Interview Relations
export const mockInterviewsRelations = relations(mockInterviews, ({ one, many }) => ({
  user: one(users, {
    fields: [mockInterviews.userId],
    references: [users.id],
  }),
  questions: many(mockInterviewQuestions),
  payment: one(interviewPayments, {
    fields: [mockInterviews.paymentId],
    references: [interviewPayments.id],
  }),
}));

export const mockInterviewQuestionsRelations = relations(mockInterviewQuestions, ({ one }) => ({
  interview: one(mockInterviews, {
    fields: [mockInterviewQuestions.interviewId],
    references: [mockInterviews.id],
  }),
}));

export const interviewPaymentsRelations = relations(interviewPayments, ({ one }) => ({
  user: one(users, {
    fields: [interviewPayments.userId],
    references: [users.id],
  }),
  interview: one(mockInterviews, {
    fields: [interviewPayments.interviewId],
    references: [mockInterviews.id],
  }),
}));

export const userInterviewStatsRelations = relations(userInterviewStats, ({ one }) => ({
  user: one(users, {
    fields: [userInterviewStats.userId],
    references: [users.id],
  }),
}));

// Mock Interview Insert Schemas
export const insertMockInterviewSchema = createInsertSchema(mockInterviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMockInterviewQuestionSchema = createInsertSchema(mockInterviewQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewPaymentSchema = createInsertSchema(interviewPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewRetakePaymentSchema = createInsertSchema(interviewRetakePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserInterviewStatsSchema = createInsertSchema(userInterviewStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Virtual AI Interview System - Conversational interview experience
export const virtualInterviews = pgTable("virtual_interviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").unique().notNull(),
  
  // Interview configuration
  interviewType: varchar("interview_type").default("technical"), // technical, behavioral, mixed, system_design
  role: varchar("role").default("software_engineer"), // role being interviewed for
  company: varchar("company"), // optional company context
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  duration: integer("duration").default(30), // in minutes
  
  // AI interviewer configuration
  interviewerPersonality: varchar("interviewer_personality").default("professional"), // friendly, professional, challenging
  interviewStyle: varchar("interview_style").default("conversational"), // conversational, structured, adaptive
  
  // Session state
  status: varchar("status").default("active"), // active, completed, paused, abandoned
  currentStep: varchar("current_step").default("introduction"), // introduction, main_questions, follow_ups, conclusion
  questionsAsked: integer("questions_asked").default(0),
  totalQuestions: integer("total_questions").default(5),
  
  // Timing
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  timeRemaining: integer("time_remaining"), // in seconds
  pausedTime: integer("paused_time").default(0), // total time paused
  
  // Performance metrics
  overallScore: integer("overall_score"), // 0-100
  technicalScore: integer("technical_score"), // 0-100
  communicationScore: integer("communication_score"), // 0-100
  confidenceScore: integer("confidence_score"), // 0-100
  
  // AI feedback
  strengths: text("strengths").array().default("[]"),
  weaknesses: text("weaknesses").array().default("[]"),
  recommendations: text("recommendations").array().default("[]"),
  detailedFeedback: text("detailed_feedback"),
  
  // Interview context
  jobDescription: text("job_description"), // context for tailored questions
  resumeContext: text("resume_context"), // user's background for personalized questions
  
  // Payment and access
  isPaid: boolean("is_paid").default(false),
  paymentId: varchar("payment_id"),
  
  // Recruiter assignment system
  assignedBy: varchar("assigned_by").references(() => users.id), // recruiter who assigned this interview
  assignmentType: varchar("assignment_type").default("self"), // self, recruiter_assigned
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // linked job posting
  assignedAt: timestamp("assigned_at"),
  dueDate: timestamp("due_date"),
  emailSent: boolean("email_sent").default(false),
  
  // Result sharing control
  resultsSharedWithRecruiter: boolean("results_shared_with_recruiter").default(false),
  partialResultsOnly: boolean("partial_results_only").default(true), // only show summary to recruiter
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(2),
  bestAttemptId: integer("best_attempt_id"), // ID of best scoring attempt
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interviews_user_idx").on(table.userId),
  index("virtual_interviews_status_idx").on(table.status),
  index("virtual_interviews_type_idx").on(table.interviewType),
  index("virtual_interviews_created_idx").on(table.createdAt),
  index("virtual_interviews_assigned_by_idx").on(table.assignedBy),
  index("virtual_interviews_assignment_type_idx").on(table.assignmentType),
  index("virtual_interviews_job_posting_idx").on(table.jobPostingId),
]);

// Virtual interview messages - Chat-like conversation log
export const virtualInterviewMessages = pgTable("virtual_interview_messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => virtualInterviews.id).notNull(),
  
  // Message details
  sender: varchar("sender").notNull(), // "interviewer", "candidate"
  messageType: varchar("message_type").default("text"), // text, question, answer, feedback, system
  content: text("content").notNull(),
  
  // Question-specific data
  questionCategory: varchar("question_category"), // technical, behavioral, follow_up
  difficulty: varchar("difficulty"), // easy, medium, hard
  expectedAnswer: text("expected_answer"), // AI's expected response for scoring
  
  // Response analysis
  responseTime: integer("response_time"), // time taken to respond in seconds
  responseQuality: integer("response_quality"), // 1-10 AI assessment
  keywordsMatched: text("keywords_matched").array().default("[]"),
  sentiment: varchar("sentiment"), // positive, neutral, negative
  confidence: integer("confidence"), // 1-100 AI confidence in assessment
  
  // AI scoring for this exchange
  technicalAccuracy: integer("technical_accuracy"), // 0-100
  clarityScore: integer("clarity_score"), // 0-100
  depthScore: integer("depth_score"), // 0-100
  
  // Metadata
  timestamp: timestamp("timestamp").defaultNow(),
  messageIndex: integer("message_index").notNull(), // order in conversation
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("virtual_interview_messages_interview_idx").on(table.interviewId),
  index("virtual_interview_messages_sender_idx").on(table.sender),
  index("virtual_interview_messages_type_idx").on(table.messageType),
  index("virtual_interview_messages_order_idx").on(table.interviewId, table.messageIndex),
]);

// Virtual interview feedback sessions - Post-interview detailed analysis
export const virtualInterviewFeedback = pgTable("virtual_interview_feedback", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => virtualInterviews.id).notNull(),
  
  // Overall performance analysis
  performanceSummary: text("performance_summary").notNull(),
  keyStrengths: text("key_strengths").array().notNull(),
  areasForImprovement: text("areas_for_improvement").array().notNull(),
  
  // Detailed scoring breakdown
  technicalSkillsScore: integer("technical_skills_score").notNull(), // 0-100
  problemSolvingScore: integer("problem_solving_score").notNull(), // 0-100
  communicationScore: integer("communication_score").notNull(), // 0-100
  teamworkScore: integer("teamwork_score"), // 0-100 (if applicable)
  leadershipScore: integer("leadership_score"), // 0-100 (if applicable)
  
  // Interview-specific metrics
  responseConsistency: integer("response_consistency").notNull(), // 0-100
  adaptabilityScore: integer("adaptability_score").notNull(), // 0-100
  stressHandling: integer("stress_handling").notNull(), // 0-100
  
  // Personalized recommendations
  skillGaps: text("skill_gaps").array().default("[]"),
  recommendedResources: jsonb("recommended_resources").default("[]"), // Learning resources
  practiceAreas: text("practice_areas").array().default("[]"),
  nextSteps: text("next_steps").array().default("[]"),
  
  // Market insights
  marketComparison: text("market_comparison"), // How they compare to others
  salaryInsights: text("salary_insights"), // Based on performance
  roleReadiness: varchar("role_readiness").notNull(), // ready, needs_practice, significant_gaps
  
  // AI confidence and methodology
  aiConfidenceScore: integer("ai_confidence_score").notNull(), // 0-100
  analysisMethod: varchar("analysis_method").default("groq_ai"), // AI model used
  feedbackVersion: varchar("feedback_version").default("1.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interview_feedback_interview_idx").on(table.interviewId),
  index("virtual_interview_feedback_role_readiness_idx").on(table.roleReadiness),
  index("virtual_interview_feedback_created_idx").on(table.createdAt),
]);

// Virtual interview user stats and progress tracking
export const virtualInterviewStats = pgTable("virtual_interview_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Usage statistics
  totalInterviews: integer("total_interviews").default(0),
  completedInterviews: integer("completed_interviews").default(0),
  freeInterviewsUsed: integer("free_interviews_used").default(0),
  monthlyInterviewsUsed: integer("monthly_interviews_used").default(0),
  lastMonthlyReset: timestamp("last_monthly_reset").defaultNow(),
  averageScore: integer("average_score").default(0),
  bestScore: integer("best_score").default(0),
  
  // Progress tracking
  improvementRate: integer("improvement_rate").default(0), // percentage improvement over time
  consistencyScore: integer("consistency_score").default(0), // performance consistency
  
  // Interview type performance
  technicalInterviewAvg: integer("technical_interview_avg").default(0),
  behavioralInterviewAvg: integer("behavioral_interview_avg").default(0),
  systemDesignAvg: integer("system_design_avg").default(0),
  
  // Skill development
  strongestSkills: text("strongest_skills").array().default("[]"),
  improvingSkills: text("improving_skills").array().default("[]"),
  needsWorkSkills: text("needs_work_skills").array().default("[]"),
  
  // Engagement metrics
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  averageSessionLength: integer("average_session_length").default(0), // in minutes
  lastInterviewDate: timestamp("last_interview_date"),
  
  // Milestone tracking
  milestonesAchieved: text("milestones_achieved").array().default("[]"),
  nextMilestone: varchar("next_milestone"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interview_stats_user_idx").on(table.userId),
  index("virtual_interview_stats_score_idx").on(table.bestScore),
  index("virtual_interview_stats_last_interview_idx").on(table.lastInterviewDate),
]);

// Virtual interview insert schemas
export const insertVirtualInterviewSchema = createInsertSchema(virtualInterviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVirtualInterviewMessageSchema = createInsertSchema(virtualInterviewMessages).omit({
  id: true,
  createdAt: true,
});

export const insertVirtualInterviewFeedbackSchema = createInsertSchema(virtualInterviewFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVirtualInterviewStatsSchema = createInsertSchema(virtualInterviewStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Mock Interview Types
export type MockInterview = typeof mockInterviews.$inferSelect;
export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterviewQuestion = typeof mockInterviewQuestions.$inferSelect;
export type InsertMockInterviewQuestion = z.infer<typeof insertMockInterviewQuestionSchema>;
export type InterviewPayment = typeof interviewPayments.$inferSelect;
export type InsertInterviewPayment = z.infer<typeof insertInterviewPaymentSchema>;
export type InterviewRetakePayment = typeof interviewRetakePayments.$inferSelect;
export type InsertInterviewRetakePayment = z.infer<typeof insertInterviewRetakePaymentSchema>;
export type UserInterviewStats = typeof userInterviewStats.$inferSelect;
export type InsertUserInterviewStats = z.infer<typeof insertUserInterviewStatsSchema>;

// Virtual AI Interview Types
export type VirtualInterview = typeof virtualInterviews.$inferSelect;
export type InsertVirtualInterview = z.infer<typeof insertVirtualInterviewSchema>;
export type VirtualInterviewMessage = typeof virtualInterviewMessages.$inferSelect;
export type InsertVirtualInterviewMessage = z.infer<typeof insertVirtualInterviewMessageSchema>;
export type VirtualInterviewFeedback = typeof virtualInterviewFeedback.$inferSelect;
export type InsertVirtualInterviewFeedback = z.infer<typeof insertVirtualInterviewFeedbackSchema>;
export type VirtualInterviewStats = typeof virtualInterviewStats.$inferSelect;
export type InsertVirtualInterviewStats = z.infer<typeof insertVirtualInterviewStatsSchema>;
