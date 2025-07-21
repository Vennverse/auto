import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function updateTestTemplates() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Updating test templates to use question bank...');
    
    // Get existing test templates
    const templates = await pool.query(`
      SELECT id, title, job_profile, difficulty_level, time_limit, passing_score
      FROM test_templates 
      WHERE is_global = true
    `);
    
    console.log(`Found ${templates.rows.length} test templates to update`);
    
    for (const template of templates.rows) {
      console.log(`Updating template: ${template.title}`);
      
      // Define tags based on job profile
      let tags = ['general'];
      let aptitudeQuestions = 15;
      let englishQuestions = 6;
      let domainQuestions = 9;
      
      switch (template.job_profile) {
        case 'software_engineer':
        case 'frontend_developer':
        case 'python_developer':
          tags = ['javascript', 'python', 'sql', 'react'];
          break;
        case 'data_scientist':
          tags = ['python', 'sql', 'analytics'];
          break;
        case 'marketing':
          tags = ['marketing', 'analytics'];
          domainQuestions = 6; // Less technical for marketing
          aptitudeQuestions = 18;
          break;
        default:
          tags = ['general'];
      }
      
      // Update template to use question bank
      await pool.query(`
        UPDATE test_templates 
        SET 
          use_question_bank = true,
          tags = $1,
          aptitude_questions = $2,
          english_questions = $3,
          domain_questions = $4,
          include_extreme_questions = true,
          updated_at = NOW()
        WHERE id = $5
      `, [tags, aptitudeQuestions, englishQuestions, domainQuestions, template.id]);
      
      console.log(`✅ Updated ${template.title} with tags: [${tags.join(', ')}]`);
    }
    
    console.log('✅ All test templates updated to use question bank!');
    
    // Verify the updates
    const updated = await pool.query(`
      SELECT id, title, use_question_bank, tags, aptitude_questions, english_questions, domain_questions
      FROM test_templates 
      WHERE is_global = true AND use_question_bank = true
    `);
    
    console.log(`\n📊 Updated Templates Summary:`);
    for (const template of updated.rows) {
      console.log(`- ${template.title}: ${template.aptitude_questions}A + ${template.english_questions}E + ${template.domain_questions}D questions [${template.tags.join(', ')}]`);
    }
    
  } catch (error) {
    console.error('Error updating test templates:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateTestTemplates().catch(console.error);