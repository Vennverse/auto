// Popup script for AutoJobr Chrome Extension
// Handles UI interactions, settings management, and communication with background/content scripts

class AutojobrPopup {
  constructor() {
    this.isLoading = false;
    this.userProfile = null;
    this.currentAnalysis = null;
    this.settings = {
      autofillEnabled: true,
      apiUrl: 'https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev'
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadUserProfile();
    await this.loadAnalysis();
    this.bindEvents();
    this.updateUI();
  }
  
  async loadSettings() {
    try {
      const response = await this.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = { ...this.settings, ...response.data };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async loadUserProfile() {
    try {
      // Test connection first using ExtensionConfig
      const config = new (window.ExtensionConfig || globalThis.ExtensionConfig || ExtensionConfig)();
      const apiUrl = await config.detectApiUrl();
      
      console.log('Testing connection to:', apiUrl);
      
      const response = await this.sendMessage({ action: 'getUserProfile' });
      if (response && response.success) {
        this.userProfile = response.data;
        this.updateProfileSection();
        this.updateConnectionStatus(true, apiUrl);
      } else {
        this.showProfileError('Please log in to AutoJobr web app first');
        this.updateConnectionStatus(false, apiUrl);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.showProfileError('Connection failed - check if you are logged in');
      this.updateConnectionStatus(false, null);
    }
  }

  updateProfileSection() {
    const profileInfo = document.getElementById('profile-info');
    if (this.userProfile) {
      profileInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            ${this.userProfile.firstName ? this.userProfile.firstName.charAt(0) : '?'}
          </div>
          <div>
            <div style="font-weight: bold;">${this.userProfile.firstName || 'Unknown'} ${this.userProfile.lastName || 'User'}</div>
            <div style="font-size: 12px; opacity: 0.8;">${this.userProfile.professionalTitle || 'Professional'}</div>
          </div>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">
          📧 ${this.userProfile.email || 'No email'}<br>
          📍 ${this.userProfile.location || 'No location'}<br>
          💼 ${this.userProfile.yearsExperience || 0} years experience
        </div>
      `;
    } else {
      profileInfo.innerHTML = '<div class="error-message">Profile not loaded</div>';
    }
  }
  
  async loadAnalysis() {
    try {
      const settings = await chrome.storage.sync.get(['lastAnalysis']);
      this.currentAnalysis = settings.lastAnalysis;
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  }
  
  bindEvents() {
    // Autofill toggle
    const autofillToggle = document.getElementById('autofill-toggle');
    autofillToggle.addEventListener('click', () => this.toggleAutofill());
    
    // Refresh analysis button
    const refreshBtn = document.getElementById('refresh-analysis');
    refreshBtn.addEventListener('click', () => this.refreshAnalysis());
    
    // Fill forms button
    const fillFormsBtn = document.getElementById('fill-forms');
    fillFormsBtn.addEventListener('click', () => this.fillForms());
    
    // Generate cover letter button
    const coverLetterBtn = document.getElementById('generate-cover-letter');
    coverLetterBtn.addEventListener('click', () => this.generateCoverLetter());
    
    // Open dashboard link
    const dashboardLink = document.getElementById('open-dashboard');
    dashboardLink.addEventListener('click', () => this.openDashboard());
  }
  
  updateUI() {
    this.updateConnectionStatus();
    this.updateAutofillToggle();
    this.updateProfileSection();
    this.updateAnalysisSection();
  }
  
  updateConnectionStatus(connected = false, apiUrl = null) {
    const statusEl = document.querySelector('#connection-status span');
    const statusDot = document.querySelector('.status-dot');
    const statusDiv = document.getElementById('connection-status');
    
    if (connected && this.userProfile) {
      statusEl.textContent = 'Connected to AutoJobr';
      statusDot.style.background = '#10b981';
      statusDiv.className = 'status connected';
      if (apiUrl) {
        statusEl.textContent += ` (${new URL(apiUrl).hostname})`;
      }
    } else if (connected && !this.userProfile) {
      statusEl.textContent = 'Connected - Please log in';
      statusDot.style.background = '#fbbf24';
      statusDiv.className = 'status disconnected';
    } else {
      statusEl.textContent = 'Connection failed';
      statusDot.style.background = '#ef4444';
      statusDiv.className = 'status disconnected';
    }
  }
  
  updateAutofillToggle() {
    const toggle = document.getElementById('autofill-toggle');
    if (this.settings.autofillEnabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }
  

  
  updateAnalysisSection() {
    const analysisContent = document.getElementById('analysis-info');
    
    if (!this.currentAnalysis) {
      analysisContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>Navigate to a job posting to see analysis</p>
        </div>
      `;
      return;
    }
    
    const analysis = this.currentAnalysis;
    const matchScoreClass = this.getMatchScoreClass(analysis.matchScore);
    const progressColor = this.getProgressColor(analysis.matchScore);
    
    analysisContent.innerHTML = `
      <div class="analysis-card">
        <div class="match-score">
          <span class="match-score-label">Match Score</span>
          <span class="match-score-value ${matchScoreClass}">${analysis.matchScore}%</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${analysis.matchScore}%; background: ${progressColor};"></div>
        </div>
        
        <div class="analysis-details">
          <div class="analysis-item">
            <div class="analysis-item-label">Seniority</div>
            <div class="analysis-item-value">${analysis.detectedSeniority}</div>
          </div>
          <div class="analysis-item">
            <div class="analysis-item-label">Work Mode</div>
            <div class="analysis-item-value">${analysis.workMode}</div>
          </div>
        </div>
        
        ${analysis.matchingSkills && analysis.matchingSkills.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Matching Skills</div>
            <div class="skills-list">
              ${analysis.matchingSkills.slice(0, 4).map(skill => `
                <span class="skill-tag" style="background: #dcfce7; color: #166534;">${skill}</span>
              `).join('')}
              ${analysis.matchingSkills.length > 4 ? `
                <span class="skill-tag" style="background: #f3f4f6; color: #6b7280;">+${analysis.matchingSkills.length - 4}</span>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        ${analysis.missingSkills && analysis.missingSkills.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Missing Skills</div>
            <div class="skills-list">
              ${analysis.missingSkills.slice(0, 4).map(skill => `
                <span class="skill-tag" style="background: #fef3c7; color: #d97706;">${skill}</span>
              `).join('')}
              ${analysis.missingSkills.length > 4 ? `
                <span class="skill-tag" style="background: #f3f4f6; color: #6b7280;">+${analysis.missingSkills.length - 4}</span>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <div style="font-size: 11px; color: #9ca3af; text-align: center;">
          ${analysis.jobTitle ? `For: ${analysis.jobTitle}` : ''}
          ${analysis.company ? ` at ${analysis.company}` : ''}
        </div>
      </div>
    `;
  }
  
  getMatchScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
  
  getProgressColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }
  
  showProfileError(message) {
    const profileContent = document.getElementById('profile-info');
    profileContent.innerHTML = `
      <div class="error-state">
        ${message}
      </div>
    `;
  }
  
  async toggleAutofill() {
    const newState = !this.settings.autofillEnabled;
    
    try {
      await this.sendMessage({
        action: 'updateSettings',
        data: { autofillEnabled: newState }
      });
      
      this.settings.autofillEnabled = newState;
      this.updateAutofillToggle();
      
      // Notify content script
      await this.sendMessageToActiveTab({
        action: 'toggleAutofill',
        enabled: newState
      });
      
      this.showNotification(`Autofill ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling autofill:', error);
      this.showNotification('Failed to update settings', 'error');
    }
  }
  
  async refreshAnalysis() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    const refreshBtn = document.getElementById('refresh-analysis');
    const refreshText = document.getElementById('refresh-text');
    const refreshLoading = document.getElementById('refresh-loading');
    
    refreshText.style.display = 'none';
    refreshLoading.style.display = 'inline-block';
    refreshBtn.disabled = true;
    
    try {
      await this.sendMessageToActiveTab({ action: 'refreshAnalysis' });
      
      // Wait a bit and reload analysis
      setTimeout(async () => {
        await this.loadAnalysis();
        this.updateAnalysisSection();
        this.showNotification('Analysis refreshed');
      }, 2000);
      
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      this.showNotification('Failed to refresh analysis', 'error');
    } finally {
      setTimeout(() => {
        this.isLoading = false;
        refreshText.style.display = 'inline';
        refreshLoading.style.display = 'none';
        refreshBtn.disabled = false;
      }, 2000);
    }
  }
  
  async fillForms() {
    if (!this.userProfile) {
      this.showNotification('Please log in first', 'error');
      return;
    }
    
    try {
      await this.sendMessageToActiveTab({ action: 'fillForms' });
      this.showNotification('Forms filled with your profile data');
    } catch (error) {
      console.error('Error filling forms:', error);
      this.showNotification('Failed to fill forms', 'error');
    }
  }

  async generateCoverLetter() {
    if (!this.userProfile) {
      this.showNotification('Please log in first', 'error');
      return;
    }

    try {
      // Get current page job data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const jobData = await this.sendMessageToActiveTab({ action: 'getJobData' });
      
      if (!jobData || !jobData.company || !jobData.title) {
        // Prompt user for company and job title
        const company = prompt('Enter the company name:');
        const jobTitle = prompt('Enter the job title:');
        
        if (!company || !jobTitle) {
          this.showNotification('Company name and job title are required', 'error');
          return;
        }
        
        // Initialize jobData if it's null
        if (!jobData) {
          jobData = {};
        }
        
        jobData.company = company;
        jobData.title = jobTitle;
      }

      // Generate cover letter via API
      const config = new (window.ExtensionConfig || globalThis.ExtensionConfig || ExtensionConfig)();
      const apiUrl = await config.getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/cover-letter/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyName: jobData.company,
          jobTitle: jobData.title,
          jobDescription: jobData.description || ''
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Copy to clipboard and show success
      await navigator.clipboard.writeText(result.coverLetter);
      this.showNotification('Cover letter generated and copied to clipboard!');
      
    } catch (error) {
      console.error('Error generating cover letter:', error);
      this.showNotification('Failed to generate cover letter', 'error');
    }
  }
  
  openDashboard() {
    chrome.tabs.create({ url: this.settings.apiUrl });
  }
  
  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  async sendMessageToActiveTab(message) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, resolve);
    });
  }
  
  showNotification(message, type = 'info') {
    // Create temporary notification in popup
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      text-align: center;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
  
  // Listen for storage changes to update UI
  onStorageChange() {
    chrome.storage.onChanged.addListener(async (changes) => {
      if (changes.lastAnalysis) {
        this.currentAnalysis = changes.lastAnalysis.newValue;
        this.updateAnalysisSection();
      }
      
      if (changes.userProfile) {
        this.userProfile = changes.userProfile.newValue;
        this.updateProfileSection();
        this.updateConnectionStatus();
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutojobrPopup();
});