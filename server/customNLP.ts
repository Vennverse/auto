// Custom NLP Service for Job Analysis
// Replaces Groq dependency with native text processing

interface JobAnalysisResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  skillGaps: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
  seniorityLevel: string;
  workMode: string;
  jobType: string;
  roleComplexity: string;
  careerProgression: string;
  industryFit: string;
  cultureFit: string;
  applicationRecommendation: string;
  tailoringAdvice: string;
  interviewPrepTips: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  extractedData: {
    title: string;
    company: string;
    location: string;
    requiredSkills: string[];
    qualifications: string[];
    benefits: string[];
  };
}

export class CustomNLPService {
  
  // Technical skill patterns for matching
  private technicalSkills = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'scala', 'kotlin', 'swift', 'dart',
    
    // Web Technologies
    'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'gatsby', 'ember', 'backbone', 'jquery',
    'html', 'css', 'scss', 'sass', 'less', 'bootstrap', 'tailwind', 'materialui', 'chakraui',
    
    // Backend/Server
    'nodejs', 'express', 'nestjs', 'fastify', 'koa', 'spring', 'django', 'flask', 'rails', 'laravel', 'symfony',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sqlite', 'oracle',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible',
    
    // Tools & Frameworks
    'git', 'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'selenium', 'postman',
    
    // Mobile
    'react native', 'flutter', 'ionic', 'xamarin', 'android', 'ios', 'swift', 'kotlin',
    
