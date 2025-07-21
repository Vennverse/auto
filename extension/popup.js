// Modern Popup Script for AutoJobr Extension
class AutoJobrPopup {
  constructor() {
    this.apiBase = 'https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev';
    this.isAuthenticated = false;
    this.userProfile = null;
    this.currentJobData = null;
    this.isJobPage = false;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing AutoJobr popup...');
    
    try {
      // Show loading state
      this.showLoadingState();
      
      // Check authentication and current page
      await Promise.all([
        this.checkAuthentication(),
        this.checkCurrentPage()
      ]);
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update UI based on auth status
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showErrorState();
    }
  }

  async checkAuthentication() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      
      if (response && response.success && response.authenticated) {
        this.isAuthenticated = true;
        await this.loadUserProfile();
        console.log('✅ Authenticated successfully');
      } else {
        this.isAuthenticated = false;
        console.log('❌ Not authenticated');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.isAuthenticated = false;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) return;

    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_PROFILE' });
      
      if (response && response.success && response.profile) {
        this.userProfile = response.profile;
        console.log('✅ User profile loaded');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        // Check if current page is a supported job board
        const isJobBoard = this.isJobBoardUrl(tab.url);
        
        if (isJobBoard) {
          try {
            // Add a timeout to the message
            const response = await this.sendMessageWithTimeout(tab.id, {
              action: 'GET_JOB_DATA'
            }, 3000);
            
            if (response && response.success) {
              this.isJobPage = response.isJobPage;
              this.currentJobData = response.jobData;
              console.log('📋 Current page job status:', this.isJobPage);
            }
          } catch (messageError) {
            console.log('Content script not available, might be loading...');
            this.isJobPage = false;
          }
        } else {
          this.isJobPage = false;
        }
      }
    } catch (error) {
      console.log('Error checking current page:', error);
      this.isJobPage = false;
    }
  }

  isJobBoardUrl(url) {
    const jobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'workday.com',
      'lever.co', 'greenhouse.io', 'monster.com', 'ziprecruiter.com',
      'wellfound.com', 'angel.co'
    ];
    return jobBoards.some(board => url.includes(board));
  }

  async sendMessageWithTimeout(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, timeout);

      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  setupEventListeners() {
    // Authentication buttons
    this.setupButton('sign-in-btn', () => this.openSignIn());
    this.setupButton('refresh-auth', () => this.refreshAuth());
    this.setupButton('retry-connection', () => this.retryConnection());
    this.setupButton('open-platform', () => this.openPlatform());

    // Main action buttons
    this.setupButton('autofill-btn', () => this.performAutofill());
    this.setupButton('cover-letter-btn', () => this.generateCoverLetter());
    this.setupButton('analyze-job-btn', () => this.analyzeJob());
    this.setupButton('save-job-btn', () => this.saveJob());
    this.setupButton('refresh-profile-btn', () => this.refreshProfile());

    // Footer links
    this.setupButton('open-dashboard', () => this.openPage('/'));
    this.setupButton('open-settings', () => this.openPage('/profile'));
    this.setupButton('open-help', () => this.openPage('/help'));
  }

  setupButton(id, handler) {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', handler);
    }
  }

  updateUI() {
    this.hideAllStates();
    
    if (this.isAuthenticated) {
      this.showAuthenticatedState();
    } else {
      this.showUnauthenticatedState();
    }
  }

  hideAllStates() {
    ['loading-state', 'error-state', 'authenticated-state', 'unauthenticated-state'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }

  showLoadingState() {
    this.hideAllStates();
    document.getElementById('loading-state')?.classList.remove('hidden');
  }

  showErrorState() {
    this.hideAllStates();
    document.getElementById('error-state')?.classList.remove('hidden');
  }

  showAuthenticatedState() {
    document.getElementById('authenticated-state')?.classList.remove('hidden');
    this.updateUserInfo();
    this.updateJobStatus();
    this.updateJobAnalysis();
  }

  showUnauthenticatedState() {
    document.getElementById('unauthenticated-state')?.classList.remove('hidden');
  }

  updateUserInfo() {
    if (!this.userProfile?.profile) return;

    const profile = this.userProfile.profile;
    const firstName = profile.firstName || profile.fullName?.split(' ')[0] || 'User';
    const avatar = firstName.charAt(0).toUpperCase();
    
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userTitle = document.getElementById('user-title');
    
    if (userAvatar) userAvatar.textContent = avatar;
    if (userName) userName.textContent = profile.fullName || firstName;
    if (userTitle) userTitle.textContent = profile.jobTitle || 'Job Seeker';

    // Update stats with real or placeholder data
    this.updateStats();
  }

  updateStats() {
    // You can enhance this with real data from your backend
    const applicationsCount = document.getElementById('applications-count');
    const successRate = document.getElementById('success-rate');
    
    if (applicationsCount) applicationsCount.textContent = '12'; // Replace with real data
    if (successRate) successRate.textContent = '85%'; // Replace with real data
  }

  updateJobStatus() {
    const jobDetected = document.getElementById('job-detected');
    const noJobDetected = document.getElementById('no-job-detected');
    
    if (this.isJobPage && this.currentJobData) {
      jobDetected?.classList.remove('hidden');
      noJobDetected?.classList.add('hidden');
    } else {
      jobDetected?.classList.add('hidden');
      noJobDetected?.classList.remove('hidden');
    }
  }

  updateJobAnalysis() {
    const jobAnalysis = document.getElementById('job-analysis');
    
    if (this.currentJobData?.analysis) {
      const analysis = this.currentJobData.analysis;
      const score = analysis.matchScore || 0;
      
      // Update match score
      const matchScore = document.getElementById('match-score');
      const analysisSummary = document.getElementById('analysis-summary');
      const matchedSkills = document.getElementById('matched-skills');
      const experienceYears = document.getElementById('experience-years');
      
      if (matchScore) {
        matchScore.textContent = `${score}%`;
        matchScore.className = `match-score ${score >= 80 ? 'score-high' : score >= 60 ? 'score-medium' : 'score-low'}`;
      }
      
      if (analysisSummary) analysisSummary.textContent = analysis.recommendation || 'Job analyzed';
      if (matchedSkills) matchedSkills.textContent = analysis.matchedSkills?.length || 0;
      if (experienceYears) experienceYears.textContent = analysis.experienceYears || 0;
      
      jobAnalysis?.classList.remove('hidden');
    } else {
      jobAnalysis?.classList.add('hidden');
    }
  }

  // Action Methods
  async openSignIn() {
    const url = `${this.apiBase}/auth`;
    await chrome.tabs.create({ url });
    window.close();
  }

  async openPlatform() {
    const url = this.apiBase;
    await chrome.tabs.create({ url });
    window.close();
  }

  async openPage(path) {
    const url = `${this.apiBase}${path}`;
    await chrome.tabs.create({ url });
    window.close();
  }

  async refreshAuth() {
    this.showLoadingState();
    await this.checkAuthentication();
    this.updateUI();
  }

  async retryConnection() {
    this.showLoadingState();
    
    // Clear any cached authentication state
    this.isAuthenticated = false;
    this.userProfile = null;
    
    // Try multiple times to establish connection
    let attempts = 0;
    let connected = false;
    
    while (attempts < 3 && !connected) {
      attempts++;
      try {
        await Promise.all([
          this.checkAuthentication(),
          this.checkCurrentPage()
        ]);
        connected = this.isAuthenticated;
        if (!connected && attempts < 3) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`Connection attempt ${attempts} failed:`, error);
        if (attempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    this.updateUI();
  }

  async performAutofill() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in first', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'PERFORM_AUTOFILL',
          userProfile: this.userProfile
        });
        
        this.showNotification('Autofill started!', 'success');
        window.close();
      }
    } catch (error) {
      console.error('Autofill failed:', error);
      this.showNotification('Autofill failed', 'error');
    }
  }

  async generateCoverLetter() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in first', 'error');
      return;
    }

    if (!this.currentJobData) {
      this.showNotification('Navigate to a job posting first', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'GENERATE_COVER_LETTER',
          jobData: this.currentJobData
        });
        
        this.showNotification('Cover letter generated!', 'success');
        window.close();
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      this.showNotification('Cover letter generation failed', 'error');
    }
  }

  async analyzeJob() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in first', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // Show analyzing state
        this.showAnalyzingState();
        
        try {
          const response = await this.sendMessageWithTimeout(tab.id, {
            action: 'ANALYZE_JOB'
          }, 5000);
          
          if (response && response.success) {
            // Refresh job data after analysis
            setTimeout(async () => {
              await this.checkCurrentPage();
              this.updateJobAnalysis();
            }, 1000);
            
            this.showNotification('Job analysis completed!', 'success');
          } else {
            this.showNotification('Analysis failed: ' + (response?.error || 'Unknown error'), 'error');
          }
        } catch (messageError) {
          this.showNotification('Could not connect to page. Please refresh and try again.', 'error');
        } finally {
          this.resetAnalyzeButton();
        }
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
      this.showNotification('Job analysis failed: ' + error.message, 'error');
      this.resetAnalyzeButton();
    }
  }

  showAnalyzingState() {
    const analyzeBtn = document.getElementById('analyze-job-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = '📊 Analyzing...';
    }
  }

  resetAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyze-job-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = '📊 Analyze Job Match';
    }
  }

  async saveJob() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in first', 'error');
      return;
    }

    if (!this.currentJobData) {
      this.showNotification('No job data to save', 'error');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'SAVE_JOB',
        jobData: this.currentJobData
      });
      
      if (response && response.success) {
        this.showNotification('Job saved successfully!', 'success');
      } else {
        this.showNotification('Failed to save job', 'error');
      }
    } catch (error) {
      console.error('Save job failed:', error);
      this.showNotification('Failed to save job', 'error');
    }
  }

  async refreshProfile() {
    if (!this.isAuthenticated) return;

    try {
      this.showNotification('Refreshing profile...', 'info');
      
      const response = await chrome.runtime.sendMessage({ action: 'REFRESH_PROFILE' });
      
      if (response && response.success) {
        this.userProfile = response.profile;
        this.updateUserInfo();
        this.showNotification('Profile refreshed!', 'success');
      } else {
        this.showNotification('Failed to refresh profile', 'error');
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
      this.showNotification('Failed to refresh profile', 'error');
    }
  }

  showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `autojobr-notification autojobr-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      z-index: 10000;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrPopup();
});