// Advanced Content Script for AutoJobr Extension
(function() {
  'use strict';

  class AutoJobrWidget {
    constructor() {
      this.isInitialized = false;
      this.userProfile = null;
      this.isAuthenticated = false;
      this.currentJobData = null;
      this.widget = null;
      this.isMinimized = false;
      this.settings = {
        autoFill: true,
        autoAnalyze: true,
        showNotifications: true
      };
      
      this.init();
    }

    async init() {
      if (this.isInitialized) return;
      
      try {
        await this.loadSettings();
        await this.checkAuthentication();
        await this.createWidget();
        await this.analyzeCurrentPage();
        
        this.isInitialized = true;
        console.log('AutoJobr widget initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AutoJobr widget:', error);
      }
    }

    async loadSettings() {
      const result = await chrome.storage.local.get('autojobr_settings');
      if (result.autojobr_settings) {
        this.settings = { ...this.settings, ...result.autojobr_settings };
      }
    }

    async saveSettings() {
      await chrome.storage.local.set({ autojobr_settings: this.settings });
    }

    async checkAuthentication() {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
        if (response.success && response.authenticated) {
          this.isAuthenticated = true;
          this.userProfile = await this.getUserProfile();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        this.isAuthenticated = false;
      }
    }

    async getUserProfile() {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_PROFILE' });
        return response.success ? response.profile : null;
      } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }
    }

    async createWidget() {
      // Remove existing widget if present
      const existingWidget = document.getElementById('autojobr-widget');
      if (existingWidget) {
        existingWidget.remove();
      }

      this.widget = document.createElement('div');
      this.widget.id = 'autojobr-widget';
      this.widget.className = 'autojobr-floating-widget';
      
      this.updateWidgetContent();
      document.body.appendChild(this.widget);
      
      // Add event listeners
      this.addEventListeners();
    }

    updateWidgetContent() {
      if (!this.widget) return;

      const statusIcon = this.isAuthenticated ? 'connected' : 'disconnected';
      const statusText = this.isAuthenticated ? 'Connected' : 'Connection failed';
      
      this.widget.innerHTML = `
        <div class="autojobr-header ${this.isMinimized ? 'hidden' : ''}">
          <div class="autojobr-logo">AutoJobr</div>
          <button class="autojobr-minimize-btn" id="autojobr-minimize">
            ${this.isMinimized ? '⬆️' : '⬇️'}
          </button>
        </div>
        
        <div class="autojobr-content ${this.isMinimized ? 'hidden' : ''}">
          <div class="autojobr-status">
            <div class="autojobr-status-icon ${statusIcon}"></div>
            <div class="autojobr-status-text">${statusText}</div>
          </div>
          
          ${this.isAuthenticated ? this.renderAuthenticatedContent() : this.renderUnauthenticatedContent()}
        </div>
      `;
    }

    renderAuthenticatedContent() {
      const profile = this.userProfile?.profile || {};
      const avatar = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U';
      
      return `
        <div class="autojobr-profile">
          <div class="autojobr-profile-header">
            <div class="autojobr-avatar">${avatar}</div>
            <div class="autojobr-profile-info">
              <h3>${profile.fullName || 'User'}</h3>
              <p>${profile.jobTitle || 'Developer'}</p>
            </div>
          </div>
        </div>
        
        ${this.currentJobData ? this.renderJobAnalysis() : ''}
        
        <div class="autojobr-actions">
          <button class="autojobr-btn" id="autojobr-fill-form">
            ${this.isFormDetected() ? '⚡ Fill Job Application Forms' : '🔍 Scan for Forms'}
          </button>
          
          <button class="autojobr-btn secondary" id="autojobr-generate-cover-letter">
            📄 Generate Cover Letter
          </button>
          
          <button class="autojobr-btn secondary" id="autojobr-analyze-job">
            📊 Analyze Job Match
          </button>
        </div>
        
        <div class="autojobr-settings">
          <div class="autojobr-setting-item">
            <span>Smart Form Filling</span>
            <div class="autojobr-toggle ${this.settings.autoFill ? 'active' : ''}" id="autojobr-toggle-autofill"></div>
          </div>
          
          <div class="autojobr-setting-item">
            <span>Auto Job Analysis</span>
            <div class="autojobr-toggle ${this.settings.autoAnalyze ? 'active' : ''}" id="autojobr-toggle-analyze"></div>
          </div>
        </div>
      `;
    }

    renderUnauthenticatedContent() {
      return `
        <div style="text-align: center; padding: 20px;">
          <p style="margin-bottom: 16px; opacity: 0.8;">
            Sign in to AutoJobr to access smart form filling and job analysis features.
          </p>
          <button class="autojobr-btn" id="autojobr-open-login">
            🔑 Open AutoJobr Platform
          </button>
        </div>
      `;
    }

    renderJobAnalysis() {
      if (!this.currentJobData?.analysis) return '';
      
      const analysis = this.currentJobData.analysis;
      const score = analysis.matchScore || 0;
      const scoreClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      
      return `
        <div class="autojobr-job-analysis">
          <div class="autojobr-analysis-header">
            <h4>Job Analysis</h4>
          </div>
          
          <div class="autojobr-match-score">
            <span>Match Score</span>
            <div class="autojobr-score-circle autojobr-score-${scoreClass}">
              ${score}%
            </div>
          </div>
          
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
            ${analysis.summary || 'Job requirements analyzed'}
          </div>
        </div>
      `;
    }

    addEventListeners() {
      if (!this.widget) return;

      // Minimize/maximize toggle
      const minimizeBtn = this.widget.querySelector('#autojobr-minimize');
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
      }

      // Fill form button
      const fillFormBtn = this.widget.querySelector('#autojobr-fill-form');
      if (fillFormBtn) {
        fillFormBtn.addEventListener('click', () => this.handleFillForm());
      }

      // Generate cover letter button
      const coverLetterBtn = this.widget.querySelector('#autojobr-generate-cover-letter');
      if (coverLetterBtn) {
        coverLetterBtn.addEventListener('click', () => this.handleGenerateCoverLetter());
      }

      // Analyze job button
      const analyzeBtn = this.widget.querySelector('#autojobr-analyze-job');
      if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => this.handleAnalyzeJob());
      }

      // Settings toggles
      const autoFillToggle = this.widget.querySelector('#autojobr-toggle-autofill');
      if (autoFillToggle) {
        autoFillToggle.addEventListener('click', () => this.toggleSetting('autoFill'));
      }

      const autoAnalyzeToggle = this.widget.querySelector('#autojobr-toggle-analyze');
      if (autoAnalyzeToggle) {
        autoAnalyzeToggle.addEventListener('click', () => this.toggleSetting('autoAnalyze'));
      }

      // Login button for unauthenticated users
      const loginBtn = this.widget.querySelector('#autojobr-open-login');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.openLoginPage());
      }
    }

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.widget.classList.toggle('minimized', this.isMinimized);
      this.updateWidgetContent();
    }

    toggleSetting(setting) {
      this.settings[setting] = !this.settings[setting];
      this.saveSettings();
      this.updateWidgetContent();
    }

    openLoginPage() {
      const loginUrl = 'https://6d490f6a-220b-4865-9c1e-56491791d355-00-fobjhe3sa4h6.spock.replit.dev/login';
      window.open(loginUrl, '_blank');
    }

    async analyzeCurrentPage() {
      if (!this.settings.autoAnalyze || !this.isAuthenticated) return;

      try {
        const jobData = await this.extractJobData();
        if (jobData && this.isJobBoard()) {
          const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_JOB',
            jobData
          });
          
          if (response.success) {
            this.currentJobData = {
              ...jobData,
              analysis: response.analysis
            };
            this.updateWidgetContent();
          }
        }
      } catch (error) {
        console.error('Failed to analyze current page:', error);
      }
    }

    async extractJobData() {
      const extractors = {
        // LinkedIn job extraction
        linkedin: () => {
          const title = document.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.textContent?.trim();
          const company = document.querySelector('.top-card-layout__card .top-card-layout__second-subline a, .job-details-jobs-unified-top-card__company-name')?.textContent?.trim();
          const description = document.querySelector('.jobs-box__html-content, .jobs-description-content__text')?.textContent?.trim();
          const location = document.querySelector('.top-card-layout__third-subline, .job-details-jobs-unified-top-card__bullet')?.textContent?.trim();
          
          return { title, company, description, location, platform: 'LinkedIn' };
        },

        // Indeed job extraction
        indeed: () => {
          const title = document.querySelector('[data-jk] h1, .jobsearch-JobInfoHeader-title')?.textContent?.trim();
          const company = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-JobInfoHeader-subtitle')?.textContent?.trim();
          const description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim();
          const location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle + div')?.textContent?.trim();
          
          return { title, company, description, location, platform: 'Indeed' };
        },

        // Glassdoor job extraction
        glassdoor: () => {
          const title = document.querySelector('[data-test="job-title"], .jobHeader h1')?.textContent?.trim();
          const company = document.querySelector('[data-test="employer-name"], .jobHeader .employerName')?.textContent?.trim();
          const description = document.querySelector('[data-test="jobDescriptionContainer"], .jobDescriptionContent')?.textContent?.trim();
          const location = document.querySelector('[data-test="job-location"], .jobHeader .location')?.textContent?.trim();
          
          return { title, company, description, location, platform: 'Glassdoor' };
        },

        // Generic job extraction
        generic: () => {
          // Try common selectors used across job boards
          const titleSelectors = ['h1', '.job-title', '.position-title', '[class*="title"]', '[class*="job-title"]'];
          const companySelectors = ['.company-name', '.employer', '[class*="company"]', '[class*="employer"]'];
          const descriptionSelectors = ['.job-description', '.description', '[class*="description"]', '[class*="job-desc"]'];
          const locationSelectors = ['.location', '.job-location', '[class*="location"]'];
          
          const title = this.findTextBySelectors(titleSelectors);
          const company = this.findTextBySelectors(companySelectors);
          const description = this.findTextBySelectors(descriptionSelectors);
          const location = this.findTextBySelectors(locationSelectors);
          
          return { title, company, description, location, platform: 'Generic' };
        }
      };

      const hostname = window.location.hostname.toLowerCase();
      
      if (hostname.includes('linkedin.com')) {
        return extractors.linkedin();
      } else if (hostname.includes('indeed.com')) {
        return extractors.indeed();
      } else if (hostname.includes('glassdoor.com')) {
        return extractors.glassdoor();
      } else {
        return extractors.generic();
      }
    }

    findTextBySelectors(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    }

    isJobBoard() {
      const hostname = window.location.hostname.toLowerCase();
      const jobBoards = [
        'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
        'ziprecruiter.com', 'careerbuilder.com', 'dice.com', 'stackoverflow.com',
        'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co', 'workday.com'
      ];
      
      return jobBoards.some(domain => hostname.includes(domain));
    }

    isFormDetected() {
      const forms = document.querySelectorAll('form');
      const jobApplicationKeywords = [
        'application', 'apply', 'job', 'resume', 'cv', 'cover letter',
        'first name', 'last name', 'email', 'phone', 'experience'
      ];
      
      for (const form of forms) {
        const formText = form.textContent.toLowerCase();
        if (jobApplicationKeywords.some(keyword => formText.includes(keyword))) {
          return true;
        }
      }
      
      return false;
    }

    async handleFillForm() {
      if (!this.isAuthenticated || !this.userProfile) {
        this.showNotification('Please sign in to use auto-fill features', 'error');
        return;
      }

      try {
        this.showNotification('Analyzing and filling forms...', 'info');
        const formFiller = new SmartFormFiller(this.userProfile);
        const filledCount = await formFiller.fillAllForms();
        
        if (filledCount > 0) {
          this.showNotification(`Successfully filled ${filledCount} form(s)`, 'success');
        } else {
          this.showNotification('No application forms found on this page', 'error');
        }
      } catch (error) {
        console.error('Form filling failed:', error);
        this.showNotification('Failed to fill forms. Please try again.', 'error');
      }
    }

    async handleGenerateCoverLetter() {
      if (!this.isAuthenticated) {
        this.showNotification('Please sign in to generate cover letters', 'error');
        return;
      }

      try {
        const jobData = await this.extractJobData();
        if (!jobData?.description || !jobData?.company) {
          this.showNotification('Unable to detect job details on this page', 'error');
          return;
        }

        this.showNotification('Generating personalized cover letter...', 'info');
        
        const response = await chrome.runtime.sendMessage({
          action: 'GENERATE_COVER_LETTER',
          jobDescription: jobData.description,
          companyName: jobData.company
        });

        if (response.success) {
          this.showCoverLetterModal(response.coverLetter);
        } else {
          this.showNotification('Failed to generate cover letter', 'error');
        }
      } catch (error) {
        console.error('Cover letter generation failed:', error);
        this.showNotification('Failed to generate cover letter', 'error');
      }
    }

    async handleAnalyzeJob() {
      if (!this.isAuthenticated) {
        this.showNotification('Please sign in to analyze jobs', 'error');
        return;
      }

      try {
        this.showNotification('Analyzing job requirements...', 'info');
        await this.analyzeCurrentPage();
        
        if (this.currentJobData?.analysis) {
          this.showNotification('Job analysis complete!', 'success');
        } else {
          this.showNotification('Unable to analyze this job posting', 'error');
        }
      } catch (error) {
        console.error('Job analysis failed:', error);
        this.showNotification('Failed to analyze job', 'error');
      }
    }

    showCoverLetterModal(coverLetter) {
      const modal = document.createElement('div');
      modal.className = 'autojobr-form-overlay';
      modal.innerHTML = `
        <div class="autojobr-form-modal">
          <div class="autojobr-form-header">
            <h2>Generated Cover Letter</h2>
            <p>Personalized for this position</p>
          </div>
          
          <textarea 
            style="width: 100%; height: 300px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"
            placeholder="Your cover letter will appear here..."
          >${coverLetter.content || coverLetter}</textarea>
          
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="autojobr-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.previousElementSibling.value); this.textContent='Copied!'">
              📋 Copy to Clipboard
            </button>
            <button class="autojobr-btn secondary" onclick="this.closest('.autojobr-form-overlay').remove()">
              ✕ Close
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Auto-remove after 30 seconds
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 30000);
    }

    showNotification(message, type = 'success') {
      if (!this.settings.showNotifications) return;

      const notification = document.createElement('div');
      notification.className = `autojobr-notification ${type === 'error' ? 'error' : ''}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
  }

  // Smart Form Filler Class
  class SmartFormFiller {
    constructor(userProfile) {
      this.profile = userProfile?.profile || {};
      this.skills = userProfile?.skills || [];
      this.workExperience = userProfile?.workExperience || [];
      this.education = userProfile?.education || [];
    }

    async fillAllForms() {
      const forms = document.querySelectorAll('form');
      let filledCount = 0;

      for (const form of forms) {
        if (this.isJobApplicationForm(form)) {
          await this.fillForm(form);
          filledCount++;
        }
      }

      return filledCount;
    }

    isJobApplicationForm(form) {
      const formText = form.textContent.toLowerCase();
      const indicators = [
        'first name', 'last name', 'resume', 'cv', 'application',
        'phone number', 'cover letter', 'experience', 'apply now'
      ];
      
      return indicators.some(indicator => formText.includes(indicator));
    }

    async fillForm(form) {
      const fieldMappings = this.getFieldMappings();
      
      for (const [fieldType, value] of Object.entries(fieldMappings)) {
        if (!value) continue;
        
        const fields = this.findFieldsByType(form, fieldType);
        for (const field of fields) {
          await this.fillField(field, value);
        }
      }
    }

    getFieldMappings() {
      const latestJob = this.workExperience[0] || {};
      const latestEducation = this.education[0] || {};
      
      return {
        firstName: this.profile.fullName?.split(' ')[0] || '',
        lastName: this.profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: this.profile.email || '',
        phone: this.profile.phone || '',
        city: this.profile.location?.split(',')[0] || '',
        state: this.profile.location?.split(',')[1]?.trim() || '',
        country: this.profile.location?.split(',')[2]?.trim() || this.profile.location || '',
        linkedinUrl: this.profile.linkedinUrl || '',
        githubUrl: this.profile.githubUrl || '',
        portfolioUrl: this.profile.portfolioUrl || '',
        currentJobTitle: latestJob.jobTitle || this.profile.jobTitle || '',
        currentCompany: latestJob.companyName || '',
        yearsExperience: this.profile.yearsOfExperience || '',
        university: latestEducation.schoolName || '',
        degree: latestEducation.degree || '',
        graduationYear: latestEducation.graduationDate?.substring(0, 4) || '',
        skills: this.skills.map(skill => skill.skillName).join(', ')
      };
    }

    findFieldsByType(container, fieldType) {
      const selectors = {
        firstName: [
          'input[name*="first" i][name*="name" i]',
          'input[placeholder*="first" i][placeholder*="name" i]',
          'input[id*="first" i][id*="name" i]',
          'input[name="firstName"], input[name="first_name"]'
        ],
        lastName: [
          'input[name*="last" i][name*="name" i]',
          'input[placeholder*="last" i][placeholder*="name" i]',
          'input[id*="last" i][id*="name" i]',
          'input[name="lastName"], input[name="last_name"]'
        ],
        email: [
          'input[type="email"]',
          'input[name*="email" i]',
          'input[placeholder*="email" i]',
          'input[id*="email" i]'
        ],
        phone: [
          'input[type="tel"]',
          'input[name*="phone" i]',
          'input[placeholder*="phone" i]',
          'input[id*="phone" i]'
        ],
        city: [
          'input[name*="city" i]',
          'input[placeholder*="city" i]',
          'input[id*="city" i]'
        ],
        state: [
          'input[name*="state" i], select[name*="state" i]',
          'input[placeholder*="state" i]',
          'input[id*="state" i]'
        ],
        country: [
          'input[name*="country" i], select[name*="country" i]',
          'input[placeholder*="country" i]',
          'input[id*="country" i]'
        ],
        linkedinUrl: [
          'input[name*="linkedin" i]',
          'input[placeholder*="linkedin" i]',
          'input[id*="linkedin" i]'
        ],
        githubUrl: [
          'input[name*="github" i]',
          'input[placeholder*="github" i]',
          'input[id*="github" i]'
        ],
        portfolioUrl: [
          'input[name*="portfolio" i], input[name*="website" i]',
          'input[placeholder*="portfolio" i], input[placeholder*="website" i]',
          'input[id*="portfolio" i], input[id*="website" i]'
        ]
      };

      const typeSelectors = selectors[fieldType] || [];
      const fields = [];

      for (const selector of typeSelectors) {
        const elements = container.querySelectorAll(selector);
        fields.push(...elements);
      }

      return fields;
    }

    async fillField(field, value) {
      if (!field || !value || field.value) return; // Don't overwrite existing values

      try {
        // Focus the field
        field.focus();
        
        // Clear existing value
        field.value = '';
        
        // Simulate typing
        field.value = value;
        
        // Trigger events to ensure the form recognizes the change
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Small delay to ensure event processing
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to fill field:', error);
      }
    }
  }

  // Initialize the widget when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new AutoJobrWidget();
    });
  } else {
    new AutoJobrWidget();
  }
})();