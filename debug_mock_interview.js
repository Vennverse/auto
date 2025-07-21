// Direct test of mock interview system
import { mockInterviewService } from './server/mockInterviewService.js';

async function debugMockInterview() {
  console.log('🔍 Testing mock interview service directly...');
  
  try {
    const testConfig = {
      role: 'Software Engineer',
      company: 'Google',
      difficulty: 'medium',
      interviewType: 'technical',
      language: 'javascript',
      totalQuestions: 3
    };
    
    console.log('🔍 Starting interview with config:', testConfig);
    
    const interview = await mockInterviewService.startInterview('test-user-123', testConfig);
    
    console.log('🔍 Interview result:', interview);
    
    if (interview && interview.sessionId) {
      console.log('✅ Mock interview system is working!');
      console.log('📝 Session ID:', interview.sessionId);
    } else {
      console.log('❌ Mock interview system is not working - no sessionId returned');
    }
    
  } catch (error) {
    console.error('❌ Error testing mock interview:', error);
  }
}

debugMockInterview();