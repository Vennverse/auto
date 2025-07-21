import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require');

async function createInterviewTables() {
  try {
    console.log('Creating mock interview tables...');
    
    // Create mock_interviews table
    await sql`
      CREATE TABLE IF NOT EXISTS mock_interviews (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        difficulty VARCHAR(50) NOT NULL,
        interview_type VARCHAR(50) NOT NULL,
        language VARCHAR(50) DEFAULT 'javascript',
        total_questions INTEGER NOT NULL,
        current_question INTEGER DEFAULT 1,
        time_remaining INTEGER DEFAULT 3600,
        status VARCHAR(50) DEFAULT 'active',
        score INTEGER,
        feedback TEXT,
        is_paid BOOLEAN DEFAULT false,
        payment_id VARCHAR(255),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create mock_interview_questions table
    await sql`
      CREATE TABLE IF NOT EXISTS mock_interview_questions (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        language VARCHAR(50),
        expected_answer TEXT,
        user_answer TEXT,
        code_submission TEXT,
        score INTEGER,
        feedback TEXT,
        time_spent INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answered_at TIMESTAMP
      )
    `;
    
    // Create user_interview_stats table
    await sql`
      CREATE TABLE IF NOT EXISTS user_interview_stats (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        total_interviews INTEGER DEFAULT 0,
        completed_interviews INTEGER DEFAULT 0,
        average_score DECIMAL(5,2) DEFAULT 0,
        free_interviews_used INTEGER DEFAULT 0,
        paid_interviews INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        total_time_spent INTEGER DEFAULT 0,
        last_interview_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create interview_payments table
    await sql`
      CREATE TABLE IF NOT EXISTS interview_payments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        payment_intent_id VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        interviews_purchased INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Mock interview tables created successfully!');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%interview%'
      ORDER BY table_name
    `;
    
    console.log('Interview tables found:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('Error creating interview tables:', error);
  }
}

createInterviewTables();