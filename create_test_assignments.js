import { neon } from '@neondatabase/serverless';

async function createTestAssignments() {
  try {
    const sql = neon('postgresql://neondb_owner:npg_LXMUh9KdQB0q@ep-fragrant-feather-a88g5mva-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');
    
    console.log('Creating test assignments for both templates...');
    
    // Get user ID
    const userId = 'user-1751643566777-0c2093nmp';
    
    // Create assignments for both templates (React and SQL)
    const assignments = [
      {
        testTemplateId: 16, // React template (the one we just created)
        jobSeekerId: userId,
        recruiterId: userId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'assigned'
      },
      {
        testTemplateId: 15, // Advanced SQL template (existing)
        jobSeekerId: userId,
        recruiterId: userId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'assigned'
      }
    ];
    
    for (const assignment of assignments) {
      const result = await sql`
        INSERT INTO test_assignments (
          test_template_id, 
          job_seeker_id, 
          recruiter_id, 
          due_date, 
          status, 
          assigned_at
        ) VALUES (
          ${assignment.testTemplateId},
          ${assignment.jobSeekerId},
          ${assignment.recruiterId},
          ${assignment.dueDate.toISOString()},
          ${assignment.status},
          ${new Date().toISOString()}
        )
        RETURNING id, test_template_id
      `;
      
      console.log(`✅ Created test assignment ${result[0].id} for template ${result[0].test_template_id}`);
    }
    
    console.log('\n🎉 Test assignments created successfully!');
    console.log('You can now:');
    console.log('1. Go to Test Assignments page to see the assignments');
    console.log('2. Click "Take Test" to start taking the tests');
    console.log('3. Or go to Job Seeker Tests page to see available tests');
    
  } catch (error) {
    console.error('Error creating test assignments:', error);
  }
}

createTestAssignments();