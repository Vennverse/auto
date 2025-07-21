// Advanced Form Filler - Star Product Implementation
// Intelligent form detection and filling across all major job sites

class AdvancedFormFiller {
  constructor() {
    this.userProfile = null;
    this.isEnabled = true;
    this.filledFields = new Set();
    this.siteContext = this.detectSiteContext();
    this.fieldMappings = this.initializeFieldMappings();
    this.init();
  }

  async init() {
    await this.loadUserProfile();
    this.setupObservers();
    this.startAutoFilling();
  }

  detectSiteContext() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    const contexts = {
      workday: {
        patterns: ['myworkdayjobs', 'workday.com', 'wd1.myworkdayjobs', 'wd3.myworkdayjobs', 'wd5.myworkdayjobs'],
        type: 'workday',
        framework: 'react'
      },
      linkedin: {
        patterns: ['linkedin.com'],
        type: 'linkedin',
        framework: 'react'
      },
      greenhouse: {
        patterns: ['greenhouse.io', 'boards.greenhouse', 'greenhouse'],
        type: 'greenhouse',
        framework: 'rails'
      },
      lever: {
        patterns: ['lever.co', 'jobs.lever'],
        type: 'lever',
        framework: 'react'
      },
      icims: {
        patterns: ['icims.com', 'careers-', 'apply.icims'],
        type: 'icims',
        framework: 'legacy'
      },
      bamboohr: {
        patterns: ['bamboohr.com', 'bamboohr'],
        type: 'bamboohr',
        framework: 'angular'
      },
      jobvite: {
        patterns: ['jobvite.com', 'jobs.jobvite'],
        type: 'jobvite',
        framework: 'jquery'
      },
      smartrecruiters: {
        patterns: ['smartrecruiters.com', 'jobs.smartrecruiters'],
        type: 'smartrecruiters',
        framework: 'react'
      },
      ashbyhq: {
        patterns: ['ashbyhq.com', 'jobs.ashbyhq'],
        type: 'ashbyhq',
        framework: 'react'
      },
      wellfound: {
        patterns: ['wellfound.com', 'angel.co'],
        type: 'wellfound',
        framework: 'react'
      }
    };

    for (const [key, context] of Object.entries(contexts)) {
      if (context.patterns.some(pattern => hostname.includes(pattern) || url.includes(pattern))) {
        return { ...context, name: key };
      }
    }

