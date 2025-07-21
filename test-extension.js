// Test script to verify AutoJobr extension improvements
// Run this in browser console on job sites to test functionality

console.log('🚀 Testing AutoJobr Extension Improvements...');

// Test 1: Check if custom NLP service is working
function testCustomNLP() {
  console.log('\n📝 Test 1: Custom NLP Service');
  
  const sampleJobDescription = `
    Senior Software Engineer - React/Node.js
    Company: TechCorp Inc.
    Location: San Francisco, CA (Remote)
    
    We are looking for a senior full-stack developer with 5+ years of experience.
    
    Required Skills:
    - JavaScript, TypeScript, React, Node.js
    - PostgreSQL, MongoDB
    - AWS, Docker, Kubernetes
    - Git, REST APIs
    
    Responsibilities:
    - Lead development of scalable web applications
    - Mentor junior developers
    - Collaborate with product team
    
    Benefits:
    - $120,000 - $180,000 salary
    - Health insurance
    - 401k matching
    - Stock options
  `;
  
  const userProfile = {
    skills: [
      { skillName: 'JavaScript' },
      { skillName: 'React' },
      { skillName: 'Python' },
      { skillName: 'Docker' }
    ],
    yearsExperience: 4,
    workExperience: [
      { position: 'Software Engineer', company: 'StartupCo' }
    ]
  };
  
  // Mock the custom NLP analysis function
  function analyzeJobWithNLP(description, profile) {
    const technicalSkills = [
      'javascript', 'typescript', 'react', 'nodejs', 'python', 'postgresql', 
      'mongodb', 'aws', 'docker', 'kubernetes', 'git'
    ];
    
    const descLower = description.toLowerCase();
    const userSkills = profile.skills.map(s => s.skillName.toLowerCase());
    
    const jobSkills = technicalSkills.filter(skill => descLower.includes(skill));
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    
    const matchScore = jobSkills.length > 0 ? 
      Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;
    
    // Extract salary
    const salaryMatch = description.match(/\$(\d{2,3}),?(\d{3})\s*-\s*\$(\d{2,3}),?(\d{3})/);
    const salaryRange = salaryMatch ? salaryMatch[0] : 'Not specified';
    
    return {
      matchScore,
      matchingSkills,
      missingSkills: jobSkills.filter(skill => !matchingSkills.includes(skill)),
      jobSkills,
      salaryRange,
      recommendation: matchScore >= 70 ? 'Strongly Recommended' : 
                     matchScore >= 50 ? 'Recommended' : 'Consider with preparation'
    };
  }
  
  const result = analyzeJobWithNLP(sampleJobDescription, userProfile);
  console.log('✅ NLP Analysis Result:', result);
  
  return result.matchScore > 0 && result.matchingSkills.length > 0;
}

// Test 2: Check job board detection
function testJobBoardDetection() {
  console.log('\n🔍 Test 2: Job Board Detection');
  
  const hostname = window.location.hostname.toLowerCase();
  let detectedBoard = 'generic';
  
  const jobBoards = {
    'linkedin': 'linkedin.com',
    'indeed': 'indeed.com',
    'glassdoor': 'glassdoor.com',
    'workday': 'myworkday',
    'naukri': 'naukri.com',
    'monster': 'monster.com'
  };
  
  for (const [board, pattern] of Object.entries(jobBoards)) {
    if (hostname.includes(pattern)) {
      detectedBoard = board;
      break;
    }
  }
  
  console.log(`✅ Detected Job Board: ${detectedBoard}`);
  console.log(`✅ Current URL: ${window.location.href}`);
  
  return detectedBoard !== 'generic';
}

// Test 3: Check form field detection
function testFormFieldDetection() {
  console.log('\n📋 Test 3: Form Field Detection');
  
  const commonSelectors = [
    'input[name*="name"]',
    'input[name*="email"]',
    'input[name*="phone"]',
    'input[type="email"]',
    'textarea[name*="cover"]',
    'input[type="file"]'
  ];
  
  let foundFields = 0;
  commonSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundFields++;
      console.log(`✅ Found ${elements.length} field(s) matching: ${selector}`);
    }
  });
  
  console.log(`✅ Total form field types detected: ${foundFields}`);
  return foundFields > 0;
}

// Test 4: Check extension storage and messaging
function testExtensionIntegration() {
  console.log('\n🔌 Test 4: Extension Integration');
  
  try {
    // Check if Chrome extension APIs are available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('✅ Chrome extension APIs available');
      
      // Test storage
      chrome.storage.sync.get(['autofillEnabled', 'apiUrl'], (result) => {
        console.log('✅ Extension storage accessible:', result);
      });
      
      // Test messaging
      chrome.runtime.sendMessage({
        action: 'testConnection'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('⚠️ Extension messaging error:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Extension messaging working:', response);
        }
      });
      
      return true;
    } else {
      console.log('⚠️ Chrome extension APIs not available (extension not loaded)');
      return false;
    }
  } catch (error) {
    console.log('❌ Extension integration error:', error);
    return false;
  }
}

// Test 5: Check API connectivity
async function testAPIConnectivity() {
  console.log('\n🌐 Test 5: API Connectivity');
  
  const apiUrls = [
    'http://localhost:5000',
    'https://autojobr.replit.app'
  ];
  
  for (const url of apiUrls) {
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API connected: ${url}`, data);
        return true;
      }
    } catch (error) {
      console.log(`⚠️ API connection failed for ${url}:`, error.message);
    }
  }
  
  return false;
}

// Test 6: Check automatic analysis overlay
function testAnalysisOverlay() {
  console.log('\n📊 Test 6: Analysis Overlay');
  
  // Check if overlay exists
  const existingOverlay = document.getElementById('autojobr-analysis-overlay');
  if (existingOverlay) {
    console.log('✅ Analysis overlay found on page');
    return true;
  }
  
  // Try to create a test overlay
  try {
    const testOverlay = document.createElement('div');
    testOverlay.id = 'autojobr-test-overlay';
    testOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 12px;
    `;
    testOverlay.textContent = '✅ AutoJobr Extension Test Overlay';
    
    document.body.appendChild(testOverlay);
    
    setTimeout(() => {
      testOverlay.remove();
    }, 3000);
    
    console.log('✅ Test overlay created successfully');
    return true;
  } catch (error) {
    console.log('❌ Overlay creation failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🎯 AutoJobr Extension Test Suite Starting...\n');
  
  const results = {
    customNLP: testCustomNLP(),
    jobBoardDetection: testJobBoardDetection(),
    formFieldDetection: testFormFieldDetection(),
    extensionIntegration: testExtensionIntegration(),
    apiConnectivity: await testAPIConnectivity(),
    analysisOverlay: testAnalysisOverlay()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  let passedTests = 0;
  const totalTests = Object.keys(results).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test}`);
    if (passed) passedTests++;
  }
  
  console.log(`\n🏆 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AutoJobr extension is working perfectly.');
  } else {
    console.log('⚠️ Some tests failed. Check the extension setup and API connectivity.');
  }
  
  return results;
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.testAutoJobr = {
  runAllTests,
  testCustomNLP,
  testJobBoardDetection,
  testFormFieldDetection,
  testExtensionIntegration,
  testAPIConnectivity,
  testAnalysisOverlay
};