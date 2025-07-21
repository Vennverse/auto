// Native NLP Engine for AutoJobr Extension - No External Dependencies
class AutoJobrNLP {
  constructor() {
    this.jobKeywords = {
      // Programming Languages
      programming: [
        'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
        'kotlin', 'typescript', 'scala', 'r', 'matlab', 'perl', 'objective-c', 'dart',
        'haskell', 'lua', 'shell', 'bash', 'powershell', 'sql', 'html', 'css'
      ],
      
      // Frameworks & Technologies
      frameworks: [
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'laravel', 'rails', 'asp.net', 'blazor', 'next.js', 'nuxt.js', 'gatsby',
        'svelte', 'ember', 'backbone', 'jquery', 'bootstrap', 'tailwind', 'material-ui',
        'ant-design', 'semantic-ui', 'foundation', 'bulma'
      ],
      
      // Databases
      databases: [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
        'cassandra', 'dynamodb', 'firebase', 'supabase', 'prisma', 'sequelize',
        'mongoose', 'typeorm', 'knex', 'drizzle'
      ],
      
      // Cloud & DevOps
      cloud: [
        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins',
        'gitlab', 'github actions', 'terraform', 'ansible', 'chef', 'puppet',
        'vagrant', 'circleci', 'travis ci', 'vercel', 'netlify', 'heroku'
      ],
      
      // AI/ML
      ai: [
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
        'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'opencv',
        'nlp', 'computer vision', 'neural networks', 'ai', 'artificial intelligence'
      ],
      
      // Soft Skills
      soft: [
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
        'analytical', 'creative', 'adaptable', 'detail-oriented', 'time management',
        'project management', 'agile', 'scrum', 'kanban', 'collaboration'
      ],
      
      // Experience Levels
      experience: [
        'junior', 'senior', 'mid-level', 'lead', 'principal', 'staff', 'architect',
        'manager', 'director', 'vp', 'cto', 'entry-level', 'internship'
      ],
      
      // Job Types
      types: [
        'full-time', 'part-time', 'contract', 'freelance', 'remote', 'hybrid',
        'on-site', 'temporary', 'permanent', 'consultant'
      ]
    };
    
    this.salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*)\s*(?:-\s*\$(\d{1,3}(?:,\d{3})*))?/g, // $50,000 - $80,000
      /(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:USD|dollars?)/gi, // 50,000 - 80,000 USD
      /\$(\d{1,3})k?\s*(?:-\s*\$?(\d{1,3})k?)?/gi, // $50k - $80k
      /(\d{1,3})k?\s*-\s*(\d{1,3})k?\s*(?:per\s+year|annually)/gi // 50k - 80k per year
    ];
    
    this.locationPatterns = [
      /(?:location|based|office):\s*([^,\n]+(?:,\s*[^,\n]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g, // City, State
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g // City, Country
    ];
  }

  analyzeJobDescription(description, userSkills = []) {
    const analysis = {
      extractedSkills: this.extractSkills(description),
      salaryRange: this.extractSalary(description),
      location: this.extractLocation(description),
      experienceLevel: this.extractExperienceLevel(description),
      jobType: this.extractJobType(description),
      matchScore: 0,
      skillsMatch: [],
      skillsGap: [],
      summary: ''
    };

    // Calculate match score if user skills provided
    if (userSkills.length > 0) {
      const matchData = this.calculateSkillMatch(analysis.extractedSkills, userSkills);
      analysis.matchScore = matchData.score;
      analysis.skillsMatch = matchData.matched;
      analysis.skillsGap = matchData.gap;
    }

    // Generate summary
    analysis.summary = this.generateSummary(analysis);

    return analysis;
  }

  extractSkills(text) {
    const allSkills = [];
    const lowerText = text.toLowerCase();
    
    // Extract skills from all categories
    Object.values(this.jobKeywords).forEach(category => {
      category.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(lowerText)) {
          allSkills.push(skill);
        }
      });
    });

    // Remove duplicates and return unique skills
    return [...new Set(allSkills)];
  }

  extractSalary(text) {
    for (const pattern of this.salaryPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const min = parseInt(match[1].replace(/,/g, ''));
        const max = match[2] ? parseInt(match[2].replace(/,/g, '')) : min;
        
        return {
          min: min < 1000 ? min * 1000 : min, // Convert k to full numbers
          max: max < 1000 ? max * 1000 : max,
          currency: 'USD'
        };
      }
    }
    return null;
  }

  extractLocation(text) {
    for (const pattern of this.locationPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        return match[1] + (match[2] ? `, ${match[2]}` : '');
      }
    }

    // Check for remote/hybrid patterns
    const remotePattern = /\b(remote|work from home|wfh|hybrid|distributed)\b/gi;
    if (remotePattern.test(text)) {
      return 'Remote';
    }

    return null;
  }

  extractExperienceLevel(text) {
    const lowerText = text.toLowerCase();
    
    // Check for specific year requirements
    const yearPattern = /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi;
    const yearMatch = yearPattern.exec(text);
    if (yearMatch) {
      const years = parseInt(yearMatch[1]);
      if (years >= 7) return 'Senior';
      if (years >= 3) return 'Mid-level';
      return 'Junior';
    }

    // Check for experience keywords
    for (const level of this.jobKeywords.experience) {
      if (lowerText.includes(level)) {
        return level.charAt(0).toUpperCase() + level.slice(1);
      }
    }

    return 'Not specified';
  }

  extractJobType(text) {
    const lowerText = text.toLowerCase();
    
    for (const type of this.jobKeywords.types) {
      if (lowerText.includes(type)) {
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }

    return 'Not specified';
  }

  calculateSkillMatch(jobSkills, userSkills) {
    const userSkillsLower = userSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.skillName?.toLowerCase()
    ).filter(Boolean);
    
    const jobSkillsLower = jobSkills.map(skill => skill.toLowerCase());
    
    const matched = [];
    const gap = [];

    jobSkillsLower.forEach(jobSkill => {
      const isMatched = userSkillsLower.some(userSkill => 
        userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
      );
      
      if (isMatched) {
        matched.push(jobSkill);
      } else {
        gap.push(jobSkill);
      }
    });

    const score = jobSkillsLower.length > 0 
      ? Math.round((matched.length / jobSkillsLower.length) * 100)
      : 0;

    return { score, matched, gap };
  }

  generateSummary(analysis) {
    const parts = [];
    
    if (analysis.matchScore > 0) {
      if (analysis.matchScore >= 80) {
        parts.push('Excellent match for your skills');
      } else if (analysis.matchScore >= 60) {
        parts.push('Good match with some skill gaps');
      } else {
        parts.push('Moderate match - consider skill development');
      }
    }

    if (analysis.experienceLevel !== 'Not specified') {
      parts.push(`${analysis.experienceLevel} level position`);
    }

    if (analysis.jobType !== 'Not specified') {
      parts.push(`${analysis.jobType} role`);
    }

    if (analysis.location) {
      parts.push(`Located in ${analysis.location}`);
    }

    if (analysis.salaryRange) {
      const { min, max } = analysis.salaryRange;
      const salaryText = max > min 
        ? `$${min.toLocaleString()} - $${max.toLocaleString()}`
        : `$${min.toLocaleString()}`;
      parts.push(`Salary: ${salaryText}`);
    }

    return parts.join(' • ');
  }

  // Enhanced cover letter generation with better context understanding
  generateCoverLetterContext(jobDescription, companyName, userProfile) {
    const analysis = this.analyzeJobDescription(jobDescription, userProfile?.skills || []);
    
    return {
      companyName,
      jobAnalysis: analysis,
      relevantSkills: analysis.skillsMatch.slice(0, 5), // Top 5 matching skills
      experienceLevel: analysis.experienceLevel,
      jobType: analysis.jobType,
      location: analysis.location,
      keyRequirements: this.extractKeyRequirements(jobDescription),
      userStrengths: this.identifyUserStrengths(userProfile, analysis.skillsMatch)
    };
  }

  extractKeyRequirements(description) {
    const requirements = [];
    const requirementPatterns = [
      /(?:requirements?|qualifications?|must have|required):\s*([^.!?]*)/gi,
      /(?:we are looking for|seeking|ideal candidate):\s*([^.!?]*)/gi,
      /(?:responsible for|duties include|will be):\s*([^.!?]*)/gi
    ];

    requirementPatterns.forEach(pattern => {
      const matches = [...description.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 10) {
          requirements.push(match[1].trim());
        }
      });
    });

    return requirements.slice(0, 3); // Top 3 requirements
  }

  identifyUserStrengths(userProfile, matchedSkills) {
    const strengths = [];
    
    if (userProfile?.workExperience?.length > 0) {
      const latestJob = userProfile.workExperience[0];
      strengths.push(`${latestJob.jobTitle} at ${latestJob.companyName}`);
    }

    if (matchedSkills.length > 0) {
      strengths.push(`Expertise in ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    if (userProfile?.education?.length > 0) {
      const education = userProfile.education[0];
      strengths.push(`${education.degree} from ${education.schoolName}`);
    }

    return strengths;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoJobrNLP;
} else {
  window.AutoJobrNLP = AutoJobrNLP;
}