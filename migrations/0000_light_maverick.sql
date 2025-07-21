CREATE TABLE "ai_job_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_url" varchar NOT NULL,
	"job_title" varchar NOT NULL,
	"company" varchar NOT NULL,
	"job_description" text,
	"requirements" text,
	"qualifications" text,
	"benefits" text,
	"match_score" integer,
	"matching_skills" text[],
	"missing_skills" text[],
	"skill_gaps" jsonb,
	"seniority_level" varchar,
	"work_mode" varchar,
	"job_type" varchar,
	"salary_range" varchar,
	"location" varchar,
	"role_complexity" varchar,
	"career_progression" varchar,
	"industry_fit" varchar,
	"culture_fit" varchar,
	"application_recommendation" varchar,
	"tailoring_advice" text,
	"interview_prep_tips" text,
	"analysis_version" varchar DEFAULT '1.0',
	"processing_time" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" varchar NOT NULL,
	"job_seeker_id" varchar NOT NULL,
	"job_posting_id" integer,
	"application_id" integer,
	"last_message_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" varchar NOT NULL,
	"job_analyses_count" integer DEFAULT 0,
	"resume_analyses_count" integer DEFAULT 0,
	"applications_count" integer DEFAULT 0,
	"auto_fills_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"institution" varchar NOT NULL,
	"degree" varchar NOT NULL,
	"field_of_study" varchar,
	"start_date" timestamp,
	"end_date" timestamp,
	"gpa" varchar,
	"achievements" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar NOT NULL,
	"email" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" varchar,
	"company_website" varchar,
	"verified" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_title" varchar NOT NULL,
	"company" varchar NOT NULL,
	"job_url" varchar,
	"application_url" varchar,
	"location" varchar,
	"job_type" varchar,
	"work_mode" varchar,
	"salary_range" varchar,
	"status" varchar DEFAULT 'applied' NOT NULL,
	"applied_date" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now(),
	"job_description" text,
	"required_skills" text[],
	"match_score" integer,
	"notes" text,
	"source" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_posting_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_posting_id" integer NOT NULL,
	"applicant_id" varchar NOT NULL,
	"resume_id" integer,
	"resume_data" jsonb,
	"cover_letter" text,
	"status" varchar DEFAULT 'pending',
	"match_score" integer,
	"recruiter_notes" text,
	"applied_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"company_name" varchar NOT NULL,
	"company_logo" varchar,
	"location" varchar,
	"work_mode" varchar,
	"job_type" varchar,
	"experience_level" varchar,
	"skills" text[],
	"min_salary" integer,
	"max_salary" integer,
	"currency" varchar DEFAULT 'USD',
	"benefits" text,
	"requirements" text,
	"responsibilities" text,
	"is_active" boolean DEFAULT true,
	"applications_count" integer DEFAULT 0,
	"views_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_title" varchar NOT NULL,
	"company" varchar NOT NULL,
	"location" varchar,
	"job_url" varchar,
	"salary" varchar,
	"job_type" varchar,
	"work_mode" varchar,
	"match_score" integer,
	"matching_skills" text[],
	"missing_skills" text[],
	"job_description" text,
	"required_skills" text[],
	"is_bookmarked" boolean DEFAULT false,
	"is_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" varchar,
	"file_data" text,
	"resume_text" text,
	"is_active" boolean DEFAULT false,
	"ats_score" integer,
	"analysis_data" jsonb,
	"recommendations" text[],
	"file_size" integer,
	"mime_type" varchar,
	"last_analyzed" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"full_name" varchar,
	"phone" varchar,
	"professional_title" varchar,
	"location" varchar,
	"linkedin_url" varchar,
	"github_url" varchar,
	"portfolio_url" varchar,
	"date_of_birth" varchar,
	"gender" varchar,
	"nationality" varchar,
	"work_authorization" varchar,
	"visa_status" varchar,
	"requires_sponsorship" boolean DEFAULT false,
	"current_address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"country" varchar DEFAULT 'United States',
	"willing_to_relocate" boolean DEFAULT false,
	"preferred_work_mode" varchar,
	"desired_salary_min" integer,
	"desired_salary_max" integer,
	"salary_currency" varchar DEFAULT 'USD',
	"notice_period" varchar,
	"highest_degree" varchar,
	"major_field_of_study" varchar,
	"graduation_year" integer,
	"resume_url" varchar,
	"resume_text" text,
	"resume_file_name" varchar,
	"resume_data" text,
	"resume_mime_type" varchar,
	"summary" text,
	"years_experience" integer,
	"ats_score" integer,
	"ats_analysis" jsonb,
	"ats_recommendations" text[],
	"emergency_contact_name" varchar,
	"emergency_contact_phone" varchar,
	"emergency_contact_relation" varchar,
	"veteran_status" varchar,
	"ethnicity" varchar,
	"disability_status" varchar,
	"background_check_consent" boolean DEFAULT false,
	"drug_test_consent" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"profile_completion" integer DEFAULT 0,
	"last_resume_analysis" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"skill_name" varchar NOT NULL,
	"proficiency_level" varchar,
	"years_experience" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"password" varchar,
	"profile_image_url" varchar,
	"user_type" varchar DEFAULT 'job_seeker',
	"email_verified" boolean DEFAULT false,
	"company_name" varchar,
	"company_website" varchar,
	"company_logo_url" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"paypal_subscription_id" varchar,
	"paypal_order_id" varchar,
	"razorpay_payment_id" varchar,
	"razorpay_order_id" varchar,
	"payment_provider" varchar,
	"subscription_status" varchar DEFAULT 'free',
	"plan_type" varchar DEFAULT 'free',
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_experience" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"company" varchar NOT NULL,
	"position" varchar NOT NULL,
	"location" varchar,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_current" boolean DEFAULT false,
	"description" text,
	"achievements" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_job_analyses" ADD CONSTRAINT "ai_job_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_job_seeker_id_users_id_fk" FOREIGN KEY ("job_seeker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_application_id_job_posting_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_posting_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_applications" ADD CONSTRAINT "job_posting_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_applications" ADD CONSTRAINT "job_posting_applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_applications" ADD CONSTRAINT "job_posting_applications_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_recommendations" ADD CONSTRAINT "job_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_conversations_recruiter_idx" ON "chat_conversations" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "chat_conversations_job_seeker_idx" ON "chat_conversations" USING btree ("job_seeker_id");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "daily_usage_user_date_idx" ON "daily_usage" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_posting_applications_job_idx" ON "job_posting_applications" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "job_posting_applications_applicant_idx" ON "job_posting_applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");