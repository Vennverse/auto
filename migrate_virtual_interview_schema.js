import { neon } from '@neondatabase/serverless';

async function migrateVirtualInterviewSchema() {
  // Clean the DATABASE_URL if it starts with 'psql'
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('psql \'')) {
    dbUrl = dbUrl.slice(6, -1); // Remove 'psql \'' from start and '\'' from end
  }
  const sql = neon(dbUrl);
  
  try {
    console.log('Creating virtual interview tables...');
    
    // Create virtual_interviews table
    await sql`
      CREATE TABLE IF NOT EXISTS virtual_interviews (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        session_id VARCHAR UNIQUE NOT NULL,
        interview_type VARCHAR NOT NULL DEFAULT 'technical',
        role VARCHAR NOT NULL DEFAULT 'software_engineer',
        company VARCHAR,
        difficulty VARCHAR NOT NULL DEFAULT 'medium',
        duration INTEGER NOT NULL DEFAULT 30,
        interviewer_personality VARCHAR NOT NULL DEFAULT 'professional',
        interview_style VARCHAR NOT NULL DEFAULT 'conversational',
        job_description TEXT,
        resume_context TEXT,
        status VARCHAR NOT NULL DEFAULT 'active',
        current_step VARCHAR NOT NULL DEFAULT 'introduction',
        questions_asked INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 5,
        time_remaining INTEGER NOT NULL DEFAULT 1800,
        overall_score INTEGER,
        technical_score INTEGER,
        communication_score INTEGER,
        confidence_score INTEGER,
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create virtual_interview_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS virtual_interview_messages (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER REFERENCES virtual_interviews(id) NOT NULL,
        sender VARCHAR NOT NULL,
        message_type VARCHAR NOT NULL DEFAULT 'text',
        content TEXT NOT NULL,
        message_index INTEGER NOT NULL,
        question_category VARCHAR,
        difficulty VARCHAR,
        expected_keywords TEXT[] DEFAULT '{}',
        follow_up_prompts TEXT[] DEFAULT '{}',
        response_quality INTEGER,
        technical_accuracy INTEGER,
        clarity_score INTEGER,
        depth_score INTEGER,
        keywords_matched TEXT[] DEFAULT '{}',
        sentiment VARCHAR,
        confidence INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create virtual_interview_feedback table
    await sql`
      CREATE TABLE IF NOT EXISTS virtual_interview_feedback (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER REFERENCES virtual_interviews(id) NOT NULL,
        performance_summary TEXT NOT NULL,
        key_strengths TEXT[] NOT NULL DEFAULT '{}',
        areas_for_improvement TEXT[] NOT NULL DEFAULT '{}',
        overall_score INTEGER NOT NULL,
        technical_skills_score INTEGER NOT NULL,
        problem_solving_score INTEGER NOT NULL,
        communication_score INTEGER NOT NULL,
        response_consistency INTEGER NOT NULL,
        adaptability_score INTEGER NOT NULL,
        stress_handling INTEGER NOT NULL,
        skill_gaps TEXT[] DEFAULT '{}',
        recommended_resources JSONB DEFAULT '[]',
        practice_areas TEXT[] DEFAULT '{}',
        next_steps TEXT[] DEFAULT '{}',
        market_comparison TEXT,
        salary_insights TEXT,
        role_readiness VARCHAR NOT NULL,
        ai_confidence_score INTEGER NOT NULL,
        analysis_method VARCHAR DEFAULT 'groq_ai',
        feedback_version VARCHAR DEFAULT '1.0',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create virtual_interview_stats table
    await sql`
      CREATE TABLE IF NOT EXISTS virtual_interview_stats (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        total_interviews INTEGER DEFAULT 0,
        completed_interviews INTEGER DEFAULT 0,
        free_interviews_used INTEGER DEFAULT 0,
        monthly_interviews_used INTEGER DEFAULT 0,
        last_monthly_reset TIMESTAMP DEFAULT NOW(),
        average_score INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        improvement_rate INTEGER DEFAULT 0,
        consistency_score INTEGER DEFAULT 0,
        technical_interview_avg INTEGER DEFAULT 0,
        behavioral_interview_avg INTEGER DEFAULT 0,
        system_design_avg INTEGER DEFAULT 0,
        strongest_skills TEXT[] DEFAULT '{}',
        improving_skills TEXT[] DEFAULT '{}',
        needs_work_skills TEXT[] DEFAULT '{}',
        total_time_spent INTEGER DEFAULT 0,
        average_session_length INTEGER DEFAULT 0,
        last_interview_date TIMESTAMP,
        milestones_achieved TEXT[] DEFAULT '{}',
        next_milestone VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('Virtual interview schema migration completed successfully!');
    
    // Verify the columns were added
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'virtual_interview_stats' 
      AND column_name IN ('free_interviews_used', 'monthly_interviews_used', 'last_monthly_reset')
    `;
    
    console.log('Added columns:', result.map(r => r.column_name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateVirtualInterviewSchema();