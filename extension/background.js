// Background script for AutoJobr Extension
class AutoJobrBackground {
  constructor() {
    this.apiBase = 'https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev';
    this.isAuthenticated = false;
    this.userProfile = null;
    
    this.init();
  }

  init() {
    // Listen for tab updates to detect job pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkJobPage(tab);
      }
    });

    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Initialize authentication check
    this.checkAuthentication();
    
    console.log('AutoJobr background script initialized');
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'CHECK_AUTH':
          await this.checkAuthentication();
          sendResponse({
            success: true,
            authenticated: this.isAuthenticated,
            profile: this.userProfile
          });
          break;

        case 'GET_PROFILE':
          if (this.isAuthenticated) {
            if (!this.userProfile) {
              await this.loadUserProfile();
            }
            sendResponse({
              success: true,
              profile: this.userProfile
            });
          } else {
            sendResponse({
              success: false,
              error: 'Not authenticated'
            });
          }
          break;

        case 'SAVE_JOB':
          const saveResult = await this.saveJob(message.jobData);
          sendResponse(saveResult);
          break;

        case 'TRACK_APPLICATION':
          const trackResult = await this.trackApplication(message.applicationData);
          sendResponse(trackResult);
          break;

        default:
          sendResponse({
            success: false,
            error: 'Unknown action: ' + message.action
          });
      }
    } catch (error) {
      console.error('Background message handling error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async checkAuthentication() {
    try {
      const response = await fetch(`${this.apiBase}/api/user`, {
        credentials: 'include',
        method: 'GET'
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.isAuthenticated = true;
        await this.loadUserProfile();
        console.log('🔐 AutoJobr background: Authenticated successfully');
      } else {
        this.isAuthenticated = false;
        console.log('❌ AutoJobr background: Not authenticated');
      }
    } catch (error) {
      console.log('❌ AutoJobr background: Authentication check failed:', error);
      this.isAuthenticated = false;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) return;

    try {
      const [profileRes, skillsRes, experienceRes, educationRes] = await Promise.all([
        fetch(`${this.apiBase}/api/profile`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/skills`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/work-experience`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/education`, { credentials: 'include' })
      ]);

      if (profileRes.ok && skillsRes.ok && experienceRes.ok && educationRes.ok) {
        const [profile, skills, experience, education] = await Promise.all([
          profileRes.json(),
          skillsRes.json(),
          experienceRes.json(),
          educationRes.json()
        ]);

        this.userProfile = {
          profile,
          skills,
          experience,
          education,
          lastUpdated: Date.now()
        };

        // Cache profile for offline use
        await chrome.storage.local.set({
          autojobr_profile: this.userProfile
        });

        console.log('✅ Background: User profile loaded and cached');
      }
    } catch (error) {
      console.error('Background: Failed to load user profile:', error);
    }
  }

  checkJobPage(tab) {
    if (!tab.url) return;

    const jobSites = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'workday.com',
      'lever.co',
      'greenhouse.io',
      'monster.com',
      'ziprecruiter.com',
      'wellfound.com',
      'angel.co',
      'bamboohr.com',
      'smartrecruiters.com',
      'jobvite.com',
      'icims.com',
      'taleo.net',
      'successfactors.com',
      'ashbyhq.com'
    ];

    const isJobSite = jobSites.some(site => tab.url.includes(site));
    
    if (isJobSite) {
      // Update badge to indicate job site
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: '●'
      });
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: '#10b981'
      });
    } else {
      // Clear badge
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: ''
      });
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'CHECK_AUTH':
          await this.checkAuthentication();
          sendResponse({
            success: true,
            authenticated: this.isAuthenticated
          });
          break;

        case 'GET_PROFILE':
          if (!this.userProfile) {
            await this.loadUserProfile();
          }
          sendResponse({
            success: true,
            profile: this.userProfile
          });
          break;

        case 'REFRESH_PROFILE':
          await this.loadUserProfile();
          sendResponse({
            success: true,
            profile: this.userProfile
          });
          break;

        case 'GENERATE_COVER_LETTER':
          const coverLetterResult = await this.generateCoverLetter(message.jobData);
          sendResponse(coverLetterResult);
          break;

        case 'SAVE_JOB':
          const saveResult = await this.saveJob(message.jobData);
          sendResponse(saveResult);
          break;

        case 'TRACK_APPLICATION':
          const trackResult = await this.trackApplication(message.applicationData);
          sendResponse(trackResult);
          break;

        default:
          sendResponse({
            success: false,
            error: 'Unknown action'
          });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async generateCoverLetter(jobData) {
    if (!this.isAuthenticated || !jobData) {
      return { success: false, error: 'Not authenticated or missing job data' };
    }

    try {
      const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription: jobData.description,
          companyName: jobData.company,
          jobTitle: jobData.title,
          useProfile: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, coverLetter: result.coverLetter };
      } else {
        return { success: false, error: 'Failed to generate cover letter' };
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async saveJob(jobData) {
    if (!this.isAuthenticated || !jobData) {
      return { success: false, error: 'Not authenticated or missing job data' };
    }

    try {
      const response = await fetch(`${this.apiBase}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...jobData,
          savedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to save job' };
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      return { success: false, error: error.message };
    }
  }

  async trackApplication(applicationData) {
    if (!this.isAuthenticated || !applicationData) {
      return { success: false, error: 'Not authenticated or missing application data' };
    }

    try {
      const response = await fetch(`${this.apiBase}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...applicationData,
          source: 'extension',
          appliedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to track application' };
      }
    } catch (error) {
      console.error('Failed to track application:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize background script
new AutoJobrBackground();