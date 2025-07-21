// Enhanced Content Script for AutoJobr Chrome Extension
// Handles job board form filling, job data extraction, and application tracking

console.log('AutoJobr Enhanced Content Script loaded on:', window.location.hostname);

// Enhanced form field mappings for comprehensive job board support
const FIELD_MAPPINGS = {
  // Personal Information
  firstName: [
    'first-name', 'firstname', 'fname', 'given-name', 'forename',
    'input[name*="first"]', 'input[placeholder*="first name" i]',
    '[data-automation-id*="first"]', '[data-testid*="first"]'
  ],
  lastName: [
    'last-name', 'lastname', 'lname', 'family-name', 'surname',
    'input[name*="last"]', 'input[placeholder*="last name" i]',
    '[data-automation-id*="last"]', '[data-testid*="last"]'
  ],
  email: [
    'email', 'email-address', 'emailaddress', 'e-mail',
    'input[type="email"]', 'input[name*="email"]',
    '[data-automation-id*="email"]', '[data-testid*="email"]'
  ],
  phone: [
    'phone', 'telephone', 'mobile', 'cell', 'phone-number',
    'input[type="tel"]', 'input[name*="phone"]',
    '[data-automation-id*="phone"]', '[data-testid*="phone"]'
  ],
  
  // Location
  address: [
    'address', 'street-address', 'current-address', 'home-address',
    'input[name*="address"]', 'textarea[name*="address"]',
    '[data-automation-id*="address"]', '[data-testid*="address"]'
  ],
  city: [
    'city', 'locality', 'town', 'input[name*="city"]',
    '[data-automation-id*="city"]', '[data-testid*="city"]'
  ],
  state: [
    'state', 'province', 'region', 'input[name*="state"]',
    'select[name*="state"]', '[data-automation-id*="state"]'
  ],
  zipCode: [
    'zip', 'zipcode', 'postal-code', 'postcode',
    'input[name*="zip"]', 'input[name*="postal"]',
    '[data-automation-id*="zip"]', '[data-testid*="zip"]'
  ],
  country: [
    'country', 'nationality', 'select[name*="country"]',
    '[data-automation-id*="country"]', '[data-testid*="country"]'
  ],
  
  // Professional Information
  resume: [
    'resume', 'cv', 'curriculum-vitae', 'input[type="file"]',
    'input[name*="resume"]', 'input[name*="cv"]',
    '[data-automation-id*="resume"]', '[data-testid*="resume"]'
  ],
  coverLetter: [
    'cover-letter', 'coverletter', 'motivation-letter',
    'textarea[name*="cover"]', 'textarea[name*="letter"]',
    '[data-automation-id*="cover"]', '[data-testid*="cover"]'
  ],
  linkedinUrl: [
    'linkedin', 'linkedin-url', 'linkedin-profile',
    'input[name*="linkedin"]', 'input[placeholder*="linkedin" i]',
    '[data-automation-id*="linkedin"]', '[data-testid*="linkedin"]'
  ],
  githubUrl: [
    'github', 'github-url', 'github-profile',
    'input[name*="github"]', 'input[placeholder*="github" i]',
    '[data-automation-id*="github"]', '[data-testid*="github"]'
  ],
  portfolioUrl: [
    'portfolio', 'website', 'personal-website', 'portfolio-url',
    'input[name*="portfolio"]', 'input[name*="website"]',
    '[data-automation-id*="portfolio"]', '[data-testid*="portfolio"]'
  ],
  
  // Experience & Salary
  yearsExperience: [
    'experience', 'years-experience', 'total-experience',
    'select[name*="experience"]', 'input[name*="experience"]',
    '[data-automation-id*="experience"]', '[data-testid*="experience"]'
  ],
  salaryExpectation: [
    'salary', 'expected-salary', 'salary-expectation', 'compensation',
    'input[name*="salary"]', 'input[name*="compensation"]',
    '[data-automation-id*="salary"]', '[data-testid*="salary"]'
  ],
  
  // Work Authorization
  workAuthorization: [
    'work-authorization', 'visa-status', 'authorization',
    'select[name*="authorization"]', 'select[name*="visa"]',
    '[data-automation-id*="authorization"]', '[data-testid*="authorization"]'
  ],
  requiresSponsorship: [
    'sponsorship', 'visa-sponsorship', 'requires-sponsorship',
    'input[name*="sponsor"]', 'input[type="checkbox"][name*="sponsor"]',
    '[data-automation-id*="sponsor"]', '[data-testid*="sponsor"]'
  ],
  
  // Education
  university: [
    'university', 'college', 'school', 'institution', 'education',
    'input[name*="university"]', 'input[name*="college"]',
    '[data-automation-id*="university"]', '[data-testid*="university"]'
  ],
  degree: [
    'degree', 'education-level', 'qualification',
    'select[name*="degree"]', 'input[name*="degree"]',
    '[data-automation-id*="degree"]', '[data-testid*="degree"]'
  ],
  major: [
    'major', 'field-of-study', 'study-field', 'specialization',
    'input[name*="major"]', 'input[name*="field"]',
    '[data-automation-id*="major"]', '[data-testid*="major"]'
  ],
  graduationYear: [
    'graduation', 'graduation-year', 'grad-year',
    'select[name*="graduation"]', 'input[name*="graduation"]',
    '[data-automation-id*="graduation"]', '[data-testid*="graduation"]'
  ],
  gpa: [
    'gpa', 'grade', 'cgpa', 'grade-point',
    'input[name*="gpa"]', 'input[name*="grade"]',
    '[data-automation-id*="gpa"]', '[data-testid*="gpa"]'
  ]
};

