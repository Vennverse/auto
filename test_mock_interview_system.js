const axios = require('axios');

// Test the complete mock interview system
async function testMockInterviewSystem() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Mock Interview System...\n');
  
  try {
    // Step 1: Create test user and login
    console.log('1. Creating test user...');
    const testUser = {
      email: 'test@mockinterview.com',
      password: 'password123',
      userType: 'job_seeker',
      firstName: 'Test',
      lastName: 'User'
    };
    
    try {
      await axios.post(`${baseUrl}/api/auth/email/register`, testUser);
      console.log('✅ Test user created successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Test user already exists');
      } else {
        throw error;
      }
    }
    
    // Step 2: Login
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${baseUrl}/api/auth/email/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies.join('; ');
    console.log('✅ Login successful');
    
    // Step 3: Test mock interview stats
    console.log('3. Testing interview stats...');
    const statsResponse = await axios.get(`${baseUrl}/api/mock-interview/stats`, {
      headers: { Cookie: cookieHeader }
    });
    console.log('✅ Stats retrieved:', statsResponse.data);
    
    // Step 4: Test mock interview history
    console.log('4. Testing interview history...');
    const historyResponse = await axios.get(`${baseUrl}/api/mock-interview/history`, {
      headers: { Cookie: cookieHeader }
    });
    console.log('✅ History retrieved:', historyResponse.data);
    
    // Step 5: Start mock interview
    console.log('5. Starting mock interview...');
    const interviewConfig = {
      role: 'Software Engineer',
      company: 'Google',
      difficulty: 'medium',
      interviewType: 'technical',
      language: 'javascript',
      totalQuestions: 3
    };
    
    const startResponse = await axios.post(`${baseUrl}/api/mock-interview/start`, interviewConfig, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log('✅ Interview started:', startResponse.data);
    
    if (!startResponse.data.sessionId) {
      throw new Error('❌ No sessionId returned from start interview');
    }
    
    const sessionId = startResponse.data.sessionId;
    console.log('📝 Session ID:', sessionId);
    
    // Step 6: Get interview session
    console.log('6. Getting interview session...');
    const sessionResponse = await axios.get(`${baseUrl}/api/mock-interview/session/${sessionId}`, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log('✅ Session retrieved:', {
      interview: sessionResponse.data.interview,
      questionsCount: sessionResponse.data.questions.length
    });
    
    // Step 7: Test code execution
    console.log('7. Testing code execution...');
    const codeExecutionResponse = await axios.post(`${baseUrl}/api/mock-interview/execute-code`, {
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
      testCases: [
        { input: [1, 2], expected: 3, description: 'Add 1 + 2 = 3' }
      ]
    }, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log('✅ Code execution successful:', codeExecutionResponse.data);
    
    // Step 8: Submit answer
    console.log('8. Submitting answer...');
    const questions = sessionResponse.data.questions;
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      const answerResponse = await axios.post(`${baseUrl}/api/mock-interview/answer`, {
        questionId: firstQuestion.id,
        answer: 'This is a test answer',
        code: 'function test() { return "hello"; }',
        timeSpent: 300
      }, {
        headers: { Cookie: cookieHeader }
      });
      
      console.log('✅ Answer submitted successfully');
    }
    
    // Step 9: Complete interview
    console.log('9. Completing interview...');
    const completeResponse = await axios.post(`${baseUrl}/api/mock-interview/complete/${sessionId}`, {}, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log('✅ Interview completed:', completeResponse.data);
    
    console.log('\n🎉 All tests passed! Mock interview system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    // Debug information
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testMockInterviewSystem();