// Smart Job Detection and Analysis - AutoJobr Extension
class SmartJobDetector {
  constructor() {
    this.apiBase = 'https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev';
    this.isJobPage = false;
    this.jobData = null;
    this.userProfile = null;
    this.floatingPanel = null;
    this.isAuthenticated = false;
    
    this.jobSelectors = {
      linkedin: {
        title: '.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title, h1.jobs-details__job-title',
        company: '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name, .jobs-details__company-name',
        description: '.jobs-description__content, .jobs-box__html-content, .job-details-jobs-unified-top-card__primary-description-container',
        location: '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet',
        salary: '.jobs-details__salary-main-rail, .compensation__salary',
        applyButton: '.jobs-apply-button, .jobs-s-apply--top-card, button[aria-label*="Apply"]'
      },
      indeed: {
        title: '[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title',
        company: '[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating',
        description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
        location: '[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle',
        salary: '.jobsearch-JobMetadataHeader-item, .attribute_snippet',
        applyButton: '.jobsearch-IndeedApplyButton, .indeed-apply-button'
      },
      workday: {
        title: '[data-automation-id="jobPostingHeader"], h1[data-automation-id="jobPostingHeader"]',
        company: '[data-automation-id="jobPostingCompany"]',
        description: '[data-automation-id="jobPostingDescription"]',
        location: '[data-automation-id="locations"]',
        salary: '.css-1eaq0u6, .wd-u-color-text-primary-medium',
        applyButton: '[data-automation-id="applyToJobButton"]'
      },
      greenhouse: {
        title: '.app-title, h1.app-title',
        company: '.company-name, .header--company-name',
        description: '#content .section:first-of-type, .job-post-content',
        location: '.location, .offices',
        salary: '.salary-range, .compensation',
        applyButton: '#submit_app, .application-form button[type="submit"]'
      },
      lever: {
        title: '.posting-headline h2, .template-posting h2',
        company: '.posting-headline .company-name',
        description: '.section-wrapper .section:first-child',
        location: '.posting-categories .location',
        salary: '.posting-headline .salary, .compensation-range',
        applyButton: '.template-btn-submit, .postings-btn'
      }
    };

    this.init();
  }

  async init() {
    console.log('🚀 AutoJobr Smart Detector initialized');
    
    // Set up message listener first
    this.setupMessageListener();
    
    // Check authentication status and wait for it to complete
    const isAuth = await this.checkAuthentication();
    console.log('Auth status after init:', isAuth);
    
    // If authenticated, load user profile
    if (isAuth) {
      await this.loadUserProfile();
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Detect if current page is a job posting
      this.detectJobPage();
      
      // Set up observers for dynamic content
      this.setupObservers();
    }, 1000);
    