// Enhanced job board specific selectors
const JOB_BOARD_CONFIGS = {
  'linkedin.com': {
    formSelectors: [
      '.jobs-apply-form', '.application-outlet', '.jobs-search-two-pane__detail-view'
    ],
    jobTitleSelectors: [
      '.job-details-jobs-unified-top-card__job-title a',
      '.jobs-unified-top-card__job-title a',
      '.job-details-module__title'
    ],
    companySelectors: [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company a',
      '.job-details-module__company-name'
    ],
    locationSelectors: [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet'
    ],
    descriptionSelectors: [
      '.job-details-module__content',
      '.jobs-description__content'
    ]
  },
  
  'greenhouse.io': {
    formSelectors: ['.application-form', '#application_form'],
    jobTitleSelectors: ['.job-title', '.header-title h1'],
    companySelectors: ['.company-name', '.header-company'],
    locationSelectors: ['.location', '.job-location'],
    descriptionSelectors: ['.job-description', '.content']
  },
  
  'lever.co': {
    formSelectors: ['.application-form', '.posting-form'],
    jobTitleSelectors: ['.posting-headline h2', '.job-title'],
    companySelectors: ['.company-name', '.posting-company'],
    locationSelectors: ['.posting-categories .location', '.job-location'],
    descriptionSelectors: ['.posting-requirements', '.posting-description']
  },
  
  'workday.com': {
    formSelectors: [
      '[data-automation-id*="apply"]',
      '[data-automation-id*="application"]',
      '.css-1mf0p46'
    ],
    jobTitleSelectors: [
      '[data-automation-id="jobPostingHeader"]',
      '[data-automation-id*="title"]'
    ],
    companySelectors: [
      '[data-automation-id*="company"]',
      '[data-automation-id*="organization"]'
    ],
    locationSelectors: [
      '[data-automation-id*="location"]',
      '[data-automation-id*="workplace"]'
    ],
    descriptionSelectors: [
      '[data-automation-id*="description"]',
      '[data-automation-id*="jobPosting"]'
    ]
  },
  
  'ashbyhq.com': {
    formSelectors: ['.application-form', '.ashby-application'],
    jobTitleSelectors: ['.job-title', '.posting-title'],
    companySelectors: ['.company-name', '.posting-company'],
    locationSelectors: ['.job-location', '.posting-location'],
    descriptionSelectors: ['.job-description', '.posting-description']
  },
  
  'default': {
    formSelectors: [
      'form[id*="apply" i]', 'form[class*="apply" i]',
      'form[id*="application" i]', 'form[class*="application" i]',
      '.application-form', '.apply-form', '.job-application'
    ],
    jobTitleSelectors: [
      'h1', '.job-title', '.position-title', '.title',
      '[class*="title"]', '[id*="title"]'
    ],
    companySelectors: [
      '.company-name', '.company', '.employer',
      '[class*="company"]', '[id*="company"]'
    ],
    locationSelectors: [
      '.location', '.job-location', '.workplace-location',
      '[class*="location"]', '[id*="location"]'
    ],
    descriptionSelectors: [
      '.job-description', '.description', '.job-content',
      '[class*="description"]', '[id*="description"]'
    ]
  }
};

// Global state
let autoFillEnabled = true;
let userProfile = null;
let currentJobData = null;