    return { type: 'generic', name: 'generic', framework: 'unknown' };
  }

  initializeFieldMappings() {
    return {
      // Personal Information
      firstName: {
        selectors: [
          'input[name*="first" i][name*="name" i]',
          'input[id*="first" i][id*="name" i]',
          'input[placeholder*="first name" i]',
          'input[data-automation-id*="firstName"]',
          'input[name="firstName"]',
          'input[name="fname"]',
          'input[name="first_name"]',
          'input[aria-label*="first name" i]',
          'input[data-testid*="first-name"]',
          '[data-field="firstName"] input',
          '.first-name input'
        ],
        keywords: ['first', 'given', 'forename'],
        confidence: 0.95
      },
      
      lastName: {
        selectors: [
          'input[name*="last" i][name*="name" i]',
          'input[id*="last" i][id*="name" i]',
          'input[placeholder*="last name" i]',
          'input[data-automation-id*="lastName"]',
          'input[name="lastName"]',
          'input[name="lname"]',
          'input[name="last_name"]',
          'input[aria-label*="last name" i]',
          'input[data-testid*="last-name"]',
          '[data-field="lastName"] input',
          '.last-name input'
        ],
        keywords: ['last', 'surname', 'family'],
        confidence: 0.95
      },
      
      fullName: {
        selectors: [
          'input[name*="full" i][name*="name" i]',
          'input[placeholder*="full name" i]',
          'input[name="name"]',
          'input[name="fullName"]',
          'input[aria-label*="full name" i]',
          'input[data-testid*="full-name"]',
          '[data-field="name"] input'
        ],
        keywords: ['full name', 'complete name', 'name'],
        confidence: 0.9
      },
      
      email: {
        selectors: [
          'input[type="email"]',
          'input[name*="email" i]',
          'input[id*="email" i]',
          'input[placeholder*="email" i]',
          'input[data-automation-id*="email"]',
          'input[aria-label*="email" i]',
          'input[data-testid*="email"]',
          '[data-field="email"] input'
        ],
        keywords: ['email', 'e-mail'],
        confidence: 0.98
      },
      
      phone: {
        selectors: [
          'input[type="tel"]',
          'input[name*="phone" i]',
          'input[id*="phone" i]',
          'input[placeholder*="phone" i]',
          'input[name*="mobile" i]',
          'input[data-automation-id*="phone"]',
          'input[aria-label*="phone" i]',
          'input[data-testid*="phone"]',
          '[data-field="phone"] input'
        ],
        keywords: ['phone', 'mobile', 'telephone', 'cell'],
        confidence: 0.9
      },
      
      // Address Information
      address: {
        selectors: [
          'input[name*="address" i]',
          'input[id*="address" i]',
          'textarea[name*="address" i]',
          'input[placeholder*="address" i]',
          'input[data-automation-id*="address"]',
          'input[aria-label*="address" i]',
          '[data-field="address"] input'
        ],
        keywords: ['address', 'street', 'location'],
        confidence: 0.85
      },
      
      city: {
        selectors: [
          'input[name*="city" i]',
          'input[id*="city" i]',
          'input[placeholder*="city" i]',
          'input[data-automation-id*="city"]',
          'input[aria-label*="city" i]',
          '[data-field="city"] input'
        ],
        keywords: ['city', 'town', 'municipality'],
        confidence: 0.9
      },
      
      state: {
        selectors: [
          'select[name*="state" i]',
          'input[name*="state" i]',
          'select[id*="state" i]',
          'input[id*="state" i]',
          'select[data-automation-id*="state"]',
          'input[placeholder*="state" i]',
          '[data-field="state"] select',
          '[data-field="state"] input'
        ],
        keywords: ['state', 'province', 'region'],
        confidence: 0.9
      },
      
      zipCode: {
        selectors: [
          'input[name*="zip" i]',
          'input[name*="postal" i]',
          'input[id*="zip" i]',
          'input[id*="postal" i]',
          'input[placeholder*="zip" i]',
          'input[placeholder*="postal" i]',
          'input[data-automation-id*="postalCode"]',
          '[data-field="zipCode"] input'
        ],
        keywords: ['zip', 'postal', 'postcode'],
        confidence: 0.9
      },
      
      country: {
        selectors: [
          'select[name*="country" i]',
          'input[name*="country" i]',
          'select[id*="country" i]',
          'select[data-automation-id*="country"]',
          '[data-field="country"] select'
        ],
        keywords: ['country', 'nation'],
        confidence: 0.95
      },
      
      // Professional Information
      linkedinUrl: {
        selectors: [
          'input[name*="linkedin" i]',
          'input[id*="linkedin" i]',
          'input[placeholder*="linkedin" i]',
          'input[name*="profile" i][name*="url" i]',
          'input[placeholder*="linkedin.com" i]',
          '[data-field="linkedinUrl"] input'
        ],
        keywords: ['linkedin', 'profile url', 'social'],
        confidence: 0.8
      },
      
      githubUrl: {
        selectors: [
          'input[name*="github" i]',
          'input[id*="github" i]',
          'input[placeholder*="github" i]',
          'input[placeholder*="github.com" i]',
          '[data-field="githubUrl"] input'
        ],
        keywords: ['github', 'git', 'repository'],
        confidence: 0.8
      },
      
      portfolioUrl: {
        selectors: [
          'input[name*="portfolio" i]',
          'input[name*="website" i]',
          'input[id*="portfolio" i]',
          'input[placeholder*="portfolio" i]',
          'input[placeholder*="website" i]',
          '[data-field="portfolioUrl"] input'
        ],
        keywords: ['portfolio', 'website', 'personal site'],
        confidence: 0.75
      },
      
      // Work Authorization
      workAuthorization: {
        selectors: [
          'select[name*="authorization" i]',
          'select[name*="eligible" i]',
          'select[name*="visa" i]',
          'input[name*="authorization" i]',
          'select[data-automation-id*="workAuth"]'
        ],
        keywords: ['work authorization', 'eligible to work', 'visa status'],
        confidence: 0.7
      },
      
      requiresSponsorship: {
        selectors: [
          'select[name*="sponsor" i]',
          'input[name*="sponsor" i]',
          'select[name*="visa" i][name*="sponsor" i]',
          'input[type="radio"][name*="sponsor" i]'
        ],
        keywords: ['sponsorship', 'visa sponsorship', 'require sponsor'],
        confidence: 0.7
      },
      
      // Experience and Education
      yearsExperience: {
        selectors: [
          'select[name*="experience" i][name*="year" i]',
          'input[name*="experience" i][name*="year" i]',
          'select[name*="years" i][name*="experience" i]',
          'input[placeholder*="years of experience" i]'
        ],
        keywords: ['years of experience', 'experience level'],
        confidence: 0.6
      },
      
      education: {
        selectors: [
          'select[name*="education" i]',
          'select[name*="degree" i]',
          'input[name*="education" i]',
          'select[name*="qualification" i]'
        ],
        keywords: ['education', 'degree', 'qualification'],
        confidence: 0.6
      },
      
      // Salary and Preferences
      salaryExpectation: {
        selectors: [
          'input[name*="salary" i]',
          'input[name*="compensation" i]',
          'input[name*="expected" i][name*="salary" i]',
          'input[placeholder*="salary" i]'
        ],
        keywords: ['salary', 'compensation', 'expected salary'],
        confidence: 0.5
      },
      
      startDate: {
        selectors: [
          'input[name*="start" i][name*="date" i]',
          'input[name*="available" i]',
          'input[type="date"][name*="start" i]',
          'input[placeholder*="start date" i]'
        ],
        keywords: ['start date', 'availability', 'available'],
        confidence: 0.7
      }
    };
  }

  async loadUserProfile() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, (response) => {
        if (response && response.success) {
          this.userProfile = response.data;
          console.log('AutoJobr: Advanced form filler loaded profile for:', this.userProfile.user?.firstName);
        }
        resolve();
      });
    });
  }

  setupObservers() {
    // MutationObserver for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });
      
      if (shouldProcess) {
        setTimeout(() => this.processNewContent(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Focus observer for just-in-time filling
    document.addEventListener('focusin', (e) => {
      if (this.isFormField(e.target)) {
        setTimeout(() => this.processField(e.target), 100);
      }
    });
  }

  startAutoFilling() {
    // Initial fill
    this.processAllFields();
    
    // Periodic checks for new content
    setInterval(() => this.processNewContent(), 2000);
  }

  processAllFields() {
    if (!this.userProfile || !this.isEnabled) return;
    
    console.log(`AutoJobr: Starting comprehensive form filling on ${this.siteContext.name}`);
    
    const fields = this.findAllFormFields();
    let filledCount = 0;
    
    fields.forEach(field => {
      if (this.processField(field)) {
        filledCount++;
      }
    });
    
    console.log(`AutoJobr: Successfully filled ${filledCount} fields`);
    
    if (filledCount > 0) {
      this.showSuccessNotification(filledCount);
    }
  }

  processNewContent() {
    const newFields = this.findAllFormFields().filter(field => 
      !this.filledFields.has(this.getFieldId(field))
    );
    
    if (newFields.length > 0) {
      console.log(`AutoJobr: Processing ${newFields.length} new fields`);
      newFields.forEach(field => this.processField(field));
    }
  }

  findAllFormFields() {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="search"]',
      'input[type="number"]',
      'input:not([type])',
      'select',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      '[role="combobox"]',
      // React-specific selectors
      '.react-select__input input',
      '.Select-input input',
      // Workday-specific selectors
      '[data-automation-id*="input"]',
      '[data-automation-id*="textInput"]',
      // LinkedIn-specific selectors
      '.jobs-apply__form-field input',
      '.jobs-apply__form-field select',
      '.jobs-apply__form-field textarea'
    ];

    return Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(field => this.isFormField(field) && this.isFieldFillable(field));
  }

  isFormField(element) {
    return element && (
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA' ||
      element.contentEditable === 'true' ||
      element.role === 'textbox' ||
      element.role === 'combobox'
    );
  }

  isFieldFillable(field) {
    return !field.disabled &&
           !field.readOnly &&
           field.type !== 'hidden' &&
           field.type !== 'submit' &&
           field.type !== 'button' &&
           field.type !== 'file' &&
           field.type !== 'password' &&
           !field.closest('[style*="display: none"]') &&
           !field.closest('[style*="visibility: hidden"]') &&
           field.offsetHeight > 0 &&
           field.offsetWidth > 0;
  }

  processField(field) {
    if (!this.isFieldFillable(field)) return false;
    
    const fieldId = this.getFieldId(field);
    if (this.filledFields.has(fieldId)) return false;
    
    const analysis = this.analyzeField(field);
    if (analysis.confidence < 0.3) return false;
    
    const value = this.getProfileValue(analysis.mappedField);
    if (!value) return false;
    
    const success = this.fillField(field, value, analysis);
    if (success) {
      this.filledFields.add(fieldId);
    }
    
    return success;
  }

  analyzeField(field) {
    const context = {
      name: (field.name || '').toLowerCase(),
      id: (field.id || '').toLowerCase(),
      placeholder: (field.placeholder || '').toLowerCase(),
      ariaLabel: (field.getAttribute('aria-label') || '').toLowerCase(),
      dataTestId: (field.getAttribute('data-testid') || '').toLowerCase(),
      dataAutomationId: (field.getAttribute('data-automation-id') || '').toLowerCase(),
      className: field.className.toLowerCase(),
      labelText: this.getFieldLabel(field).toLowerCase(),
      parentText: this.getParentContext(field).toLowerCase()
    };
    
    const combinedText = Object.values(context).join(' ');
    
    let bestMatch = { field: null, confidence: 0 };
    
    // Check each field mapping
    for (const [fieldName, mapping] of Object.entries(this.fieldMappings)) {
      let confidence = 0;
      
      // Selector-based matching (highest confidence)
      for (const selector of mapping.selectors) {
        if (field.matches(selector)) {
          confidence = Math.max(confidence, mapping.confidence);
          break;
        }
      }
      
      // Keyword-based matching
      if (confidence < 0.8) {
        for (const keyword of mapping.keywords) {
          if (combinedText.includes(keyword)) {
            confidence = Math.max(confidence, mapping.confidence * 0.7);
          }
        }
      }
      
      // Site-specific adjustments
      confidence = this.adjustConfidenceForSite(fieldName, context, confidence);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { field: fieldName, confidence };
      }
    }
    
    return {
      mappedField: bestMatch.field,
      confidence: bestMatch.confidence,
      context
    };
  }

  adjustConfidenceForSite(fieldName, context, confidence) {
    switch (this.siteContext.name) {
      case 'workday':
        if (context.dataAutomationId.includes(fieldName.toLowerCase())) {
          return Math.min(confidence + 0.2, 1.0);
        }
        break;
        
      case 'linkedin':
        if (context.className.includes('jobs-apply') && context.name.includes(fieldName.toLowerCase())) {
          return Math.min(confidence + 0.15, 1.0);
        }
        break;
        
      case 'greenhouse':
        if (context.id.includes(fieldName.toLowerCase()) || context.name.includes(fieldName.toLowerCase())) {
          return Math.min(confidence + 0.1, 1.0);
        }
        break;
    }
    
    return confidence;
  }

  getFieldLabel(field) {
    // Multiple strategies to find field labels
    const strategies = [
      () => field.labels?.[0]?.textContent,
      () => field.getAttribute('aria-label'),
      () => field.getAttribute('aria-labelledby') && 
            document.getElementById(field.getAttribute('aria-labelledby'))?.textContent,
      () => field.closest('label')?.textContent,
      () => field.parentElement?.querySelector('label')?.textContent,
      () => field.parentElement?.previousElementSibling?.textContent,
      () => field.previousElementSibling?.textContent,
      () => field.parentElement?.parentElement?.querySelector('label')?.textContent,
      () => field.closest('[data-field]')?.getAttribute('data-field'),
      () => field.closest('.form-field, .input-group, .field-wrapper')?.querySelector('label, .label, .field-label')?.textContent
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result && result.trim()) {
          return result.trim();
        }
      } catch (e) {
        // Continue to next strategy
      }
    }
    
    return '';
  }

  getParentContext(field) {
    const parent = field.closest('.form-group, .field-group, .input-group, .form-field, [data-field]');
    return parent ? parent.textContent.slice(0, 200) : '';
  }

  getProfileValue(fieldName) {
    if (!this.userProfile || !fieldName) return null;
    
    const mappings = {
      firstName: this.userProfile.user?.firstName,
      lastName: this.userProfile.user?.lastName,
      fullName: this.getFullName(),
      email: this.userProfile.user?.email,
      phone: this.userProfile.profile?.phone,
      address: this.userProfile.profile?.currentAddress,
      city: this.userProfile.profile?.city,
      state: this.userProfile.profile?.state,
      zipCode: this.userProfile.profile?.zipCode,
      country: this.userProfile.profile?.country || 'United States',
      linkedinUrl: this.userProfile.profile?.linkedinUrl,
      githubUrl: this.userProfile.profile?.githubUrl,
      portfolioUrl: this.userProfile.profile?.portfolioUrl,
      workAuthorization: this.userProfile.profile?.workAuthorization,
      requiresSponsorship: this.mapBooleanValue(this.userProfile.profile?.requiresSponsorship),
      yearsExperience: this.calculateYearsExperience(),
      education: this.getHighestEducation(),
      salaryExpectation: this.userProfile.profile?.expectedSalary,
      startDate: this.userProfile.profile?.availableStartDate
    };
    
    return mappings[fieldName];
  }

  getFullName() {
    const first = this.userProfile.user?.firstName || '';
    const last = this.userProfile.user?.lastName || '';
    return `${first} ${last}`.trim();
  }

  mapBooleanValue(value) {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return value;
  }

  calculateYearsExperience() {
    if (!this.userProfile.workExperience) return null;
    
    let totalMonths = 0;
    this.userProfile.workExperience.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.floor(totalMonths / 12);
  }

  getHighestEducation() {
    if (!this.userProfile.education || this.userProfile.education.length === 0) return null;
    
    const degreeRanking = {
      'PhD': 6, 'Doctorate': 6, 'Doctor': 6,
      'Masters': 5, 'Master': 5, 'MBA': 5,
      'Bachelor': 4, 'Bachelors': 4,
      'Associate': 3, 'Associates': 3,
      'High School': 2, 'Diploma': 2,
      'Certificate': 1
    };
    
    let highest = this.userProfile.education[0];
    let highestRank = 0;
    
    this.userProfile.education.forEach(edu => {
      for (const [degree, rank] of Object.entries(degreeRanking)) {
        if (edu.degree?.includes(degree) && rank > highestRank) {
          highest = edu;
          highestRank = rank;
        }
      }
    });
    
    return highest.degree;
  }

  fillField(field, value, analysis) {
    try {
      if (!value || value.toString().trim() === '') return false;
      
      const fieldType = field.tagName.toLowerCase();
      const inputType = field.type?.toLowerCase();
      
      // Clear existing value
      this.clearField(field);
      
      // Wait for field to be ready
      setTimeout(() => {
        switch (fieldType) {
          case 'select':
            return this.fillSelectField(field, value);
          case 'textarea':
            return this.fillTextArea(field, value);
          case 'input':
            if (inputType === 'checkbox' || inputType === 'radio') {
              return this.fillCheckboxRadio(field, value);
            } else {
              return this.fillInputField(field, value);
            }
          default:
            if (field.contentEditable === 'true') {
              return this.fillContentEditable(field, value);
            }
            return this.fillInputField(field, value);
        }
      }, 50);
      
      return true;
    } catch (error) {
      console.log('AutoJobr: Error filling field:', error);
      return false;
    }
  }

  clearField(field) {
    if (field.value !== undefined) {
      field.value = '';
    }
    if (field.textContent !== undefined) {
      field.textContent = '';
    }
    
    // Trigger change events
    this.triggerEvents(field, ['input', 'change']);
  }

  fillInputField(field, value) {
    // Set value using multiple methods for compatibility
    const descriptor = Object.getOwnPropertyDescriptor(field, 'value') || 
                      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value');
    
    if (descriptor && descriptor.set) {
      descriptor.set.call(field, value);
    } else {
      field.value = value;
    }
    
    // Trigger events for different frameworks
    this.triggerEvents(field, [
      'input', 'change', 'blur', 'keydown', 'keyup', 'paste'
    ]);
    
    return true;
  }

  fillSelectField(field, value) {
    // Try exact match first
    let option = Array.from(field.options).find(opt => 
      opt.value === value || opt.text === value
    );
    
    // Try case-insensitive match
    if (!option) {
      option = Array.from(field.options).find(opt => 
        opt.value.toLowerCase() === value.toLowerCase() || 
        opt.text.toLowerCase() === value.toLowerCase()
      );
    }
    
    // Try partial match
    if (!option) {
      option = Array.from(field.options).find(opt => 
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(opt.text.toLowerCase())
      );
    }
    
    if (option) {
      field.selectedIndex = option.index;
      this.triggerEvents(field, ['change', 'input']);
      return true;
    }
    
    return false;
  }

  fillTextArea(field, value) {
    field.value = value;
    this.triggerEvents(field, ['input', 'change', 'blur']);
    return true;
  }

  fillContentEditable(field, value) {
    field.textContent = value;
    this.triggerEvents(field, ['input', 'change', 'blur']);
    return true;
  }

  fillCheckboxRadio(field, value) {
    const shouldCheck = value === 'Yes' || value === 'true' || value === true || value === 'on';
    field.checked = shouldCheck;
    this.triggerEvents(field, ['change', 'click']);
    return true;
  }

  triggerEvents(element, eventTypes) {
    eventTypes.forEach(eventType => {
      try {
        // Native event
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        
        // React synthetic event
        if (window.React) {
          const reactEvent = new Event(eventType, { bubbles: true });
          element.dispatchEvent(reactEvent);
        }
        
        // jQuery event (if available)
        if (window.jQuery) {
          window.jQuery(element).trigger(eventType);
        }
      } catch (e) {
        // Continue with other events
      }
    });
  }

  getFieldId(field) {
    return field.id || field.name || field.getAttribute('data-automation-id') || 
           `${field.tagName}-${field.type}-${Math.random().toString(36).substr(2, 9)}`;
  }

  showSuccessNotification(count) {
    // Create floating notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        AutoJobr filled ${count} fields successfully!
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize the advanced form filler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AdvancedFormFiller());
} else {
  new AdvancedFormFiller();
}