    // Listen for messages from popup/background
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep the message channel open for async responses
      });
    }
  }

  async checkAuthentication() {
    try {
      console.log('🔍 Checking AutoJobr authentication...');
      
      // First try direct API call
      try {
        const response = await fetch(`${this.apiBase}/api/user`, {
          credentials: 'include',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Auth response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          this.isAuthenticated = true;
          console.log('✅ AutoJobr authenticated successfully', userData.email);
          await this.loadUserProfile();
          return true;
        } else {
          this.isAuthenticated = false;
          console.log('❌ AutoJobr not authenticated, status:', response.status);
          return false;
        }
      } catch (fetchError) {
        console.log('Direct API call failed (likely CORS), trying background script...');
        
        // Fallback: try through background script if available
        if (chrome.runtime && chrome.runtime.sendMessage) {
          try {
            const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
            if (response && response.success && response.authenticated) {
              this.isAuthenticated = true;
              console.log('✅ Authentication confirmed via background script');
              // Load profile through background script
              const profileResponse = await chrome.runtime.sendMessage({ action: 'GET_PROFILE' });
              if (profileResponse && profileResponse.success) {
                this.userProfile = profileResponse.profile;
              }
              return true;
            }
          } catch (bgError) {
            console.log('Background script auth check also failed:', bgError);
          }
        }
        
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.log('❌ AutoJobr authentication check failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) {
      console.log('Not authenticated, skipping profile load');
      return false;
    }

    try {
      console.log('📋 Loading user profile data...');
      
      // First try to load from cache if it's recent
      try {
        if (chrome.storage && chrome.storage.local) {
          const cached = await chrome.storage.local.get('autojobr_profile');
          if (cached.autojobr_profile && cached.autojobr_profile.lastUpdated) {
            const cacheAge = Date.now() - cached.autojobr_profile.lastUpdated;
            if (cacheAge < 30 * 60 * 1000) { // 30 minutes
              this.userProfile = cached.autojobr_profile;
              console.log('📦 Using recent cached user profile');
              return true;
            }
          }
        }
      } catch (cacheError) {
        console.log('Cache check failed:', cacheError);
      }

      const [profileRes, skillsRes, experienceRes, educationRes] = await Promise.all([
        fetch(`${this.apiBase}/api/profile`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/skills`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/work-experience`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/education`, { credentials: 'include' })
      ]);

      console.log('Profile API responses:', {
        profile: profileRes.status,
        skills: skillsRes.status,
        experience: experienceRes.status,
        education: educationRes.status
      });

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
        try {
          if (chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({
              autojobr_profile: this.userProfile
            });
          }
        } catch (storageError) {
          console.log('Failed to cache profile:', storageError);
        }

        console.log('✅ User profile loaded successfully', {
          profileId: profile?.id,
          skillsCount: skills?.length || 0,
          experienceCount: experience?.length || 0,
          educationCount: education?.length || 0
        });
        return true;
      } else {
        console.log('Some profile API calls failed, trying cached data');
        // Try to load from cache
        try {
          if (chrome.storage && chrome.storage.local) {
            const cached = await chrome.storage.local.get('autojobr_profile');
            if (cached.autojobr_profile) {
              this.userProfile = cached.autojobr_profile;
              console.log('📦 Using cached user profile');
              return true;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached profile:', cacheError);
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Try to load from cache as fallback
      try {
        if (chrome.storage && chrome.storage.local) {
          const cached = await chrome.storage.local.get('autojobr_profile');
          if (cached.autojobr_profile) {
            this.userProfile = cached.autojobr_profile;
            console.log('📦 Using cached user profile as fallback');
            return true;
          }
        }
      } catch (cacheError) {
        console.error('Failed to load cached profile:', cacheError);
      }
      return false;
    }
  }

  async detectJobPage() {
    const hostname = window.location.hostname.toLowerCase();
    let platform = null;

    // Detect platform
    if (hostname.includes('linkedin.com')) platform = 'linkedin';
    else if (hostname.includes('indeed.com')) platform = 'indeed';
    else if (hostname.includes('workday.com')) platform = 'workday';
    else if (hostname.includes('greenhouse.io')) platform = 'greenhouse';
    else if (hostname.includes('lever.co')) platform = 'lever';
    else if (hostname.includes('glassdoor.com')) platform = 'glassdoor';
    else if (hostname.includes('monster.com')) platform = 'monster';
    else if (hostname.includes('ziprecruiter.com')) platform = 'ziprecruiter';
    else if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) platform = 'wellfound';

    console.log('🔍 Detected platform:', platform);

    if (platform && this.hasJobContent(platform)) {
      this.isJobPage = true;
      console.log('✅ Job page detected on', platform);
      
      // Re-check authentication status before showing panel
      await this.checkAuthentication();
      
      this.extractJobData(platform);
      
      // Always show panel, but behavior depends on auth status
      this.showFloatingPanel();
      
      // If authenticated, automatically analyze
      if (this.isAuthenticated && this.userProfile) {
        console.log('🔍 Auto-analyzing job with user profile...');
        this.analyzeJobMatch();
      }
    } else {
      console.log('❌ No job content detected');
    }
  }

  hasJobContent(platform) {
    const selectors = this.jobSelectors[platform];
    if (!selectors) return false;

    // Check if essential job elements exist
    const titleExists = document.querySelector(selectors.title);
    const companyExists = document.querySelector(selectors.company);
    
    return titleExists && companyExists;
  }

  extractJobData(platform) {
    const selectors = this.jobSelectors[platform] || {};
    
    const title = this.getTextFromSelector(selectors.title);
    const company = this.getTextFromSelector(selectors.company);
    const description = this.getTextFromSelector(selectors.description);
    const location = this.getTextFromSelector(selectors.location);
    const salary = this.getTextFromSelector(selectors.salary);

    this.jobData = {
      title: title?.trim(),
      company: company?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      salary: salary?.trim(),
      url: window.location.href,
      platform,
      extractedAt: Date.now()
    };

    // Automatically analyze the job if we have user profile
    if (this.userProfile && this.jobData.title && this.jobData.description) {
      this.analyzeJobMatch();
    }

    console.log('📋 Job data extracted:', this.jobData);
  }

  getTextFromSelector(selector) {
    if (!selector) return '';
    
    const element = document.querySelector(selector);
    return element ? element.textContent || element.innerText || '' : '';
  }

  async analyzeJobMatch() {
    // Check if we need to load user profile
    if (!this.userProfile && this.isAuthenticated) {
      console.log('Loading user profile for analysis...');
      const profileLoaded = await this.loadUserProfile();
      if (!profileLoaded) {
        this.showNotification('Please complete your profile to enable job analysis', 'warning');
        return;
      }
    }

    if (!this.userProfile || !this.jobData) {
      this.showNotification('Missing profile or job data for analysis', 'error');
      return;
    }

    try {
      this.showNotification('Analyzing job match...', 'info');
      
      // Enhanced NLP-style analysis
      const analysis = this.performEnhancedAnalysis();
      
      // Store analysis results
      this.jobData.analysis = analysis;
      
      // Update floating panel with results
      this.updateFloatingPanel();
      
      console.log('📊 Job analysis completed:', analysis);
      this.showNotification(`Analysis complete! ${analysis.matchScore}% match`, 'success');
    } catch (error) {
      console.error('Failed to analyze job:', error);
      this.showNotification('Analysis failed. Please try again.', 'error');
    }
  }

  performEnhancedAnalysis() {
    const { skills, experience, education, profile } = this.userProfile;
    const { title, description, company, location, salary } = this.jobData;
    
    if (!description || !title) {
      return { 
        matchScore: 0, 
        matchedSkills: [], 
        missingSkills: [],
        totalSkills: 0,
        experienceYears: 0,
        recommendation: 'Insufficient job data for analysis'
      };
    }

    const jobText = (title + ' ' + description + ' ' + (company || '')).toLowerCase();
    const userSkills = (skills || []).map(s => s.skill?.toLowerCase() || s.toLowerCase());
    
    // Enhanced skill matching with NLP-like features
    const skillAnalysis = this.performSkillMatching(jobText, userSkills);
    
    // Experience analysis
    const experienceAnalysis = this.performExperienceAnalysis(jobText, experience || []);
    
    // Education analysis
    const educationAnalysis = this.performEducationAnalysis(jobText, education || []);
    
    // Seniority level analysis
    const seniorityAnalysis = this.analyzeSeniorityMatch(jobText, experienceAnalysis.totalYears);
    
    // Calculate weighted score
    let totalScore = 0;
    totalScore += skillAnalysis.score * 0.5; // 50% weight for skills
    totalScore += experienceAnalysis.score * 0.3; // 30% weight for experience
    totalScore += educationAnalysis.score * 0.1; // 10% weight for education
    totalScore += seniorityAnalysis.score * 0.1; // 10% weight for seniority
    
    const matchScore = Math.min(Math.round(totalScore), 100);
    
    return {
      matchScore,
      matchedSkills: skillAnalysis.matched,
      missingSkills: skillAnalysis.missing,
      totalSkills: userSkills.length,
      experienceYears: Math.round(experienceAnalysis.totalYears),
      recommendation: this.generateRecommendation(matchScore, skillAnalysis, experienceAnalysis),
      details: {
        skillsScore: Math.round(skillAnalysis.score),
        experienceScore: Math.round(experienceAnalysis.score),
        educationScore: Math.round(educationAnalysis.score),
        seniorityScore: Math.round(seniorityAnalysis.score)
      }
    };
  }

  performSkillMatching(jobText, userSkills) {
    const matched = [];
    const missing = [];
    let score = 0;
    
    // Enhanced skill matching with synonyms and related terms
    const skillSynonyms = {
      'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
      'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
      'java': ['spring', 'hibernate', 'maven', 'gradle'],
      'sql': ['mysql', 'postgresql', 'database', 'rdbms'],
      'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
      'docker': ['containerization', 'kubernetes', 'k8s'],
      'git': ['version control', 'github', 'gitlab', 'bitbucket']
    };
    
    userSkills.forEach(skill => {
      let skillFound = false;
      
      // Direct match
      if (jobText.includes(skill)) {
        matched.push(skill);
        score += 15;
        skillFound = true;
      } else {
        // Check synonyms
        const synonyms = skillSynonyms[skill] || [];
        for (const synonym of synonyms) {
          if (jobText.includes(synonym)) {
            matched.push(skill);
            score += 10; // Slightly lower score for synonym match
            skillFound = true;
            break;
          }
        }
      }
      
      if (!skillFound) {
        missing.push(skill);
      }
    });
    
    // Extract required skills from job description
    const requiredSkillPatterns = [
      /required?\s*skills?:?\s*([^.]+)/gi,
      /must\s+have:?\s*([^.]+)/gi,
      /experience\s+with:?\s*([^.]+)/gi
    ];
    
    const requiredSkills = [];
    requiredSkillPatterns.forEach(pattern => {
      const matches = jobText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skills = match.split(/[,;]/).map(s => s.trim().toLowerCase());
          requiredSkills.push(...skills);
        });
      }
    });
    
    return { matched, missing, score, requiredSkills };
  }

  performExperienceAnalysis(jobText, experience) {
    const totalYears = experience.reduce((total, exp) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        return total + ((end - start) / (1000 * 60 * 60 * 24 * 365));
      }
      return total;
    }, 0);
    
    let score = 0;
    
    // Experience level scoring
    if (totalYears >= 10) score = 100;
    else if (totalYears >= 7) score = 90;
    else if (totalYears >= 5) score = 80;
    else if (totalYears >= 3) score = 70;
    else if (totalYears >= 2) score = 60;
    else if (totalYears >= 1) score = 50;
    else score = 30;
    
    // Check for relevant experience titles
    const relevantTitles = experience.filter(exp => {
      const title = (exp.title || '').toLowerCase();
      return jobText.includes(title) || 
             title.split(' ').some(word => jobText.includes(word));
    });
    
    if (relevantTitles.length > 0) {
      score += 20; // Bonus for relevant titles
    }
    
    return { totalYears, score, relevantExperience: relevantTitles.length };
  }

  performEducationAnalysis(jobText, education) {
    let score = 50; // Base score
    
    if (!education || education.length === 0) return { score: 30 };
    
    education.forEach(edu => {
      const degree = (edu.degree || '').toLowerCase();
      const field = (edu.fieldOfStudy || '').toLowerCase();
      
      // Check if degree is mentioned in job
      if (jobText.includes(degree) || jobText.includes(field)) {
        score += 20;
      }
      
      // Bonus for higher education
      if (degree.includes('master') || degree.includes('mba')) {
        score += 15;
      } else if (degree.includes('bachelor')) {
        score += 10;
      } else if (degree.includes('phd') || degree.includes('doctorate')) {
        score += 25;
      }
    });
    
    return { score: Math.min(score, 100) };
  }

  analyzeSeniorityMatch(jobText, experienceYears) {
    let requiredSeniority = 'mid'; // default
    let score = 50;
    
    // Detect seniority level from job text
    if (jobText.includes('senior') || jobText.includes('lead') || jobText.includes('principal')) {
      requiredSeniority = 'senior';
    } else if (jobText.includes('junior') || jobText.includes('entry') || jobText.includes('graduate')) {
      requiredSeniority = 'junior';
    } else if (jobText.includes('director') || jobText.includes('manager') || jobText.includes('head of')) {
      requiredSeniority = 'executive';
    }
    
    // Match user experience to required seniority
    const userSeniority = experienceYears >= 8 ? 'senior' : 
                         experienceYears >= 3 ? 'mid' : 'junior';
    
    if (userSeniority === requiredSeniority) {
      score = 100;
    } else if (
      (userSeniority === 'senior' && requiredSeniority === 'mid') ||
      (userSeniority === 'mid' && requiredSeniority === 'junior')
    ) {
      score = 80; // Overqualified but good match
    } else {
      score = 40; // Underqualified or mismatched
    }
    
    return { score, requiredSeniority, userSeniority };
  }

  generateRecommendation(matchScore, skillAnalysis, experienceAnalysis) {
    if (matchScore >= 85) {
      return 'Excellent match! You should definitely apply.';
    } else if (matchScore >= 70) {
      return 'Strong match! This could be a great opportunity.';
    } else if (matchScore >= 55) {
      return 'Good match. Consider applying if interested.';
    } else if (matchScore >= 40) {
      return 'Fair match. You may want to improve some skills first.';
    } else {
      return 'Low match. Consider developing more relevant skills.';
    }
  }

  showFloatingPanel() {
    if (this.floatingPanel) return; // Already shown

    try {
      // Create floating panel
      this.floatingPanel = document.createElement('div');
      this.floatingPanel.className = 'autojobr-floating-panel';
      
      // Add basic styling for the panel
      this.floatingPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
      `;
      
      this.floatingPanel.innerHTML = this.getFloatingPanelHTML();
      
      // Add to page
      document.body.appendChild(this.floatingPanel);
      
      // Add event listeners
      this.setupFloatingPanelEvents();
      
      console.log('💫 AutoJobr floating panel displayed');
    } catch (error) {
      console.error('Failed to show floating panel:', error);
    }
  }

  getFloatingPanelHTML() {
    const isAuthenticated = this.isAuthenticated;
    const jobData = this.jobData || {};
    const analysis = jobData.analysis;

    // Get icon URL safely
    let iconUrl = '';
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        iconUrl = chrome.runtime.getURL('icons/icon32.png');
      }
    } catch (e) {
      console.log('Chrome runtime not available for icon');
    }

    if (!isAuthenticated) {
      return `
        <div class="autojobr-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #4f46e5; color: white;">
          <div class="autojobr-logo" style="display: flex; align-items: center; gap: 8px;">
            ${iconUrl ? `<img src="${iconUrl}" alt="AutoJobr" style="width: 24px; height: 24px;">` : '🤖'}
            <span style="font-weight: bold;">AutoJobr Assistant</span>
          </div>
          <button class="autojobr-close" id="autojobr-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        </div>
        <div class="autojobr-content" style="padding: 16px; background: white; border-radius: 0 0 8px 8px;">
          <div class="autojobr-auth-required" style="text-align: center;">
            <div style="background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;">
              ⚠️ Please Sign In
            </div>
            <h3 style="margin: 0 0 8px 0; color: #374151;">Enhanced AI-powered job analysis</h3>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">✨ AI Job Analysis<br>⚡ Smart Auto-fill<br>📝 Generate Cover Letter</p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="autojobr-btn-primary" id="autojobr-login" style="background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">Sign In to AutoJobr</button>
            </div>
          </div>
        </div>
      `;
    }

    const matchScore = analysis?.matchScore || 0;
    const scoreColor = matchScore >= 80 ? '#22c55e' : matchScore >= 60 ? '#f59e0b' : '#ef4444';

    return `
      <div class="autojobr-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #4f46e5; color: white;">
        <div class="autojobr-logo" style="display: flex; align-items: center; gap: 8px;">
          ${iconUrl ? `<img src="${iconUrl}" alt="AutoJobr" style="width: 24px; height: 24px;">` : '🤖'}
          <span style="font-weight: bold;">AutoJobr</span>
        </div>
        <button class="autojobr-close" id="autojobr-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
      <div class="autojobr-content" style="padding: 16px; background: white; border-radius: 0 0 8px 8px;">
        ${analysis ? `
          <div class="autojobr-analysis" style="margin-bottom: 16px;">
            <div class="autojobr-score" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; border: 2px solid ${scoreColor}; border-radius: 6px;">
              <div class="score-circle" style="width: 48px; height: 48px; background: ${scoreColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                ${matchScore}%
              </div>
              <div class="score-details">
                <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">Job Match Score</h4>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">${analysis.recommendation || 'Analysis complete'}</p>
              </div>
            </div>
            <div class="autojobr-matches" style="text-align: center; margin-bottom: 16px;">
              <p style="margin: 0; color: #374151; font-size: 13px;"><strong>${analysis.matchedSkills?.length || 0}</strong> of your skills match this job</p>
            </div>
          </div>
        ` : `
          <div class="autojobr-analyzing" style="text-align: center; margin-bottom: 16px; padding: 20px;">
            <div class="spinner" style="width: 24px; height: 24px; border: 2px solid #e5e7eb; border-top: 2px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Analyzing job requirements...</p>
          </div>
        `}
        
        <div class="autojobr-actions" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <button class="autojobr-btn-primary" id="autojobr-autofill" style="background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            ⚡ Autofill Application
          </button>
          <button class="autojobr-btn-secondary" id="autojobr-cover-letter" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            📝 Generate Cover Letter
          </button>
          <button class="autojobr-btn-secondary" id="autojobr-save-job" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            💾 Save Job
          </button>
        </div>
        
        <div class="autojobr-info" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;"><strong>${jobData.title || 'Job Position'}</strong> at <strong>${jobData.company || 'Company'}</strong></p>
          ${this.userProfile ? `
            <div style="display: flex; justify-content: center; align-items: center; gap: 4px; color: #10b981; font-size: 11px;">
              <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
              Profile loaded (${this.userProfile.skills?.length || 0} skills)
            </div>
          ` : `
            <div style="display: flex; justify-content: center; align-items: center; gap: 4px; color: #f59e0b; font-size: 11px;">
              <span style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; display: inline-block;"></span>
              Loading profile...
            </div>
          `}
        </div>
      </div>
    `;
  }

  setupFloatingPanelEvents() {
    // Close button
    document.getElementById('autojobr-close')?.addEventListener('click', () => {
      this.hideFloatingPanel();
    });

    // Login button
    document.getElementById('autojobr-login')?.addEventListener('click', () => {
      window.open(`${this.apiBase}/auth`, '_blank');
    });

    // Autofill button
    document.getElementById('autojobr-autofill')?.addEventListener('click', () => {
      this.performAutofill();
    });

    // Cover letter button
    document.getElementById('autojobr-cover-letter')?.addEventListener('click', () => {
      this.generateCoverLetter();
    });

    // Save job button
    document.getElementById('autojobr-save-job')?.addEventListener('click', () => {
      this.saveJob();
    });
  }

  updateFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.innerHTML = this.getFloatingPanelHTML();
      this.setupFloatingPanelEvents();
    }
  }

  getFloatingPanelHTML() {
    let analysisSection = '';
    if (this.jobData?.analysis) {
      const analysis = this.jobData.analysis;
      const scoreColor = analysis.matchScore >= 80 ? '#10b981' : 
                        analysis.matchScore >= 60 ? '#f59e0b' : '#ef4444';
      
      const details = analysis.details || {};
      analysisSection = `
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid ${scoreColor};">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: ${scoreColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">
              ${analysis.matchScore}%
            </div>
            <div>
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">AI Job Match Analysis</div>
              <div style="font-size: 12px; color: #6b7280;">${analysis.recommendation}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 12px;">
            <div style="text-align: center; padding: 8px; background: white; border-radius: 4px;">
              <div style="font-weight: bold; color: #1f2937;">${analysis.matchedSkills?.length || 0}/${analysis.totalSkills || 0}</div>
              <div style="color: #6b7280;">Skills Match</div>
            </div>
            <div style="text-align: center; padding: 8px; background: white; border-radius: 4px;">
              <div style="font-weight: bold; color: #1f2937;">${analysis.experienceYears || 0}y</div>
              <div style="color: #6b7280;">Experience</div>
            </div>
          </div>

          ${details.skillsScore ? `
            <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
              <div style="margin-bottom: 4px;">
                <span style="color: #1f2937; font-weight: 500;">Skills:</span> ${details.skillsScore}% • 
                <span style="color: #1f2937; font-weight: 500;">Experience:</span> ${details.experienceScore}% • 
                <span style="color: #1f2937; font-weight: 500;">Education:</span> ${details.educationScore}%
              </div>
              ${analysis.matchedSkills?.length > 0 ? `
                <div style="margin-top: 8px;">
                  <span style="color: #10b981; font-weight: 500;">✓ Matched:</span> ${analysis.matchedSkills.slice(0, 3).join(', ')}${analysis.matchedSkills.length > 3 ? '...' : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div style="position: fixed; top: 20px; right: 20px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">AutoJobr Assistant</h3>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Enhanced AI-powered job analysis</p>
        </div>
        
        <div style="padding: 16px;">
          ${this.isAuthenticated ? 
            `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #10b981; font-size: 14px; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
              Connected & Ready
            </div>` :
            `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #ef4444; font-size: 14px; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
              Please Sign In
            </div>`
          }

          ${analysisSection}

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="autojobr-btn autojobr-btn-primary" id="autojobr-analyze" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
              <span>🧠</span> AI Job Analysis
            </button>
            
            <button class="autojobr-btn autojobr-btn-primary" id="autojobr-autofill" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
              <span>⚡</span> Smart Auto-fill
            </button>
            
            <button class="autojobr-btn autojobr-btn-secondary" id="autojobr-cover-letter" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #f8fafc; color: #374151; border: 1px solid #e5e7eb; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
              <span>📝</span> Generate Cover Letter
            </button>
          </div>
          
          <button id="autojobr-close" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 1;">×</button>
        </div>
      </div>
    `;
  }

  hideFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
      this.floatingPanel = null;
    }
  }

  async performAutofill() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to use autofill', 'error');
      return;
    }

    if (!this.userProfile) {
      console.error('No user profile available for autofill');
      this.showNotification('User profile not loaded', 'error');
      // Try to reload profile
      await this.loadUserProfile();
      if (!this.userProfile) {
        this.showNotification('Unable to load user profile', 'error');
        return;
      }
    }

    console.log('🚀 Starting autofill process...');
    
    try {
      // Load and execute form filler
      if (typeof FormFiller !== 'undefined') {
        const formFiller = new FormFiller(this.userProfile);
        await formFiller.fillJobApplicationForm();
        this.showNotification('Form filled successfully!', 'success');
      } else {
        console.error('FormFiller class not available');
        this.showNotification('Autofill feature loading...', 'info');
      }
    } catch (error) {
      console.error('Autofill failed:', error);
      this.showNotification('Autofill failed', 'error');
    }
  }

  async generateCoverLetter() {
    if (!this.jobData) {
      console.error('Missing job data for cover letter generation');
      this.showNotification('No job data available', 'error');
      return;
    }

    if (!this.isAuthenticated) {
      console.error('User not authenticated for cover letter generation');
      this.showNotification('Please sign in to generate cover letter', 'error');
      return;
    }

    if (!this.userProfile) {
      console.error('Missing user profile for cover letter generation');
      this.showNotification('Loading your profile...', 'info');
      
      // Try to reload the profile
      await this.loadUserProfile();
      
      if (!this.userProfile) {
        this.showNotification('Unable to load profile. Please try refreshing the page.', 'error');
        return;
      }
    }

    if (!this.jobData.description || !this.jobData.company) {
      console.error('Job data incomplete for cover letter generation');
      this.showNotification('Job information incomplete', 'error');
      return;
    }

    try {
      console.log('📝 Generating cover letter...');
      this.showNotification('Generating cover letter...', 'info');
      
      const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription: this.jobData.description || '',
          companyName: this.jobData.company || 'Company',
          jobTitle: this.jobData.title || 'Position',
          useProfile: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Try to fill cover letter in any text area
        const textAreas = document.querySelectorAll('textarea');
        const coverLetterField = Array.from(textAreas).find(ta => 
          ta.placeholder?.toLowerCase().includes('cover') ||
          ta.name?.toLowerCase().includes('cover') ||
          ta.id?.toLowerCase().includes('cover') ||
          ta.closest('label')?.textContent?.toLowerCase().includes('cover')
        );

        if (coverLetterField) {
          coverLetterField.value = result.coverLetter;
          coverLetterField.dispatchEvent(new Event('input', { bubbles: true }));
          this.showNotification('Cover letter generated and inserted!', 'success');
        } else {
          // Copy to clipboard as fallback
          try {
            await navigator.clipboard.writeText(result.coverLetter);
            this.showNotification('Cover letter copied to clipboard!', 'success');
          } catch (clipboardError) {
            console.error('Failed to copy to clipboard:', clipboardError);
            this.showNotification('Cover letter generated but could not copy to clipboard', 'warning');
          }
        }
      } else {
        this.showNotification('Failed to generate cover letter', 'error');
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      this.showNotification('Failed to generate cover letter', 'error');
    }
  }

  async saveJob() {
    if (!this.jobData) return;

    try {
      console.log('💾 Saving job...');
      
      const response = await fetch(`${this.apiBase}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...this.jobData,
          savedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        this.showNotification('Job saved successfully!', 'success');
      } else {
        this.showNotification('Failed to save job', 'error');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      this.showNotification('Failed to save job', 'error');
    }
  }

  showNotification(message, type = 'info') {
    try {
      const notification = document.createElement('div');
      notification.className = `autojobr-notification autojobr-notification-${type}`;
      notification.textContent = message;
      
      // Add basic styling
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        z-index: 10001;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(350px);
        transition: transform 0.3s ease;
        animation: slideIn 0.3s ease forwards;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  setupObservers() {
    // Watch for URL changes (for SPAs)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Hide existing panel
        this.hideFloatingPanel();
        
        // Re-detect job page after a short delay
        setTimeout(async () => {
          await this.detectJobPage();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(async () => {
        this.hideFloatingPanel();
        await this.detectJobPage();
      }, 500);
    });
    
    // Check for authentication changes periodically
    setInterval(async () => {
      const wasAuthenticated = this.isAuthenticated;
      await this.checkAuthentication();
      
      // If authentication status changed, update the panel
      if (wasAuthenticated !== this.isAuthenticated && this.isJobPage) {
        this.updateFloatingPanel();
      }
    }, 30000); // Check every 30 seconds
  }

  handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'GET_JOB_DATA':
          sendResponse({
            success: true,
            isJobPage: this.isJobPage,
            jobData: this.jobData,
            isAuthenticated: this.isAuthenticated,
            userProfile: this.userProfile ? true : false
          });
          break;
          
        case 'REFRESH_AUTH':
          this.checkAuthentication().then(() => {
            sendResponse({ 
              success: true, 
              isAuthenticated: this.isAuthenticated,
              userProfile: this.userProfile ? true : false
            });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Async response
          
        case 'PERFORM_AUTOFILL':
          this.performAutofill().then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Async response
          
        case 'GENERATE_COVER_LETTER':
          this.generateCoverLetter().then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Async response

        case 'ANALYZE_JOB':
          this.analyzeJobMatch().then(() => {
            sendResponse({ 
              success: true, 
              analysis: this.jobData?.analysis || null 
            });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Async response
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open for async responses
  }

  setupMessageListener() {
    // Set up message listener for popup communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
    });
  }
}

// Add CSS animations for notifications and spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    0% { transform: translateX(350px); }
    100% { transform: translateX(0); }
  }
  .autojobr-notification {
    transition: all 0.3s ease;
  }
  .autojobr-floating-panel button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .autojobr-btn-primary:hover {
    background: #4338ca !important;
  }
  .autojobr-btn-secondary:hover {
    background: #e5e7eb !important;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      new SmartJobDetector();
    } catch (error) {
      console.error('AutoJobr SmartJobDetector initialization failed:', error);
    }
  });
} else {
  try {
    new SmartJobDetector();
  } catch (error) {
    console.error('AutoJobr SmartJobDetector initialization failed:', error);
  }
}