// Initialize content script
async function initializeContentScript() {
  try {
    // Get settings from storage
    const settings = await chrome.storage.sync.get(['autofillEnabled', 'userProfile']);
    autoFillEnabled = settings.autofillEnabled !== false;
    userProfile = settings.userProfile;
    
    console.log('AutoJobr: Content script initialized', {
      autoFillEnabled,
      hasProfile: !!userProfile,
      hostname: window.location.hostname
    });
    
    // Extract job data from current page
    extractJobData();
    
    // Set up form monitoring if autofill is enabled
    if (autoFillEnabled) {
      setupFormMonitoring();
    }
    
  } catch (error) {
    console.error('AutoJobr: Error initializing content script:', error);
  }
}

// Extract job data from the current page
function extractJobData() {
  const hostname = window.location.hostname;
  const config = JOB_BOARD_CONFIGS[hostname] || JOB_BOARD_CONFIGS.default;
  
  const jobData = {
    title: extractTextFromSelectors(config.jobTitleSelectors),
    company: extractTextFromSelectors(config.companySelectors),
    location: extractTextFromSelectors(config.locationSelectors),
    description: extractTextFromSelectors(config.descriptionSelectors),
    url: window.location.href,
    source: hostname,
    extractedAt: new Date().toISOString()
  };
  
  currentJobData = jobData;
  
  console.log('AutoJobr: Extracted job data:', jobData);
  
  // Send to background script for analysis
  chrome.runtime.sendMessage({
    action: 'jobDataExtracted',
    data: jobData
  });
  
  return jobData;
}

// Helper function to extract text from multiple selectors
function extractTextFromSelectors(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  return '';
}

