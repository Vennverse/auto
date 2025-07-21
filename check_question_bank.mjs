import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkQuestionBank() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Checking question bank status...');
    
    // Check if question_bank table exists and count questions
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM question_bank
    `);
    
    const questionCount = parseInt(result.rows[0].count);
    console.log(`Found ${questionCount} questions in the question bank`);
    
    if (questionCount === 0) {
      console.log('Initializing question bank with sample questions...');
      
      // Add some sample questions to get started
      await pool.query(`
        INSERT INTO question_bank (question_id, type, category, domain, sub_category, difficulty, question, options, correct_answer, explanation, points, time_limit, tags, keywords) VALUES
        ('js_basics_1', 'multiple_choice', 'domain_specific', 'technical', 'JavaScript', 'easy', 'What is the correct way to declare a variable in JavaScript?', ARRAY['var x = 5', 'variable x = 5', 'v x = 5', 'declare x = 5'], 'var x = 5', 'In JavaScript, variables are declared using var, let, or const keywords.', 5, 2, ARRAY['javascript', 'variables'], ARRAY['variable', 'declaration', 'syntax']),
        ('js_basics_2', 'multiple_choice', 'domain_specific', 'technical', 'JavaScript', 'medium', 'Which of the following is NOT a primitive data type in JavaScript?', ARRAY['string', 'number', 'boolean', 'array'], 'array', 'Arrays are objects in JavaScript, not primitive data types.', 5, 2, ARRAY['javascript', 'data-types'], ARRAY['primitive', 'types', 'array']),
        ('aptitude_1', 'multiple_choice', 'general_aptitude', 'general', 'Logical Reasoning', 'easy', 'If all roses are flowers and some flowers are red, which conclusion is definitely true?', ARRAY['All roses are red', 'Some roses are red', 'Some roses might be red', 'No roses are red'], 'Some roses might be red', 'We cannot definitively conclude about the color of roses from the given information.', 5, 3, ARRAY['logic', 'reasoning'], ARRAY['logical', 'reasoning', 'deduction']),
        ('english_1', 'multiple_choice', 'english', 'general', 'Grammar', 'easy', 'Choose the correct sentence:', ARRAY['He don''t like coffee', 'He doesn''t like coffee', 'He do not like coffee', 'He not like coffee'], 'He doesn''t like coffee', 'The correct negative form uses "doesn''t" with third person singular.', 5, 2, ARRAY['grammar', 'negation'], ARRAY['grammar', 'verb', 'negation']),
        ('sql_1', 'multiple_choice', 'domain_specific', 'technical', 'Database', 'medium', 'Which SQL command is used to retrieve data from a database?', ARRAY['GET', 'SELECT', 'RETRIEVE', 'FETCH'], 'SELECT', 'SELECT is the standard SQL command for retrieving data from tables.', 5, 2, ARRAY['sql', 'database'], ARRAY['select', 'query', 'database'])
        ON CONFLICT (question_id) DO NOTHING
      `);
      
      console.log('✅ Sample questions added to question bank!');
    }
    
    // Get updated count
    const finalResult = await pool.query(`SELECT COUNT(*) as count FROM question_bank`);
    const finalCount = parseInt(finalResult.rows[0].count);
    console.log(`Question bank now contains ${finalCount} questions`);
    
  } catch (error) {
    console.error('Error checking question bank:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkQuestionBank().catch(console.error);
