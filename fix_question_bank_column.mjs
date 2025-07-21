import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function fixQuestionBankColumn() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Adding missing columns to test_templates table...');
    
    // Add all missing columns with snake_case names
    await pool.query(`
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
    
  } catch (error) {
    console.error('Error fixing question bank column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixQuestionBankColumn().catch(console.error);
