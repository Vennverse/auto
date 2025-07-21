import { neon } from '@neondatabase/serverless';

async function fixAllTestColumns() {
  const dbUrl = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';
  const sql = neon(dbUrl);

  try {
    console.log('Adding all missing columns to test_assignments table...');
    await sql`
      ALTER TABLE test_assignments 
      ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reminders_sent INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP,
      ADD COLUMN IF NOT EXISTS notes TEXT
    `;

    console.log('✅ All missing columns added successfully!');
  } catch (error) {
    console.error('❌ Error updating test assignments table:', error);
  }
}

fixAllTestColumns();