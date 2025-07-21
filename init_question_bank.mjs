import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function initQuestionBank() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Creating question_bank table...');
    
    // Create the question_bank table
    await pool.query(`
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
    await pool.query(`
      CREATE INDEX IF NOT EXISTS question_bank_category_idx ON question_bank(category);
      CREATE INDEX IF NOT EXISTS question_bank_domain_idx ON question_bank(domain);
      CREATE INDEX IF NOT EXISTS question_bank_difficulty_idx ON question_bank(difficulty);
      CREATE INDEX IF NOT EXISTS question_bank_tags_idx ON question_bank USING GIN(tags);
    `);
    
    console.log('✅ Question bank table created successfully!');
    
    console.log('Adding sample questions...');
    
    // Add comprehensive sample questions
    await pool.query(`
      INSERT INTO question_bank (question_id, type, category, domain, sub_category, difficulty, question, options, correct_answer, explanation, points, time_limit, tags, keywords) VALUES
      -- JavaScript Questions
      ('js_basics_1', 'multiple_choice', 'domain_specific', 'technical', 'JavaScript', 'easy', 'What is the correct way to declare a variable in JavaScript?', ARRAY['var x = 5', 'variable x = 5', 'v x = 5', 'declare x = 5'], 'var x = 5', 'In JavaScript, variables are declared using var, let, or const keywords.', 5, 2, ARRAY['javascript', 'variables'], ARRAY['variable', 'declaration', 'syntax']),
      ('js_basics_2', 'multiple_choice', 'domain_specific', 'technical', 'JavaScript', 'medium', 'Which of the following is NOT a primitive data type in JavaScript?', ARRAY['string', 'number', 'boolean', 'array'], 'array', 'Arrays are objects in JavaScript, not primitive data types.', 5, 2, ARRAY['javascript', 'data-types'], ARRAY['primitive', 'types', 'array']),
      ('js_advanced_1', 'multiple_choice', 'domain_specific', 'technical', 'JavaScript', 'hard', 'What will console.log(typeof null) output?', ARRAY['null', 'undefined', 'object', 'boolean'], 'object', 'This is a well-known quirk in JavaScript where typeof null returns "object".', 10, 3, ARRAY['javascript', 'typeof'], ARRAY['null', 'typeof', 'quirk']),
      
      -- React Questions  
      ('react_1', 'multiple_choice', 'domain_specific', 'technical', 'React', 'medium', 'What is the correct way to update state in a functional component?', ARRAY['setState(newValue)', 'useState(newValue)', 'setStateValue(newValue)', 'this.setState(newValue)'], 'setStateValue(newValue)', 'In functional components, you use the setter function returned by useState hook.', 5, 3, ARRAY['react', 'hooks', 'state'], ARRAY['useState', 'state', 'functional']),
      
      -- SQL Questions
      ('sql_1', 'multiple_choice', 'domain_specific', 'technical', 'Database', 'easy', 'Which SQL command is used to retrieve data from a database?', ARRAY['GET', 'SELECT', 'RETRIEVE', 'FETCH'], 'SELECT', 'SELECT is the standard SQL command for retrieving data from tables.', 5, 2, ARRAY['sql', 'database'], ARRAY['select', 'query', 'database']),
      ('sql_2', 'multiple_choice', 'domain_specific', 'technical', 'Database', 'medium', 'What does the INNER JOIN clause do?', ARRAY['Returns all records from both tables', 'Returns records that have matching values in both tables', 'Returns records from the left table only', 'Returns records from the right table only'], 'Returns records that have matching values in both tables', 'INNER JOIN returns only the records that have matching values in both tables.', 5, 3, ARRAY['sql', 'joins'], ARRAY['inner', 'join', 'matching']),
      
      -- Python Questions
      ('python_1', 'multiple_choice', 'domain_specific', 'technical', 'Python', 'easy', 'How do you create a list in Python?', ARRAY['list = []', 'list = ()', 'list = {}', 'list = <>'], 'list = []', 'Square brackets [] are used to create lists in Python.', 5, 2, ARRAY['python', 'data-structures'], ARRAY['list', 'creation', 'syntax']),
      ('python_2', 'multiple_choice', 'domain_specific', 'technical', 'Python', 'medium', 'What is the output of len("Hello World")?', ARRAY['10', '11', '12', 'Error'], '11', 'The string "Hello World" has 11 characters including the space.', 5, 2, ARRAY['python', 'strings'], ARRAY['length', 'string', 'space']),
      
      -- Aptitude Questions
      ('aptitude_1', 'multiple_choice', 'general_aptitude', 'general', 'Logical Reasoning', 'easy', 'If all roses are flowers and some flowers are red, which conclusion is definitely true?', ARRAY['All roses are red', 'Some roses are red', 'Some roses might be red', 'No roses are red'], 'Some roses might be red', 'We cannot definitively conclude about the color of roses from the given information.', 5, 3, ARRAY['logic', 'reasoning'], ARRAY['logical', 'reasoning', 'deduction']),
      ('aptitude_2', 'multiple_choice', 'general_aptitude', 'general', 'Numerical', 'medium', 'What is the next number in the sequence: 2, 6, 12, 20, ?', ARRAY['28', '30', '32', '36'], '30', 'The differences are 4, 6, 8, so the next difference is 10. 20 + 10 = 30.', 5, 4, ARRAY['sequence', 'patterns'], ARRAY['numerical', 'sequence', 'pattern']),
      ('aptitude_3', 'multiple_choice', 'general_aptitude', 'general', 'Analytical', 'hard', 'A train travels 120 km in 2 hours. How long will it take to travel 300 km at the same speed?', ARRAY['4 hours', '5 hours', '6 hours', '7 hours'], '5 hours', 'Speed = 120/2 = 60 km/h. Time = 300/60 = 5 hours.', 10, 5, ARRAY['speed', 'time', 'distance'], ARRAY['speed', 'distance', 'calculation']),
      
      -- English Questions
      ('english_1', 'multiple_choice', 'english', 'general', 'Grammar', 'easy', 'Choose the correct sentence:', ARRAY['He don''t like coffee', 'He doesn''t like coffee', 'He do not like coffee', 'He not like coffee'], 'He doesn''t like coffee', 'The correct negative form uses "doesn''t" with third person singular.', 5, 2, ARRAY['grammar', 'negation'], ARRAY['grammar', 'verb', 'negation']),
      ('english_2', 'multiple_choice', 'english', 'general', 'Vocabulary', 'medium', 'What does "ubiquitous" mean?', ARRAY['Rare', 'Present everywhere', 'Ancient', 'Valuable'], 'Present everywhere', 'Ubiquitous means existing or being everywhere at the same time.', 5, 3, ARRAY['vocabulary', 'meaning'], ARRAY['ubiquitous', 'everywhere', 'omnipresent']),
      ('english_3', 'multiple_choice', 'english', 'general', 'Reading Comprehension', 'hard', 'In the sentence "The author''s verbose style made the novel difficult to read", what does "verbose" mean?', ARRAY['Concise', 'Wordy', 'Simple', 'Creative'], 'Wordy', 'Verbose means using more words than necessary; wordy.', 10, 4, ARRAY['comprehension', 'vocabulary'], ARRAY['verbose', 'wordy', 'style'])
      ON CONFLICT (question_id) DO NOTHING
    `);
    
    console.log('✅ Sample questions added successfully!');
    
    // Get final count
    const result = await pool.query(`SELECT COUNT(*) as count FROM question_bank`);
    const count = parseInt(result.rows[0].count);
    console.log(`Question bank now contains ${count} questions`);
    
  } catch (error) {
    console.error('Error initializing question bank:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initQuestionBank().catch(console.error);