// Set up form monitoring for auto-fill
function setupFormMonitoring() {
  // Monitor for form appearances
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const forms = node.querySelectorAll('form');
          forms.forEach(form => {
            if (isJobApplicationForm(form)) {
              console.log('AutoJobr: Job application form detected');
              setTimeout(() => fillJobApplicationForm(form), 1000);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check existing forms
  document.querySelectorAll('form').forEach(form => {
    if (isJobApplicationForm(form)) {
      console.log('AutoJobr: Existing job application form detected');
      setTimeout(() => fillJobApplicationForm(form), 1000);
    }
  });
}

// Check if a form is likely a job application form
function isJobApplicationForm(form) {
  const formText = form.textContent.toLowerCase();
  const jobApplicationKeywords = [
    'apply', 'application', 'resume', 'cv', 'cover letter',
    'personal information', 'contact information', 'experience',
    'education', 'skills', 'submit application'
  ];
  
  return jobApplicationKeywords.some(keyword => 
    formText.includes(keyword) || 
    form.className.toLowerCase().includes(keyword) ||
    form.id.toLowerCase().includes(keyword)
  );
}

// Fill job application form with user data
async function fillJobApplicationForm(form) {
  if (!userProfile) {
    console.log('AutoJobr: No user profile available for form filling');
    return { success: false, message: 'No user profile available' };
  }
  
  let fieldsCount = 0;
  const filledFields = [];
  
  try {
    // Fill basic personal information
    fieldsCount += await fillFieldsByMapping(form, 'firstName', userProfile.firstName);
    fieldsCount += await fillFieldsByMapping(form, 'lastName', userProfile.lastName);
    fieldsCount += await fillFieldsByMapping(form, 'email', userProfile.email);
    fieldsCount += await fillFieldsByMapping(form, 'phone', userProfile.phone);
    
    // Fill location information
    fieldsCount += await fillFieldsByMapping(form, 'address', userProfile.currentAddress);
    fieldsCount += await fillFieldsByMapping(form, 'city', userProfile.city);
    fieldsCount += await fillFieldsByMapping(form, 'state', userProfile.state);
    fieldsCount += await fillFieldsByMapping(form, 'zipCode', userProfile.zipCode);
    fieldsCount += await fillFieldsByMapping(form, 'country', userProfile.country);
    
    // Fill professional information
    fieldsCount += await fillFieldsByMapping(form, 'linkedinUrl', userProfile.linkedinUrl);
    fieldsCount += await fillFieldsByMapping(form, 'githubUrl', userProfile.githubUrl);
    fieldsCount += await fillFieldsByMapping(form, 'portfolioUrl', userProfile.portfolioUrl);
    
    // Fill experience information
    if (userProfile.yearsExperience) {
      fieldsCount += await fillFieldsByMapping(form, 'yearsExperience', userProfile.yearsExperience.toString());
    }
    
    // Fill salary information
    if (userProfile.desiredSalaryMin && userProfile.desiredSalaryMax) {
      const salaryRange = `${userProfile.desiredSalaryMin} - ${userProfile.desiredSalaryMax} ${userProfile.salaryCurrency}`;
      fieldsCount += await fillFieldsByMapping(form, 'salaryExpectation', salaryRange);
    }
    
    // Fill work authorization
    fieldsCount += await fillFieldsByMapping(form, 'workAuthorization', userProfile.workAuthorization);
    if (userProfile.requiresSponsorship !== undefined) {
      fieldsCount += await fillCheckboxByMapping(form, 'requiresSponsorship', userProfile.requiresSponsorship);
    }
    
    // Fill education information
    if (userProfile.education && userProfile.education.length > 0) {
      const latestEducation = userProfile.education[0];
      fieldsCount += await fillFieldsByMapping(form, 'university', latestEducation.institution);
      fieldsCount += await fillFieldsByMapping(form, 'degree', latestEducation.degree);
      fieldsCount += await fillFieldsByMapping(form, 'major', latestEducation.fieldOfStudy);
      if (latestEducation.endDate) {
        const graduationYear = new Date(latestEducation.endDate).getFullYear();
        fieldsCount += await fillFieldsByMapping(form, 'graduationYear', graduationYear.toString());
      }
      fieldsCount += await fillFieldsByMapping(form, 'gpa', latestEducation.gpa);
    }
    
    console.log(`AutoJobr: Successfully filled ${fieldsCount} form fields`);
    
    // Track the application
    if (currentJobData) {
      chrome.runtime.sendMessage({
        action: 'trackApplication',
        data: {
          ...currentJobData,
          source: 'extension',
          status: 'applied',
          appliedDate: new Date().toISOString()
        }
      });
    }
    
    return { success: true, fieldsCount, filledFields };
    
  } catch (error) {
    console.error('AutoJobr: Error filling form:', error);
    return { success: false, error: error.message };
  }
}

// Fill fields by mapping with enhanced selectors
async function fillFieldsByMapping(form, fieldType, value) {
  if (!value) return 0;
  
  const selectors = FIELD_MAPPINGS[fieldType] || [];
  let filledCount = 0;
  
  for (const selector of selectors) {
    try {
      const elements = form.querySelectorAll(selector);
      for (const element of elements) {
        if (element && !element.value && !element.readOnly && !element.disabled) {
          await fillFormField(element, value);
          filledCount++;
          break; // Only fill the first matching empty field
        }
      }
      if (filledCount > 0) break; // Stop after successful fill
    } catch (error) {
      console.warn(`AutoJobr: Error with selector ${selector}:`, error);
    }
  }
  
  return filledCount;
}

// Fill checkbox fields
async function fillCheckboxByMapping(form, fieldType, value) {
  const selectors = FIELD_MAPPINGS[fieldType] || [];
  let filledCount = 0;
  
  for (const selector of selectors) {
    try {
      const elements = form.querySelectorAll(selector);
      for (const element of elements) {
        if (element && element.type === 'checkbox') {
          element.checked = Boolean(value);
          triggerEvents(element);
          filledCount++;
          break;
        }
      }
      if (filledCount > 0) break;
    } catch (error) {
      console.warn(`AutoJobr: Error with checkbox selector ${selector}:`, error);
    }
  }
  
  return filledCount;
}

// Enhanced form field filling with proper event handling
async function fillFormField(element, value) {
  if (!element || !value) return false;
  
  try {
    // Focus the element
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Set new value
    element.value = value;
    
    // Trigger events for React/Angular compatibility
    triggerEvents(element);
    
    // Small delay for event processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.warn('AutoJobr: Error filling field:', error);
    return false;
  }
}

// Trigger events for React/Angular compatibility
function triggerEvents(element) {
  const events = [
    new Event('input', { bubbles: true }),
    new Event('change', { bubbles: true }),
    new Event('blur', { bubbles: true }),
    new KeyboardEvent('keydown', { bubbles: true }),
    new KeyboardEvent('keyup', { bubbles: true })
  ];
  
  events.forEach(event => {
    try {
      element.dispatchEvent(event);
    } catch (error) {
      // Continue with other events
    }
  });
}

// Message listener for communication with popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'performAutoFill':
      const filled = performAdvancedAutoFill(request.data.userProfile);
      sendResponse({ success: true, filled });
      break;
      
    case 'getJobData':
      sendResponse({ success: true, data: currentJobData });
      break;
      
    case 'fillJobApplicationForm':
      fillJobApplicationForm(document.body).then(result => {
        sendResponse(result);
      });
      return true; // Keep message channel open
      
    case 'analyzeJobPage':
      const jobData = extractJobData();
      sendResponse({ success: true, analysis: jobData });
      break;
      
    case 'updateProfile':
      userProfile = request.data;
      sendResponse({ success: true });
      break;
      
    case 'toggleAutofill':
      autoFillEnabled = request.enabled;
      if (autoFillEnabled) {
        setupFormMonitoring();
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

console.log('AutoJobr Enhanced Content Script fully loaded');