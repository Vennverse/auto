
const { db } = require('./server/db.ts');
const { sql } = require('drizzle-orm');

(async () => {
  try {
    console.log('Running database migration...');
    
    // Add missing columns to virtual_interviews table
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS assigned_by VARCHAR REFERENCES users(id)`);
      console.log('✓ assigned_by column added');
    } catch (e) { console.log('assigned_by column exists or error:', e.message); }
    
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS assignment_type VARCHAR DEFAULT 'self'`);
      console.log('✓ assignment_type column added');
    } catch (e) { console.log('assignment_type column exists or error:', e.message); }
    
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS job_posting_id INTEGER REFERENCES job_postings(id)`);
      console.log('✓ job_posting_id column added');
    } catch (e) { console.log('job_posting_id column exists or error:', e.message); }
    
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP`);
      console.log('✓ assigned_at column added');
    } catch (e) { console.log('assigned_at column exists or error:', e.message); }
    
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`);
      console.log('✓ due_date column added');  
    } catch (e) { console.log('due_date column exists or error:', e.message); }
    
    try {
      await db.execute(sql`ALTER TABLE virtual_interviews ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false`);
      console.log('✓ email_sent column added');
    } catch (e) { console.log('email_sent column exists or error:', e.message); }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
})();
