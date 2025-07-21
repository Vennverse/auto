import { db } from './server/db.js';
import { questionBank } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function debugQuestions() {
  try {
    console.log('Debugging question bank...');
    
    // Check all questions
    const allQuestions = await db.select().from(questionBank);
    console.log(`Total questions in DB: ${allQuestions.length}`);
    
    // Check active questions
    const activeQuestions = await db.select().from(questionBank).where(eq(questionBank.isActive, true));
    console.log(`Active questions: ${activeQuestions.length}`);
    
    // Show first few questions
    console.log('\nFirst 3 questions:');
    allQuestions.slice(0, 3).forEach((q, i) => {
      console.log(`${i + 1}. Question: ${q.question?.substring(0, 50)}...`);
      console.log(`   Category: ${q.category}, Domain: ${q.domain}, Difficulty: ${q.difficulty}`);
      console.log(`   Active: ${q.isActive}, Type: ${q.type}`);
      console.log('---');
    });
    
    // Test the search function
    console.log('\nTesting search function...');
    const { questionBankService } = await import('./server/questionBankService.js');
    
    const searchResults = await questionBankService.searchQuestions();
    console.log(`Search results (no filters): ${searchResults.length}`);
    
    const searchWithCategory = await questionBankService.searchQuestions('', 'domain_specific');
    console.log(`Search results (domain_specific): ${searchWithCategory.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugQuestions();