// Advanced Form Filler - AutoJobr Extension
class FormFiller {
  constructor(userProfile) {
    this.userProfile = userProfile;
    this.fieldMappings = this.createFieldMappings();
    this.filledFields = [];
  }

  createFieldMappings() {
    const profile = this.userProfile.profile || {};
    const experience = this.userProfile.experience || [];
    const education = this.userProfile.education || [];
    const skills = this.userProfile.skills || [];

    // Get latest work experience
    const latestJob = experience.length > 0 ? experience[0] : {};
    const latestEducation = education.length > 0 ? education[0] : {};

    return {
      // Personal Information
      firstName: profile.firstName || '',
      first_name: profile.firstName || '',
      fname: profile.firstName || '',
      'first-name': profile.firstName || '',
      
      lastName: profile.lastName || '',
      last_name: profile.lastName || '',
      lname: profile.lastName || '',
      'last-name': profile.lastName || '',
      
      fullName: profile.fullName || `${profile.firstName} ${profile.lastName}`.trim(),
      full_name: profile.fullName || `${profile.firstName} ${profile.lastName}`.trim(),
      name: profile.fullName || `${profile.firstName} ${profile.lastName}`.trim(),
      
      email: profile.email || '',
      'email-address': profile.email || '',
      emailAddress: profile.email || '',
      
      phone: profile.phone || '',
      'phone-number': profile.phone || '',
      phoneNumber: profile.phone || '',
      mobile: profile.phone || '',
      
      // Address Information
      address: profile.address || '',
      street: profile.address || '',
      'street-address': profile.address || '',
      streetAddress: profile.address || '',
      address1: profile.address || '',
      
      city: profile.city || '',
      state: profile.state || '',
      zip: profile.zipCode || '',
      zipCode: profile.zipCode || '',
      'zip-code': profile.zipCode || '',
      postal: profile.zipCode || '',
      postalCode: profile.zipCode || '',
      country: profile.country || 'United States',
      
      // Professional Information
      jobTitle: profile.jobTitle || latestJob.jobTitle || '',
      'job-title': profile.jobTitle || latestJob.jobTitle || '',
      position: profile.jobTitle || latestJob.jobTitle || '',
      currentTitle: profile.jobTitle || latestJob.jobTitle || '',
      
      company: latestJob.company || '',
      currentCompany: latestJob.company || '',
      'current-company': latestJob.company || '',
      employer: latestJob.company || '',
      
      // Experience
      experience: this.formatExperience(experience),
      workExperience: this.formatExperience(experience),
      'work-experience': this.formatExperience(experience),
      
      // Education
      education: this.formatEducation(education),
      degree: latestEducation.degree || '',
      school: latestEducation.institution || '',
      university: latestEducation.institution || '',
      
      // Skills
      skills: this.formatSkills(skills),
      
      // LinkedIn/Social
      linkedin: profile.linkedinUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      'linkedin-url': profile.linkedinUrl || '',
      github: profile.githubUrl || '',
      githubUrl: profile.githubUrl || '',
      'github-url': profile.githubUrl || '',
      portfolio: profile.portfolioUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      'portfolio-url': profile.portfolioUrl || '',
      website: profile.portfolioUrl || '',
      
      // Work Authorization
      workAuthorization: profile.workAuthorization || 'yes',
      'work-authorization': profile.workAuthorization || 'yes',
      authorized: profile.workAuthorization || 'yes',
      eligible: profile.workAuthorization || 'yes',
      citizen: profile.workAuthorization === 'citizen' ? 'yes' : 'no',
      visa: profile.workAuthorization === 'visa' ? 'yes' : 'no',
      
      // Salary Expectations
      salaryExpectation: profile.salaryExpectation || '',
      'salary-expectation': profile.salaryExpectation || '',
      expectedSalary: profile.salaryExpectation || '',
      'expected-salary': profile.salaryExpectation || '',
      salary: profile.salaryExpectation || '',
      
      // Availability
      startDate: profile.availableStartDate || '',
      'start-date': profile.availableStartDate || '',
      availability: profile.availableStartDate || '',
      availableDate: profile.availableStartDate || '',
      'available-date': profile.availableStartDate || '',
      
      // Cover Letter
      coverLetter: '', // Will be generated separately
      'cover-letter': '',
      motivation: '',
      message: ''
    };
  }

