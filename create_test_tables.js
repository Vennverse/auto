import { neon } from '@neondatabase/serverless';

async function createTestTables() {
  const dbUrl = 'postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';
  const sql = neon(dbUrl);

  try {
    console.log('Creating test_templates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_templates (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        description TEXT,
        category VARCHAR NOT NULL,
        job_profile VARCHAR NOT NULL,
        difficulty_level VARCHAR NOT NULL,
        time_limit INTEGER NOT NULL,
        passing_score INTEGER NOT NULL,
        questions JSONB NOT NULL,
        created_by VARCHAR REFERENCES users(id),
        is_global BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Creating indexes for test_templates...');
    await sql`CREATE INDEX IF NOT EXISTS test_templates_job_profile_idx ON test_templates(job_profile)`;
    await sql`CREATE INDEX IF NOT EXISTS test_templates_difficulty_idx ON test_templates(difficulty_level)`;
    await sql`CREATE INDEX IF NOT EXISTS test_templates_category_idx ON test_templates(category)`;
    await sql`CREATE INDEX IF NOT EXISTS test_templates_created_by_idx ON test_templates(created_by)`;

    console.log('Creating test_assignments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_assignments (
        id SERIAL PRIMARY KEY,
        test_template_id INTEGER REFERENCES test_templates(id) NOT NULL,
        recruiter_id VARCHAR REFERENCES users(id) NOT NULL,
        job_seeker_id VARCHAR REFERENCES users(id) NOT NULL,
        job_posting_id INTEGER REFERENCES job_postings(id),
        assigned_at TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP NOT NULL,
        status VARCHAR DEFAULT 'assigned',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        score INTEGER,
        answers JSONB,
        time_spent INTEGER,
        retake_allowed BOOLEAN DEFAULT false,
        retake_payment_id VARCHAR,
        retake_count INTEGER DEFAULT 0,
        max_retakes INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Creating indexes for test_assignments...');
    await sql`CREATE INDEX IF NOT EXISTS test_assignments_template_idx ON test_assignments(test_template_id)`;
    await sql`CREATE INDEX IF NOT EXISTS test_assignments_recruiter_idx ON test_assignments(recruiter_id)`;
    await sql`CREATE INDEX IF NOT EXISTS test_assignments_job_seeker_idx ON test_assignments(job_seeker_id)`;

    console.log('Creating test_submissions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES test_assignments(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        answers JSONB NOT NULL,
        score INTEGER,
        time_spent INTEGER,
        is_passed BOOLEAN,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Creating indexes for test_submissions...');
    await sql`CREATE INDEX IF NOT EXISTS test_submissions_assignment_idx ON test_submissions(assignment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS test_submissions_user_idx ON test_submissions(user_id)`;

    console.log('Creating test_retake_payments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_retake_payments (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES test_assignments(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        payment_provider VARCHAR NOT NULL,
        payment_id VARCHAR NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        status VARCHAR DEFAULT 'pending',
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Creating indexes for test_retake_payments...');
    await sql`CREATE INDEX IF NOT EXISTS test_retake_payments_assignment_idx ON test_retake_payments(assignment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS test_retake_payments_user_idx ON test_retake_payments(user_id)`;

    console.log('✅ All test tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating test tables:', error);
  }
}

createTestTables();