const { Pool } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function fixQuestionBankColumn() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  
  try {
    console.log('Adding missing columns to test_templates table...');
    
    // Add all missing columns with snake_case names
    await client.query(`
      ALTER TABLE test_templates 
      ADD COLUMN IF NOT EXISTS use_question_bank BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS aptitude_questions INTEGER DEFAULT 15,
      ADD COLUMN IF NOT EXISTS english_questions INTEGER DEFAULT 6,
      ADD COLUMN IF NOT EXISTS domain_questions INTEGER DEFAULT 9,
      ADD COLUMN IF NOT EXISTS include_extreme_questions BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log('✅ All missing columns added successfully!');
    
    // Also create question_bank table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id SERIAL PRIMARY KEY,
        question_id VARCHAR UNIQUE NOT NULL,
        type VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        domain VARCHAR NOT NULL,
        sub_category VARCHAR NOT NULL,
        difficulty VARCHAR NOT NULL,
        question TEXT NOT NULL,
        options TEXT[],
        correct_answer TEXT,
        explanation TEXT,
        points INTEGER DEFAULT 5,
        time_limit INTEGER DEFAULT 2,
        tags TEXT[],
        keywords TEXT[],
        test_cases TEXT,
        boilerplate TEXT,
        language VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS question_bank_category_idx ON question_bank(category);
      CREATE INDEX IF NOT EXISTS question_bank_domain_idx ON question_bank(domain);
      CREATE INDEX IF NOT EXISTS question_bank_difficulty_idx ON question_bank(difficulty);
      CREATE INDEX IF NOT EXISTS question_bank_tags_idx ON question_bank USING GIN(tags);
    `);
    
    console.log('✅ Question bank table created successfully!');
    
  } catch (error) {
    console.error('Error fixing question bank column:', error);
    throw error;
  } finally {
    client.release();
  }
}

fixQuestionBankColumn().catch(console.error);