    // Data Science
    'pandas', 'numpy', 'scipy', 'tensorflow', 'pytorch', 'scikit-learn', 'r', 'matlab', 'tableau', 'powerbi'
  ];

  private softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical thinking', 'creativity',
    'adaptability', 'time management', 'project management', 'mentoring', 'collaboration', 'negotiation'
  ];

  private experienceLevels = {
    'junior|entry|graduate|intern': 'Entry Level',
    'mid|intermediate|associate': 'Mid Level', 
    'senior|lead|principal': 'Senior Level',
    'manager|director|vp|cto|ceo': 'Executive Level'
  };

  private workModeKeywords = {
    'remote|work from home|wfh|distributed': 'Remote',
    'hybrid|flexible|mix': 'Hybrid',
    'onsite|office|in-person': 'Onsite',
    'contract|freelance|consulting': 'Contract'
  };

  extractJobData(jobDescription: string): JobAnalysisResult['extractedData'] {
    const text = jobDescription.toLowerCase();
    
    // Extract title
    const titlePatterns = [
      /(?:position|role|job title|title):\s*([^\n]+)/i,
      /(?:hiring|seeking|looking for)(?:\s+an?\s+)?([^\n]+?)(?:at|with|for)/i,
      /^([^\n]+?)(?:\s*-\s*|$)/m
    ];
    
    let title = 'Software Engineer'; // default
    for (const pattern of titlePatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        title = match[1].trim();
        break;
      }
    }

    // Extract company
    const companyPatterns = [
      /(?:company|organization|employer):\s*([^\n]+)/i,
      /(?:join|at)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+as|\s+in|\s*,|\s*\.)/,
      /^([A-Z][a-zA-Z\s&]+?)\s+is\s+(?:hiring|seeking|looking)/m
    ];
    
    let company = 'Technology Company'; // default
    for (const pattern of companyPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        company = match[1].trim();
        break;
      }
    }

    // Extract location
    const locationPatterns = [
      /(?:location|based in|office in):\s*([^\n]+)/i,
      /([A-Za-z\s,]+(?:CA|NY|TX|FL|IL|WA|MA|CO|OR|GA|NC|VA|AZ|PA|OH|MI|MN|WI|IN|TN|MO|MD|NJ|CT|UT|NV|ID|KS|AR|MS|AL|LA|OK|SC|KY|IA|WV|NH|VT|ME|RI|DE|MT|ND|SD|WY|AK|HI))/,
      /(san francisco|new york|los angeles|chicago|boston|seattle|austin|denver|atlanta|miami|dallas|houston|phoenix|philadelphia)/i
    ];
    
    let location = 'Remote';
    for (const pattern of locationPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }

    // Extract skills
    const requiredSkills: string[] = [];
    for (const skill of this.technicalSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(jobDescription)) {
        requiredSkills.push(skill);
      }
    }

    for (const skill of this.softSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(jobDescription)) {
        requiredSkills.push(skill);
      }
    }

    // Extract qualifications
    const qualificationPatterns = [
      /(?:requirements?|qualifications?):(.*?)(?:\n\n|\n[A-Z]|$)/is,
      /(?:must have|required):(.*?)(?:\n\n|\n[A-Z]|$)/is,
      /bachelor|master|phd|degree|years?.*experience/gi
    ];

    const qualifications: string[] = [];
    for (const pattern of qualificationPatterns) {
      const matches = jobDescription.match(pattern);
      if (matches) {
        const quals = matches[0].split(/[•\n-]/).filter(q => q.trim().length > 10);
        qualifications.push(...quals.map(q => q.trim()));
      }
    }

    // Extract benefits
    const benefitKeywords = [
      'health insurance', 'dental', 'vision', '401k', 'retirement', 'pto', 'vacation',
      'work from home', 'flexible hours', 'equity', 'stock options', 'bonus',
      'professional development', 'conference', 'training', 'tuition'
    ];

    const benefits: string[] = [];
    for (const benefit of benefitKeywords) {
      const regex = new RegExp(`\\b${benefit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(jobDescription)) {
        benefits.push(benefit);
      }
    }

    return {
      title,
      company,
      location,
      requiredSkills: [...new Set(requiredSkills)],
      qualifications: [...new Set(qualifications)],
      benefits: [...new Set(benefits)]
    };
  }

  calculateMatchScore(userSkills: string[], jobSkills: string[], userExperience: any[]): number {
    let score = 0;
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

    // Skill matching (60% of score)
    const matchingSkills = jobSkillsLower.filter(jobSkill => 
      userSkillsLower.some(userSkill => 
        userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
      )
    );
    
    const skillScore = jobSkillsLower.length > 0 ? 
      (matchingSkills.length / jobSkillsLower.length) * 60 : 30;
    score += skillScore;

    // Experience relevance (40% of score)
    const experienceScore = Math.min(userExperience.length * 10, 40);
    score += experienceScore;

    return Math.min(Math.round(score), 100);
  }

  identifySkillGaps(userSkills: string[], jobSkills: string[]): JobAnalysisResult['skillGaps'] {
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const missingSkills = jobSkills.filter(jobSkill => 
      !userSkillsLower.some(userSkill => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase()) || 
        jobSkill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    // Categorize missing skills by importance
    const critical: string[] = [];
    const important: string[] = [];
    const nice_to_have: string[] = [];

    const criticalKeywords = ['required', 'must have', 'essential', 'mandatory'];
    const importantKeywords = ['preferred', 'desired', 'plus', 'advantage'];

    for (const skill of missingSkills) {
      const skillLower = skill.toLowerCase();
      if (this.technicalSkills.some(ts => ts.includes(skillLower) || skillLower.includes(ts))) {
        if (criticalKeywords.some(kw => jobSkills.join(' ').toLowerCase().includes(kw))) {
          critical.push(skill);
        } else if (importantKeywords.some(kw => jobSkills.join(' ').toLowerCase().includes(kw))) {
          important.push(skill);
        } else {
          important.push(skill);
        }
      } else {
        nice_to_have.push(skill);
      }
    }

    return { critical, important, nice_to_have };
  }

  determineWorkMode(jobDescription: string): string {
    const text = jobDescription.toLowerCase();
    
    for (const [keywords, mode] of Object.entries(this.workModeKeywords)) {
      const patterns = keywords.split('|');
      if (patterns.some(pattern => text.includes(pattern))) {
        return mode;
      }
    }
    
    return 'Not specified';
  }

  determineSeniorityLevel(jobDescription: string, userExperience: number): string {
    const text = jobDescription.toLowerCase();
    
    for (const [patterns, level] of Object.entries(this.experienceLevels)) {
      const keywords = patterns.split('|');
      if (keywords.some(keyword => text.includes(keyword))) {
        return level;
      }
    }

    // Fallback based on user experience
    if (userExperience >= 8) return 'Senior Level';
    if (userExperience >= 3) return 'Mid Level';
    return 'Entry Level';
  }

  extractSalaryInfo(jobDescription: string): JobAnalysisResult['salary'] | undefined {
    const salaryPatterns = [
      /\$(\d{2,3}),?(\d{3})\s*-\s*\$(\d{2,3}),?(\d{3})/,
      /(\d{2,3})k?\s*-\s*(\d{2,3})k/i,
      /salary.*?\$(\d{2,3}),?(\d{3})/i
    ];

    for (const pattern of salaryPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        let min, max;
        if (match[1] && match[3]) {
          min = parseInt(match[1] + (match[2] || '000'));
          max = parseInt(match[3] + (match[4] || '000'));
        } else if (match[1] && match[2]) {
          min = parseInt(match[1]) * 1000;
          max = parseInt(match[2]) * 1000;
        }
        
        if (min && max) {
          return { min, max, currency: 'USD' };
        }
      }
    }

    return undefined;
  }

  generateTailoringAdvice(matchingSkills: string[], missingSkills: string[]): string {
    const advice = [];
    
    if (matchingSkills.length > 0) {
      advice.push(`Highlight your experience with: ${matchingSkills.slice(0, 5).join(', ')}`);
    }
    
    if (missingSkills.length > 0) {
      advice.push(`Consider gaining experience in: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    
    advice.push('Quantify your achievements with specific metrics and results');
    advice.push('Customize your resume summary to match the job requirements');
    
    return advice.join('. ');
  }

  generateInterviewTips(jobData: JobAnalysisResult['extractedData'], userSkills: string[]): string {
    const tips = [];
    
    tips.push(`Research ${jobData.company} thoroughly including recent news and company culture`);
    
    if (jobData.requiredSkills.length > 0) {
      tips.push(`Prepare examples demonstrating your experience with: ${jobData.requiredSkills.slice(0, 3).join(', ')}`);
    }
    
    tips.push('Practice the STAR method for behavioral questions');
    tips.push('Prepare questions about team structure, growth opportunities, and company challenges');
    tips.push('Review fundamental concepts in your primary technical skills');
    
    return tips.join('. ');
  }

  analyzeJob(jobDescription: string, userProfile: any): JobAnalysisResult {
    const extractedData = this.extractJobData(jobDescription);
    const userSkills = userProfile.skills?.map((s: any) => s.skillName || s) || [];
    const userExperience = userProfile.workExperience || [];
    const yearsExperience = userProfile.yearsExperience || 0;

    const matchScore = this.calculateMatchScore(userSkills, extractedData.requiredSkills, userExperience);
    
    const matchingSkills = extractedData.requiredSkills.filter(jobSkill => 
      userSkills.some((userSkill: string) => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase()) || 
        jobSkill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const missingSkills = extractedData.requiredSkills.filter(jobSkill => 
      !userSkills.some((userSkill: string) => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase()) || 
        jobSkill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const skillGaps = this.identifySkillGaps(userSkills, extractedData.requiredSkills);
    const workMode = this.determineWorkMode(jobDescription);
    const seniorityLevel = this.determineSeniorityLevel(jobDescription, yearsExperience);
    const salary = this.extractSalaryInfo(jobDescription);

    // Determine application recommendation
    let applicationRecommendation = 'recommended';
    if (matchScore >= 80) applicationRecommendation = 'strongly_recommended';
    else if (matchScore >= 60) applicationRecommendation = 'recommended';
    else if (matchScore >= 40) applicationRecommendation = 'consider_with_preparation';
    else applicationRecommendation = 'needs_development';

    return {
      matchScore,
      matchingSkills,
      missingSkills,
      skillGaps,
      seniorityLevel,
      workMode,
      jobType: 'Full-time', // default
      roleComplexity: matchScore >= 70 ? 'Advanced' : matchScore >= 50 ? 'Standard' : 'Basic',
      careerProgression: matchScore >= 60 ? 'Good opportunity' : 'Consider skill development',
      industryFit: matchScore >= 70 ? 'Excellent' : matchScore >= 50 ? 'Good' : 'Needs research',
      cultureFit: 'Research needed',
      applicationRecommendation,
      tailoringAdvice: this.generateTailoringAdvice(matchingSkills, missingSkills),
      interviewPrepTips: this.generateInterviewTips(extractedData, userSkills),
      salary,
      extractedData
    };
  }
}

export const customNLPService = new CustomNLPService();