// AutoJobr Extension Test Script
// This script tests all extension features with real user data

console.log('=== AutoJobr Extension Test Suite ===');

async function testExtensionFeatures() {
  try {
    // Test 1: API Connection
    console.log('🔄 Testing API connection...');
    const connectionTest = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, resolve);
    });
    
    if (connectionTest.success) {
      console.log('✅ API connection successful');
      console.log('👤 User profile loaded:', connectionTest.data?.firstName, connectionTest.data?.lastName);
      console.log('📧 Email:', connectionTest.data?.email);
      console.log('💼 Skills count:', connectionTest.data?.skills?.length || 0);
      console.log('🎓 Education entries:', connectionTest.data?.education?.length || 0);
      console.log('💻 Work experience entries:', connectionTest.data?.workExperience?.length || 0);
    } else {
      console.log('❌ API connection failed:', connectionTest.error);
      return false;
    }
    
    // Test 2: Job Data Extraction
    console.log('\n🔄 Testing job data extraction...');
    const jobData = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getJobData' }, resolve);
        } else {
          resolve({ success: false, error: 'No active tab' });
        }
      });
    });
    
    if (jobData?.success) {
      console.log('✅ Job data extracted successfully');
      console.log('🏢 Company:', jobData.data?.company || 'Not found');
      console.log('📋 Job title:', jobData.data?.title || 'Not found');
      console.log('📍 Location:', jobData.data?.location || 'Not found');
      console.log('🌐 Source:', jobData.data?.source || 'Unknown');
    } else {
      console.log('⚠️ Job data extraction failed (this is normal if not on a job page)');
    }
    
    // Test 3: Form Detection
    console.log('\n🔄 Testing form detection...');
    const formTest = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzeJobPage' }, resolve);
        } else {
          resolve({ success: false, error: 'No active tab' });
        }
      });
    });
    
    if (formTest?.success) {
      console.log('✅ Page analysis completed');
      console.log('📝 Forms detected on current page');
    } else {
      console.log('⚠️ No job application forms detected on current page');
    }
    
    // Test 4: User Profile Storage
    console.log('\n🔄 Testing user profile storage...');
    const storageTest = await chrome.storage.sync.get(['userProfile']);
    if (storageTest.userProfile) {
      console.log('✅ User profile stored in extension');
      console.log('📊 Profile data size:', JSON.stringify(storageTest.userProfile).length, 'bytes');
    } else {
      console.log('❌ No user profile in storage');
    }
    
    // Test 5: Settings Check
    console.log('\n🔄 Testing extension settings...');
    const settingsTest = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, resolve);
    });
    
    if (settingsTest.success) {
      console.log('✅ Settings loaded successfully');
      console.log('🔧 Auto-fill enabled:', settingsTest.data.autofillEnabled !== false);
      console.log('🌐 API URL:', settingsTest.data.apiUrl || 'Default');
    } else {
      console.log('❌ Failed to load settings');
    }
    
    console.log('\n=== Test Summary ===');
    console.log('Extension is ready for job application automation!');
    console.log('Next steps:');
    console.log('1. Navigate to a job posting page');
    console.log('2. Click "Auto-Fill Form" to fill application forms');
    console.log('3. Use "Generate Cover Letter" for personalized cover letters');
    console.log('4. Applications will be automatically tracked');
    
    return true;
    
  } catch (error) {
    console.error('❌ Extension test failed:', error);
    return false;
  }
}

// Run tests when script loads
testExtensionFeatures();

console.log('AutoJobr Extension Test Suite completed');