  formatExperience(experience) {
    return experience.map(exp => 
      `${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`
    ).join('\n');
  }

  formatEducation(education) {
    return education.map(edu => 
      `${edu.degree} from ${edu.institution} (${edu.graduationYear || 'In Progress'})`
    ).join('\n');
  }

  formatSkills(skills) {
    return skills.map(skill => skill.skill || skill).join(', ');
  }

  async fillJobApplicationForm() {
    console.log('🎯 Starting intelligent form filling...');
    
    // Wait a moment for any dynamic content to load
    await this.delay(1000);
    
    // Find and fill all relevant form fields
    const forms = document.querySelectorAll('form');
    
    if (forms.length === 0) {
      console.log('No forms found on page');
      return;
    }

    for (const form of forms) {
      await this.fillForm(form);
    }

    // Also look for standalone fields not within forms
    await this.fillStandaloneFields();

    console.log(`✅ Form filling completed. Filled ${this.filledFields.length} fields.`);
    
    // Trigger any necessary events
    this.triggerFormEvents();
    
    // Show summary
    this.showFillSummary();
  }

  async fillForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    
    for (const field of fields) {
      await this.fillField(field);
    }
  }

  async fillStandaloneFields() {
    const allFields = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
    
    for (const field of allFields) {
      if (!this.filledFields.includes(field)) {
        await this.fillField(field);
      }
    }
  }

  async fillField(field) {
    if (!field || field.disabled || field.readOnly) return;
    
    const fieldInfo = this.analyzeField(field);
    const value = this.getValueForField(fieldInfo);
    
    if (value && this.shouldFillField(field, fieldInfo)) {
      await this.setFieldValue(field, value, fieldInfo.type);
      this.filledFields.push(field);
      console.log(`✓ Filled field: ${fieldInfo.identifier} = ${value.substring(0, 50)}...`);
    }
  }

  analyzeField(field) {
    const tagName = field.tagName.toLowerCase();
    const type = field.type?.toLowerCase() || 'text';
    const name = field.name?.toLowerCase() || '';
    const id = field.id?.toLowerCase() || '';
    const placeholder = field.placeholder?.toLowerCase() || '';
    const label = this.findAssociatedLabel(field)?.toLowerCase() || '';
    const ariaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
    
    // Create a combined identifier for matching
    const identifier = [name, id, placeholder, label, ariaLabel].join(' ');
    
    return {
      element: field,
      tagName,
      type,
      name,
      id,
      placeholder,
      label,
      ariaLabel,
      identifier,
      required: field.required || field.hasAttribute('required')
    };
  }

  findAssociatedLabel(field) {
    // Try to find label by 'for' attribute
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent || label.innerText;
    }
    
    // Try to find parent label
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent || parentLabel.innerText;
    
    // Try to find preceding label
    const prevElement = field.previousElementSibling;
    if (prevElement && prevElement.tagName.toLowerCase() === 'label') {
      return prevElement.textContent || prevElement.innerText;
    }
    
    return '';
  }

  getValueForField(fieldInfo) {
    const { identifier, type, tagName } = fieldInfo;
    
    // Special handling for file uploads
    if (type === 'file') return null;
    
    // Special handling for checkboxes and radio buttons
    if (type === 'checkbox' || type === 'radio') {
      return this.getBooleanValue(identifier);
    }
    
    // Look for exact matches first
    for (const [key, value] of Object.entries(this.fieldMappings)) {
      if (identifier.includes(key.toLowerCase()) && value) {
        return String(value);
      }
    }
    
    // Fuzzy matching for common patterns
    if (this.containsAny(identifier, ['first', 'fname', 'given'])) {
      return this.fieldMappings.firstName;
    }
    
    if (this.containsAny(identifier, ['last', 'lname', 'family', 'surname'])) {
      return this.fieldMappings.lastName;
    }
    
    if (this.containsAny(identifier, ['email', 'mail'])) {
      return this.fieldMappings.email;
    }
    
    if (this.containsAny(identifier, ['phone', 'mobile', 'cell', 'telephone'])) {
      return this.fieldMappings.phone;
    }
    
    if (this.containsAny(identifier, ['address', 'street'])) {
      return this.fieldMappings.address;
    }
    
    if (this.containsAny(identifier, ['city', 'town'])) {
      return this.fieldMappings.city;
    }
    
    if (this.containsAny(identifier, ['state', 'province', 'region'])) {
      return this.fieldMappings.state;
    }
    
    if (this.containsAny(identifier, ['zip', 'postal'])) {
      return this.fieldMappings.zipCode;
    }
    
    if (this.containsAny(identifier, ['country'])) {
      return this.fieldMappings.country;
    }
    
    if (this.containsAny(identifier, ['title', 'position', 'role'])) {
      return this.fieldMappings.jobTitle;
    }
    
    if (this.containsAny(identifier, ['company', 'employer', 'organization'])) {
      return this.fieldMappings.company;
    }
    
    if (this.containsAny(identifier, ['linkedin'])) {
      return this.fieldMappings.linkedin;
    }
    
    if (this.containsAny(identifier, ['github'])) {
      return this.fieldMappings.github;
    }
    
    if (this.containsAny(identifier, ['portfolio', 'website'])) {
      return this.fieldMappings.portfolio;
    }
    
    if (this.containsAny(identifier, ['cover', 'letter', 'motivation', 'message', 'why'])) {
      return ''; // Cover letter will be handled separately
    }
    
    if (this.containsAny(identifier, ['salary', 'compensation', 'pay'])) {
      return this.fieldMappings.salaryExpectation;
    }
    
    if (this.containsAny(identifier, ['start', 'available', 'join'])) {
      return this.fieldMappings.startDate;
    }
    
    if (this.containsAny(identifier, ['authorized', 'eligible', 'visa', 'citizen'])) {
      return this.fieldMappings.workAuthorization;
    }
    
    return null;
  }

  getBooleanValue(identifier) {
    if (this.containsAny(identifier, ['authorized', 'eligible', 'citizen'])) {
      return this.fieldMappings.workAuthorization === 'yes';
    }
    
    if (this.containsAny(identifier, ['visa', 'h1b', 'work permit'])) {
      return this.fieldMappings.workAuthorization === 'visa';
    }
    
    // Default to true for most checkboxes (privacy policy, terms, etc.)
    return true;
  }

  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  shouldFillField(field, fieldInfo) {
    // Don't fill if already has value
    if (field.value && field.value.trim() !== '') return false;
    
    // Don't fill certain field types
    if (['hidden', 'submit', 'button', 'reset'].includes(fieldInfo.type)) return false;
    
    // Don't fill if field appears to be for passwords or sensitive data
    if (this.containsAny(fieldInfo.identifier, ['password', 'pass', 'pwd', 'secret', 'token'])) return false;
    
    return true;
  }

  async setFieldValue(field, value, type) {
    try {
      if (type === 'checkbox' || type === 'radio') {
        if (value) {
          field.checked = true;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }
      
      if (field.tagName.toLowerCase() === 'select') {
        // Try to find matching option
        const options = Array.from(field.options);
        const matchingOption = options.find(option => 
          option.value.toLowerCase().includes(value.toLowerCase()) ||
          option.text.toLowerCase().includes(value.toLowerCase())
        );
        
        if (matchingOption) {
          field.value = matchingOption.value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }
      
      // For text inputs and textareas
      field.focus();
      await this.delay(100);
      
      // Clear existing value
      field.value = '';
      
      // Type the value character by character for better compatibility
      for (let i = 0; i < value.length; i++) {
        field.value += value[i];
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(10); // Small delay between characters
      }
      
      // Trigger additional events
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
    } catch (error) {
      console.error('Error setting field value:', error);
    }
  }

  triggerFormEvents() {
    // Trigger form validation and other events
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.dispatchEvent(new Event('input', { bubbles: true }));
      form.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  showFillSummary() {
    if (this.filledFields.length === 0) {
      console.log('No fields were filled');
      return;
    }
    
    // Create a summary notification
    const notification = document.createElement('div');
    notification.className = 'autojobr-fill-summary';
    notification.innerHTML = `
      <div class="summary-content">
        <h4>✅ AutoJobr Form Fill Complete</h4>
        <p>Successfully filled ${this.filledFields.length} fields</p>
        <div class="summary-actions">
          <button onclick="this.parentElement.parentElement.parentElement.remove()">Dismiss</button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Make FormFiller available globally
window.FormFiller = FormFiller;