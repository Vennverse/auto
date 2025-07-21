import { db } from './server/db.js';
import { users } from './shared/schema.js';

async function migrateAiTiers() {
  try {
    // Add AI tier columns manually since drizzle:push isn't working
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS ai_model_tier VARCHAR DEFAULT 'premium',
      ADD COLUMN IF NOT EXISTS premium_trial_start_date TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS premium_trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
      ADD COLUMN IF NOT EXISTS has_used_premium_trial BOOLEAN DEFAULT false;
    `);
    
    console.log("✅ AI tier columns added successfully");
    
    // Update existing users to have premium trial
    await db.execute(`
      UPDATE users 
      SET premium_trial_start_date = NOW(),
          premium_trial_end_date = NOW() + INTERVAL '30 days',
          has_used_premium_trial = false
      WHERE premium_trial_start_date IS NULL;
    `);
    
    console.log("✅ Existing users updated with premium trial");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

migrateAiTiers();