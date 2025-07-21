// Auto Job Analyzer - Enhanced content script for automatic job analysis
// Automatically extracts job description and shows results without button clicks

(function() {
  'use strict';
  
  let jobAnalysisOverlay = null;
  let currentJobData = null;
  let userProfile = null;
  let isAnalyzing = false;

  // Job board specific selectors
  const JOB_BOARD_SELECTORS = {
    linkedin: {
      title: '.jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title h1, .jobs-search__job-title--is-external',
      company: '.jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name a',
      description: '.jobs-description-content__text, .jobs-box__html-content, .job-view-layout .jobs-description__content',
      location: '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__primary-description-without-tagline'
    },
    indeed: {
      title: '.jobsearch-JobInfoHeader-title span, h1.jobsearch-JobInfoHeader-title',
      company: '.jobsearch-InlineCompanyRating a, .jobsearch-CompanyInfoWithoutHeaderImage a',
      description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
      location: '.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)'
    },
    glassdoor: {
      title: '.jobTitle, .job-title',
      company: '.employerName, .employer-name',
      description: '.jobDescriptionContent, .job-description-content, #JobDescContainer',
      location: '.jobLocation, .job-location'
    },
    workday: {
      title: '[data-automation-id="jobPostingHeader"] h1, .job-title',
      company: '.company-logo img[alt], .company-name',
      description: '[data-automation-id="jobPostingDescription"], .job-description',
      location: '[data-automation-id="locations"], .location'
    },
    lever: {
      title: '.posting-headline h2, .job-title',
      company: '.main-header-text a, .company-name',
      description: '.posting-description, .job-description',
      location: '.posting-categories .location, .job-location'
    },
    greenhouse: {
      title: '.app-title, .job-post-title',
      company: '.company-name, .header-company-name',
      description: '.job-post-content, .content',
      location: '.location, .job-location'
    },
    ashby: {
      title: '[data-testid="job-posting-title"], .job-title',
      company: '.company-name',
      description: '[data-testid="job-posting-description"], .job-description',
      location: '[data-testid="job-posting-location"], .location'
    },
    bamboohr: {
      title: '.BambooHR-ATS-Title, .job-title',
      company: '.BambooHR-ATS-CompanyName, .company',
      description: '.BambooHR-ATS-Description, .description',
      location: '.BambooHR-ATS-Location, .location'
    },
    naukri: {
      title: '.jd-job-title, h1.job-title',
      company: '.jd-header-comp-name, .company-name',
      description: '.dang-inner-html, .job-description',
      location: '.jd-job-loc, .job-location'
    },
    monster: {
      title: '.JobViewTitle, .job-title',
      company: '.JobViewCompany, .company-name', 
      description: '.JobViewDescription, .job-description',
      location: '.JobViewLocation, .location'
    }
  };

  // Initialize immediately and more aggressively  
  initializeAutoAnalyzer();
  
  // Also try on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoAnalyzer);
  } else {
    setTimeout(initializeAutoAnalyzer, 500);
  }

  function initializeAutoAnalyzer() {
    console.log('AutoJobr: Initializing auto job analyzer');
    
    // Load user profile
    loadUserProfile();
    
    // Set up observers for dynamic content
    setupDynamicObservers();
    
    // Try immediate analysis
    analyzeCurrentPage();
    
    // Also try again after page fully loads
    setTimeout(analyzeCurrentPage, 1000);
    setTimeout(analyzeCurrentPage, 3000);
  }

  async function loadUserProfile() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'getUserProfile' 
      });
      
      if (response && response.success) {
        userProfile = response.data;
        console.log('AutoJobr: User profile loaded');
      }
    } catch (error) {
      console.log('AutoJobr: Could not load user profile:', error);
    }
  }

  function setupDynamicObservers() {
    // Observer for URL changes (single page apps)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(analyzeCurrentPage, 2000);
      }
    }).observe(document, { subtree: true, childList: true });

    // Observer for content changes
    const observer = new MutationObserver((mutations) => {
      let shouldAnalyze = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (
              node.matches && (
                node.matches('[class*="job"]') ||
                node.matches('[class*="posting"]') ||
                node.matches('[class*="description"]')
              )
            )) {
              shouldAnalyze = true;
              break;
            }
          }
        }
      }
      
      if (shouldAnalyze && !isAnalyzing) {
        setTimeout(analyzeCurrentPage, 1500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  function detectJobBoard() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('indeed')) return 'indeed';
    if (hostname.includes('glassdoor')) return 'glassdoor';
    if (hostname.includes('myworkday') || hostname.includes('workday')) return 'workday';
    if (hostname.includes('lever.co')) return 'lever';
    if (hostname.includes('greenhouse')) return 'greenhouse';
    if (hostname.includes('ashbyhq') || hostname.includes('ashby')) return 'ashby';
    if (hostname.includes('bamboohr')) return 'bamboohr';
    if (hostname.includes('naukri')) return 'naukri';
    if (hostname.includes('monster')) return 'monster';
    
    return 'generic';
  }

  function extractJobData() {
    const jobBoard = detectJobBoard();
    const selectors = JOB_BOARD_SELECTORS[jobBoard] || {};
    
    console.log(`AutoJobr: Extracting job data from ${jobBoard}`);

    let title = '';
    let company = '';
    let description = '';
    let location = '';

    // Extract title
    if (selectors.title) {
      const titleElements = selectors.title.split(', ');
      for (const selector of titleElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          title = element.textContent.trim();
          break;
        }
      }
    }

    // Fallback title extraction
    if (!title) {
      const fallbackTitleSelectors = [
        'h1[class*="job"][class*="title"]',
        'h1[class*="title"]',
        '.job-title h1',
        '[data-testid*="title"] h1',
        'h1'
      ];
      
      for (const selector of fallbackTitleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim() && element.textContent.length < 200) {
          title = element.textContent.trim();
          break;
        }
      }
    }

    // Extract company
    if (selectors.company) {
      const companyElements = selectors.company.split(', ');
      for (const selector of companyElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          company = element.textContent.trim();
          break;
        }
      }
    }

    // Extract description
    if (selectors.description) {
      const descElements = selectors.description.split(', ');
      for (const selector of descElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          description = element.textContent.trim();
          break;
        }
      }
    }

    // Fallback description extraction
    if (!description) {
      const fallbackDescSelectors = [
        '[class*="job"][class*="description"]',
        '[class*="description"][class*="content"]',
        '.job-description',
        '.description',
        '[id*="description"]'
      ];
      
      for (const selector of fallbackDescSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim() && element.textContent.length > 100) {
          description = element.textContent.trim();
          break;
        }
      }
    }

    // Extract location
    if (selectors.location) {
      const locationElements = selectors.location.split(', ');
      for (const selector of locationElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          location = element.textContent.trim();
          break;
        }
      }
    }

    const jobData = {
      title: title || 'Job Title Not Found',
      company: company || 'Company Not Found',
      description: description || 'Job description not available',
      location: location || 'Location Not Specified',
      url: window.location.href,
      platform: jobBoard
    };

    console.log('AutoJobr: Extracted job data:', jobData);
    return jobData;
  }

  async function analyzeCurrentPage() {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    console.log('AutoJobr: Starting automatic job analysis');

    try {
      const jobData = extractJobData();
      
      // Only analyze if we found meaningful job data
      if (jobData.description && jobData.description.length > 50 && 
          jobData.title !== 'Job Title Not Found') {
        
        currentJobData = jobData;
        
        console.log('AutoJobr: Job detected, creating analysis overlay...');
        
        // Load user profile if not available
        if (!userProfile) {
          await loadUserProfile();
        }
        
        // Perform local NLP analysis (works with or without user profile)
        const analysis = performLocalNLPAnalysis(jobData);
        
        // Show results automatically
        showJobAnalysisOverlay(analysis);
        
        console.log('AutoJobr: Analysis overlay displayed with', analysis.matchScore + '% match');
        
        // Also send to background for storage
        try {
          chrome.runtime.sendMessage({
            action: 'storeJobAnalysis',
            data: { jobData, analysis }
          });
        } catch (error) {
          console.log('AutoJobr: Could not store analysis:', error);
        }
      } else {
        console.log('AutoJobr: No valid job content found, skipping analysis');
      }
    } catch (error) {
      console.log('AutoJobr: Analysis error:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  function performLocalNLPAnalysis(jobData) {
    const description = jobData.description.toLowerCase();
    const userSkills = userProfile?.skills?.map(s => s.skillName?.toLowerCase() || s.toLowerCase()) || 
                      userProfile?.technicalSkills?.map(s => s.toLowerCase()) || 
                      ['javascript', 'react', 'node.js', 'python']; // fallback skills
    
    // Extract skills from job description
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 
      'nodejs', 'express', 'mysql', 'postgresql', 'mongodb', 'aws', 'azure', 
      'docker', 'kubernetes', 'git', 'html', 'css', 'php', 'ruby', 'go'
    ];
    
    const jobSkills = technicalSkills.filter(skill => 
      description.includes(skill) || description.includes(skill.replace('js', ''))
    );
    
    // Calculate match score
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    
    const matchScore = jobSkills.length > 0 ? 
      Math.round((matchingSkills.length / jobSkills.length) * 100) : 50;
    
    // Determine experience level
    let experienceLevel = 'Mid Level';
    if (description.includes('senior') || description.includes('lead')) {
      experienceLevel = 'Senior Level';
    } else if (description.includes('junior') || description.includes('entry')) {
      experienceLevel = 'Entry Level';
    }
    
    // Extract salary info
    const salaryMatch = description.match(/\$(\d{2,3}),?(\d{3})\s*-\s*\$(\d{2,3}),?(\d{3})|(\d{2,3})k?\s*-\s*(\d{2,3})k/i);
    let salaryRange = 'Not specified';
    if (salaryMatch) {
      salaryRange = salaryMatch[0];
    }

    return {
      matchScore,
      matchingSkills,
      missingSkills: jobSkills.filter(skill => !matchingSkills.includes(skill)),
      experienceLevel,
      salaryRange,
      jobSkills,
      recommendation: matchScore >= 70 ? 'Strongly Recommended' : 
                     matchScore >= 50 ? 'Recommended' : 'Consider with preparation'
    };
  }

  function showJobAnalysisOverlay(analysis) {
    // Remove existing overlay
    if (jobAnalysisOverlay) {
      jobAnalysisOverlay.remove();
    }

    // Create overlay similar to Simplify
    jobAnalysisOverlay = document.createElement('div');
    jobAnalysisOverlay.id = 'autojobr-analysis-overlay';
    jobAnalysisOverlay.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        width: 350px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 20px; 
        border-radius: 12px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
        z-index: 10000; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        animation: slideIn 0.5s ease-out;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 20px;">⚡</div>
            <strong style="font-size: 16px;">AutoJobr Analysis</strong>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: rgba(255,255,255,0.2); 
            border: none; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 12px;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 500;">Match Score</span>
            <span style="
              background: ${analysis.matchScore >= 70 ? '#10b981' : analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'}; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-weight: bold;
              font-size: 13px;
            ">${analysis.matchScore}%</span>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; margin-bottom: 6px;">Matching Skills (${analysis.matchingSkills.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${analysis.matchingSkills.slice(0, 6).map(skill => `
              <span style="
                background: rgba(16, 185, 129, 0.2); 
                padding: 3px 8px; 
                border-radius: 4px; 
                font-size: 12px;
                border: 1px solid rgba(16, 185, 129, 0.3);
              ">${skill}</span>
            `).join('')}
          </div>
        </div>

        ${analysis.missingSkills.length > 0 ? `
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; margin-bottom: 6px;">Skills to Develop (${analysis.missingSkills.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${analysis.missingSkills.slice(0, 4).map(skill => `
              <span style="
                background: rgba(239, 68, 68, 0.2); 
                padding: 3px 8px; 
                border-radius: 4px; 
                font-size: 12px;
                border: 1px solid rgba(239, 68, 68, 0.3);
              ">${skill}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 13px;">
          <div>
            <div style="opacity: 0.8;">Experience Level</div>
            <div style="font-weight: 500;">${analysis.experienceLevel}</div>
          </div>
          <div>
            <div style="opacity: 0.8;">Salary Range</div>
            <div style="font-weight: 500;">${analysis.salaryRange}</div>
          </div>
        </div>

        <div style="
          background: rgba(255,255,255,0.1); 
          padding: 12px; 
          border-radius: 8px; 
          text-align: center;
          border: 1px solid rgba(255,255,255,0.2);
        ">
          <div style="font-weight: 500; margin-bottom: 4px;">Recommendation</div>
          <div style="font-size: 13px;">${analysis.recommendation}</div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button onclick="window.autoJobrFillForm()" style="
            flex: 1;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
          ">Auto-Fill Form</button>
          <button onclick="window.autoJobrGenerateCover()" style="
            flex: 1;
            background: rgba(255,255,255,0.9);
            border: none;
            color: #333;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
          ">Generate Cover Letter</button>
        </div>
      </div>

      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(jobAnalysisOverlay);

    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (jobAnalysisOverlay) {
        jobAnalysisOverlay.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => jobAnalysisOverlay?.remove(), 500);
      }
    }, 30000);
  }

  // Global functions for overlay buttons
  window.autoJobrFillForm = async function() {
    if (!userProfile || !currentJobData) return;
    
    console.log('AutoJobr: Triggering auto-fill...');
    
    // Use the enhanced content script's auto-fill functionality
    if (window.enhancedFormFiller) {
      window.enhancedFormFiller.fillAllFields(userProfile);
    }
    
    // Also send message to background
    chrome.runtime.sendMessage({
      action: 'triggerAutoFill',
      data: { userProfile, jobData: currentJobData }
    });
  };

  window.autoJobrGenerateCover = async function() {
    if (!userProfile || !currentJobData) return;
    
    console.log('AutoJobr: Generating cover letter...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        data: { 
          jobData: currentJobData,
          userProfile 
        }
      });
      
      if (response && response.success) {
        // Fill cover letter in any available text area
        const coverLetterFields = document.querySelectorAll('textarea[name*="cover"], textarea[placeholder*="cover" i], textarea[name*="letter"]');
        if (coverLetterFields.length > 0) {
          coverLetterFields[0].value = response.coverLetter;
          coverLetterFields[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
    }
  };

  // Function to hide overlay
  function hideJobAnalysisOverlay() {
    if (jobAnalysisOverlay) {
      jobAnalysisOverlay.remove();
      jobAnalysisOverlay = null;
    }
  }

  window.autoJobrGenerateCover = async function() {
    if (!userProfile || !currentJobData) return;
    
    // Use existing Groq service for cover letter generation
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        data: { 
          jobData: currentJobData,
          userProfile: userProfile
        }
      });
      
      if (response && response.success) {
        // Fill the cover letter on page
        chrome.runtime.sendMessage({
          action: 'fillCoverLetter',
          data: { coverLetter: response.coverLetter }
        });
      }
    } catch (error) {
      console.log('AutoJobr: Cover letter generation failed:', error);
    }
  };

  console.log('AutoJobr: Auto job analyzer loaded successfully');
})();