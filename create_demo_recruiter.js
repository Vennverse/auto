import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function createDemoRecruiter() {
  const dbUrl = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';
  const sql = neon(dbUrl);

  try {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const recruiterId = `recruiter-${Date.now()}`;
    
    console.log('Creating demo recruiter user...');
    await sql`
      INSERT INTO users (id, email, password, first_name, last_name, user_type, email_verified, created_at)
      VALUES (
        ${recruiterId},
        'recruiter@demo.com',
        ${hashedPassword},
        'Demo',
        'Recruiter',
        'recruiter',
        true,
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password = ${hashedPassword},
        user_type = 'recruiter',
        email_verified = true
    `;

    console.log('✅ Demo recruiter created successfully!');
    console.log('Email: recruiter@demo.com');
    console.log('Password: demo123');
    console.log('User ID:', recruiterId);
  } catch (error) {
    console.error('❌ Error creating demo recruiter:', error);
  }
}

createDemoRecruiter();