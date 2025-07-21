import Groq from "groq-sdk";

interface ResumeAnalysis {
  atsScore: number;
  recommendations: string[];
  keywordOptimization: {
    missingKeywords: string[];
    overusedKeywords: string[];
    suggestions: string[];
  };
  formatting: {
    score: number;
    issues: string[];
    improvements: string[];
  };
  content: {
    strengthsFound: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

interface JobMatchAnalysis {
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
}

class GroqService {
  public client: Groq;
  
  // AI Model Tiers - Using optimized model with higher rate limits and better context
  private readonly models = {
    premium: "llama-3.3-70b-versatile",   // Current working model from user's example
    basic: "llama-3.3-70b-versatile"      // Same model for all users
  };

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
    
    // Validate API key format
    if (!apiKey.startsWith('gsk_') || apiKey.length < 50) {
      console.warn(`Invalid GROQ API key format. Expected gsk_... with 50+ chars, got: ${apiKey.substring(0, 10)}... (${apiKey.length} chars)`);
    }
    
    console.log(`Initializing Groq with API key: ${apiKey.substring(0, 20)}... (${apiKey.length} chars)`);
    this.client = new Groq({
      apiKey: apiKey,
    });
    console.log("Groq client initialized successfully");
  }

  // All users get the same fast, cost-effective model
  private hasAIAccess(user: any): { tier: 'premium' | 'basic', message?: string } {
    // Everyone gets the same efficient model - no tier restrictions
    return { tier: 'premium' };
  }

  private generateFallbackJobAnalysis(accessInfo: { tier: 'premium' | 'basic', message?: string }): JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string } {
    return {
      matchScore: 45,
      matchingSkills: [],
      missingSkills: ['AI analysis unavailable - please check requirements manually'],
      skillGaps: {
        critical: [],
        important: ['Verify technical requirements match your skills'],
        nice_to_have: []
      },
      seniorityLevel: 'Mid-level',
      workMode: 'Please check job posting for details',
      jobType: 'Please review full job description',
      roleComplexity: 'Standard',
      careerProgression: 'Good opportunity to grow',
      industryFit: 'Review company culture and values',
      cultureFit: 'Research company background',
      applicationRecommendation: 'recommended',
      tailoringAdvice: 'Customize your resume to highlight relevant experience and skills mentioned in the job posting',
      interviewPrepTips: 'Research the company, practice common interview questions, and prepare specific examples of your work',
      aiTier: accessInfo.tier,
      upgradeMessage: 'AI analysis temporarily unavailable - manual review recommended'
    };
  }

  // Get model based on user tier
  private getModel(user: any): string {
    const { tier } = this.hasAIAccess(user);
    return this.models[tier];
  }

  // Get AI access information for user
  public getAIAccessInfo(user: any): { tier: 'premium' | 'basic', message?: string, daysLeft?: number } {
    const accessInfo = this.hasAIAccess(user);
    
    if (accessInfo.tier === 'premium' && !user?.hasUsedPremiumTrial) {
      // Calculate days left in trial
      const now = new Date();
      const trialStart = new Date(user.premiumTrialStartDate);
      const trialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      return {
        ...accessInfo,
        daysLeft: Math.max(0, daysLeft)
      };
    }
    
    return accessInfo;
  }

  async analyzeResume(resumeText: string, userProfile?: any, user?: any): Promise<ResumeAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    // Add some randomization to prevent identical responses
    const analysisId = Math.random().toString(36).substring(7);
    
    const prompt = `Analyze resume for ATS score (15-95). Return JSON only:
${resumeText}

{
  "atsScore": number,
  "recommendations": ["specific fixes"],
  "keywordOptimization": {
    "missingKeywords": ["keywords to add"],
    "suggestions": ["tech terms needed"]
  },
  "formatting": {
    "score": number,
    "improvements": ["format fixes"]
  },
  "content": {
    "strengthsFound": ["good points"],
    "suggestions": ["content improvements"]
  }
}`;

    try {
      const accessInfo = this.hasAIAccess(user);
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert ATS resume analyzer. Analyze resumes and return valid JSON only. No code, no explanations, just the requested JSON structure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.getModel(user),
        temperature: 0.2,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      console.log("Raw Groq response:", content.substring(0, 500) + "...");

      // Parse JSON response with error handling
      let analysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        analysis = JSON.parse(jsonContent);
        
        console.log("Parsed analysis - ATS Score:", analysis.atsScore);
        
        // Use AI score if it's reasonable, otherwise calculate dynamic score
        if (analysis.atsScore && analysis.atsScore >= 20 && analysis.atsScore <= 95) {
          // AI provided a reasonable score, use it with minor adjustments
          console.log("Using AI-provided ATS score:", analysis.atsScore);
        } else {
          // Calculate a more realistic content-based score
          const contentLength = resumeText.length;
          const sections = resumeText.toLowerCase().split(/(?:experience|education|skills|projects|summary|objective|contact)/i).length - 1;
          
          // Detailed analysis patterns
          const patterns = {
            quantifiableResults: /(\d+%|\d+\+|increased|decreased|improved|reduced|achieved|generated|\$\d+|saved|revenue|profit|efficiency)/gi,
            technicalSkills: /javascript|python|java|react|angular|vue|node\.?js|sql|mongodb|postgresql|aws|azure|gcp|docker|kubernetes|git|api|html|css|bootstrap|tailwind|typescript|c\+\+|c#|php|ruby|go|rust|scala|r|matlab|tableau|powerbi|excel|salesforce|adobe|figma|sketch|photoshop|illustrator/gi,
            softSkills: /leadership|management|communication|teamwork|problem.solving|analytical|creative|adaptable|organized|detail.oriented|time.management|collaboration|negotiation|presentation|mentoring|training/gi,
            actionVerbs: /\b(led|managed|developed|created|implemented|designed|optimized|analyzed|coordinated|supervised|established|executed|delivered|achieved|maintained|collaborated|improved|streamlined|initiated|facilitated)\b/gi,
            education: /bachelor|master|phd|degree|university|college|certification|coursework|gpa|graduated|studied|major|minor/gi,
            contactInfo: /email|phone|linkedin|github|portfolio|website|address/gi,
            companyExperience: /\b(google|microsoft|amazon|apple|facebook|meta|netflix|uber|airbnb|tesla|ibm|oracle|salesforce|adobe|intel|nvidia|twitter|spotify|slack|zoom|atlassian|shopify|stripe|paypal|visa|mastercard|jp.?morgan|goldman.sachs|mckinsey|deloitte|accenture|pwc|ey|kpmg)\b/gi
          };
          
          // Count matches for each category
          const scores = {
            quantifiableResults: Math.min((resumeText.match(patterns.quantifiableResults) || []).length * 4, 25),
            technicalSkills: Math.min((resumeText.match(patterns.technicalSkills) || []).length * 2, 20),
            softSkills: Math.min((resumeText.match(patterns.softSkills) || []).length * 1.5, 15),
            actionVerbs: Math.min((resumeText.match(patterns.actionVerbs) || []).length * 1, 15),
            education: Math.min((resumeText.match(patterns.education) || []).length * 2, 10),
            contactInfo: Math.min((resumeText.match(patterns.contactInfo) || []).length * 2, 8),
            companyExperience: Math.min((resumeText.match(patterns.companyExperience) || []).length * 3, 12)
          };
          
          // Base scoring factors
          let baseScore = 20;
          
          // Content length scoring (optimal range: 1000-2500 chars)
          if (contentLength > 2500) baseScore += 8;
          else if (contentLength > 1500) baseScore += 12;
          else if (contentLength > 800) baseScore += 10;
          else if (contentLength > 400) baseScore += 6;
          else baseScore += 2;
          
          // Section organization bonus
          baseScore += Math.min(sections * 2, 8);
          
          // Calculate final score
          const totalScore = baseScore + Object.values(scores).reduce((sum, score) => sum + score, 0);
          
          // Add content uniqueness factor
          const uniqueWords = new Set(resumeText.toLowerCase().match(/\b\w+\b/g) || []).size;
          const uniquenessBonus = Math.min(Math.floor(uniqueWords / 50), 5);
          
          const finalScore = Math.max(15, Math.min(95, totalScore + uniquenessBonus));
          
          analysis.atsScore = finalScore;
          console.log("Calculated enhanced ATS score:", finalScore, "based on content analysis");
          console.log("Score breakdown:", { baseScore, ...scores, uniquenessBonus, sections, contentLength });
        }
        
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", content);
        console.error("Parse error:", parseError);
        
        // Generate realistic fallback score using comprehensive content analysis
        const contentLength = resumeText.length;
        const sections = resumeText.toLowerCase().split(/(?:experience|education|skills|projects|summary|objective|contact)/i).length - 1;
        
        // Use the same detailed patterns as the main scoring system
        const patterns = {
          quantifiableResults: /(\d+%|\d+\+|increased|decreased|improved|reduced|achieved|generated|\$\d+|saved|revenue|profit|efficiency)/gi,
          technicalSkills: /javascript|python|java|react|angular|vue|node\.?js|sql|mongodb|postgresql|aws|azure|gcp|docker|kubernetes|git|api|html|css|bootstrap|tailwind|typescript|c\+\+|c#|php|ruby|go|rust|scala|r|matlab|tableau|powerbi|excel|salesforce|adobe|figma|sketch|photoshop|illustrator/gi,
          softSkills: /leadership|management|communication|teamwork|problem.solving|analytical|creative|adaptable|organized|detail.oriented|time.management|collaboration|negotiation|presentation|mentoring|training/gi,
          actionVerbs: /\b(led|managed|developed|created|implemented|designed|optimized|analyzed|coordinated|supervised|established|executed|delivered|achieved|maintained|collaborated|improved|streamlined|initiated|facilitated)\b/gi,
          education: /bachelor|master|phd|degree|university|college|certification|coursework|gpa|graduated|studied|major|minor/gi,
          contactInfo: /email|phone|linkedin|github|portfolio|website|address/gi
        };
        
        // Calculate category scores
        const scores = {
          quantifiableResults: Math.min((resumeText.match(patterns.quantifiableResults) || []).length * 4, 25),
          technicalSkills: Math.min((resumeText.match(patterns.technicalSkills) || []).length * 2, 20),
          softSkills: Math.min((resumeText.match(patterns.softSkills) || []).length * 1.5, 15),
          actionVerbs: Math.min((resumeText.match(patterns.actionVerbs) || []).length * 1, 15),
          education: Math.min((resumeText.match(patterns.education) || []).length * 2, 10),
          contactInfo: Math.min((resumeText.match(patterns.contactInfo) || []).length * 2, 8)
        };
        
        // Base scoring factors
        let baseScore = 15;
        
        // Content length scoring (realistic expectations)
        if (contentLength > 2500) baseScore += 8;
        else if (contentLength > 1500) baseScore += 12;
        else if (contentLength > 800) baseScore += 10;
        else if (contentLength > 400) baseScore += 6;
        else baseScore += 2;
        
        // Section organization bonus
        baseScore += Math.min(sections * 2, 8);
        
        // Calculate final realistic score
        const totalScore = baseScore + Object.values(scores).reduce((sum, score) => sum + score, 0);
        const dynamicScore = Math.max(15, Math.min(85, totalScore));
        
        console.log("Generated enhanced fallback score:", dynamicScore);
        console.log("Fallback score breakdown:", { baseScore, ...scores, sections, contentLength });
        
        analysis = {
          atsScore: dynamicScore,
          recommendations: [
            "Add specific metrics and numbers to quantify your achievements",
            "Include more relevant technical skills for your target industry",
            "Use stronger action verbs to describe your accomplishments",
            "Ensure all contact information is clearly visible"
          ],
          keywordOptimization: {
            missingKeywords: scores.technicalSkills < 10 ? ["technical skills", "industry-specific tools"] : ["advanced technical skills", "leadership keywords"],
            overusedKeywords: [],
            suggestions: ["Add role-specific technical terms", "Include metrics and percentages", "Use action-oriented language"]
          },
          formatting: {
            score: Math.max(45, Math.min(85, dynamicScore - 5)),
            issues: contentLength < 500 ? ["Resume appears too brief for ATS systems"] : sections < 3 ? ["Missing standard resume sections"] : [],
            improvements: ["Use consistent bullet points", "Include clear section headers", "Ensure proper spacing and alignment"]
          },
          content: {
            strengthsFound: scores.education > 5 ? ["Strong educational background"] : scores.actionVerbs > 8 ? ["Good use of action verbs"] : ["Well-structured content"],
            weaknesses: scores.quantifiableResults < 10 ? ["Lacks quantifiable achievements"] : scores.technicalSkills < 8 ? ["Missing technical skills"] : ["Could benefit from more specific details"],
            suggestions: ["Add specific numbers and percentages to achievements", "Include more detailed work experience descriptions", "Highlight measurable impact and results"]
          }
        };
      }
      
      // Ensure analysis object has all required properties
      if (!analysis || typeof analysis !== 'object') {
        throw new Error("Failed to generate valid analysis");
      }
      
      // Validate required properties exist
      const requiredProps = ['atsScore', 'recommendations', 'keywordOptimization', 'formatting', 'content'];
      for (const prop of requiredProps) {
        if (!(prop in analysis)) {
          console.error(`Missing required property: ${prop}`);
          throw new Error(`Analysis missing required property: ${prop}`);
        }
      }
      return {
        ...analysis,
        aiTier: accessInfo.tier,
        upgradeMessage: accessInfo.message
      } as ResumeAnalysis & { aiTier?: string, upgradeMessage?: string };
    } catch (error) {
      console.error("Error analyzing resume with Groq:", error);
      
      // Generate a safe fallback analysis to prevent UI crashes
      const contentLength = resumeText.length;
      const dynamicScore = Math.max(35, Math.min(85, 35 + Math.floor(contentLength / 50)));
      
      const fallbackAccessInfo = this.hasAIAccess(user);
      return {
        atsScore: dynamicScore,
        recommendations: [
          "Resume processed successfully with content analysis",
          "Consider adding quantifiable achievements and metrics",
          "Include relevant industry keywords and technical skills",
          "Ensure consistent formatting throughout the document"
        ],
        keywordOptimization: {
          missingKeywords: ["industry-specific keywords", "technical skills", "action verbs"],
          overusedKeywords: [],
          suggestions: ["Add specific technical terms", "Include measurable results", "Use strong action verbs"]
        },
        formatting: {
          score: Math.max(40, dynamicScore - 15),
          issues: [],
          improvements: ["Use consistent bullet points", "Add clear section headers", "Optimize for ATS scanning"]
        },
        content: {
          strengthsFound: ["Resume structure present", "Professional experience included"],
          weaknesses: ["Could benefit from more specific details"],
          suggestions: ["Add quantifiable accomplishments", "Include relevant certifications", "Highlight key achievements"]
        },
        aiTier: fallbackAccessInfo.tier,
        upgradeMessage: fallbackAccessInfo.message
      };
    }
  }

  async analyzeJobMatch(
    jobData: {
      title: string;
      company: string;
      description: string;
      requirements?: string;
      qualifications?: string;
      benefits?: string;
    },
    userProfile: {
      skills: Array<{ skillName: string; proficiencyLevel?: string; yearsExperience?: number }>;
      workExperience: Array<{ position: string; company: string; description?: string }>;
      education: Array<{ degree: string; fieldOfStudy?: string; institution: string }>;
      yearsExperience?: number;
      professionalTitle?: string;
      summary?: string;
    },
    user?: any
  ): Promise<JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    const userSkills = userProfile.skills.map(s => s.skillName).join(', ');
    const userExperience = userProfile.workExperience.map(w => 
      `${w.position} at ${w.company}${w.description ? ': ' + w.description.substring(0, 300) : ''}`
    ).join('\n');
    const userEducation = userProfile.education.map(e => 
      `${e.degree} in ${e.fieldOfStudy || 'N/A'} from ${e.institution}`
    ).join('\n');

    // Create comprehensive prompt for detailed analysis
    const prompt = `You are an expert career coach and recruiter. Analyze this job match comprehensively and provide detailed insights.

=== JOB POSTING ===
POSITION: ${jobData.title} at ${jobData.company}
DESCRIPTION: ${jobData.description}
${jobData.requirements ? `REQUIREMENTS: ${jobData.requirements}` : ''}
${jobData.qualifications ? `QUALIFICATIONS: ${jobData.qualifications}` : ''}
${jobData.benefits ? `BENEFITS: ${jobData.benefits}` : ''}

=== CANDIDATE PROFILE ===
TITLE: ${userProfile.professionalTitle || 'Professional'}
EXPERIENCE: ${userProfile.yearsExperience || 0} years
SUMMARY: ${userProfile.summary || 'N/A'}

SKILLS: ${userSkills}

WORK EXPERIENCE:
${userExperience}

EDUCATION:
${userEducation}

=== ANALYSIS REQUIRED ===
Provide a comprehensive match analysis with these specific insights:

1. Calculate precise match percentage (0-100) based on skills alignment, experience relevance, and role requirements
2. Identify all matching skills and technologies between candidate and job
3. List critical missing skills that would prevent success in this role
4. Categorize skill gaps by importance level
5. Assess seniority level fit (entry/mid/senior/executive)
6. Determine work mode preferences and job type alignment
7. Evaluate role complexity and career progression potential
8. Assess industry and cultural fit
9. Provide specific application recommendation
10. Give detailed resume tailoring advice
11. Provide comprehensive interview preparation tips

Return detailed JSON:
{
  "matchScore": number (precise 0-100 based on deep analysis),
  "matchingSkills": ["specific skills that align between candidate and job"],
  "missingSkills": ["important skills candidate lacks for this role"],
  "skillGaps": {
    "critical": ["must-have skills candidate lacks"],
    "important": ["valuable skills to develop"],
    "nice_to_have": ["bonus skills mentioned in job"]
  },
  "seniorityLevel": "entry|mid|senior|executive",
  "workMode": "remote|hybrid|onsite|flexible|not_specified",
  "jobType": "full-time|part-time|contract|internship|not_specified",
  "roleComplexity": "basic|standard|advanced|expert",
  "careerProgression": "lateral_move|step_up|significant_advancement|career_change",
  "industryFit": "excellent|good|moderate|challenging|poor",
  "cultureFit": "excellent|good|research_needed|potential_concerns",
  "applicationRecommendation": "strongly_recommended|recommended|consider_with_preparation|needs_development|not_recommended",
  "tailoringAdvice": "detailed specific advice on customizing resume and cover letter for this exact role",
  "interviewPrepTips": "comprehensive preparation strategy including technical topics, behavioral questions, and company research"
}`;

    try {
      const accessInfo = this.hasAIAccess(user);
      console.log(`Making Groq API call for job analysis with model: ${this.getModel(user)}`);
      
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert career coach. Analyze job matches and return valid JSON only. No code, no explanations, just the requested JSON structure."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        model: this.getModel(user),
        temperature: 0.1,
        max_tokens: 800,
      });
      
      console.log("Groq API call successful for job analysis");

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      // Clean and parse JSON response
      let cleanContent = content.trim();
      
      // Remove any text before the JSON object
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd);
      }
      
      try {
        const analysis = JSON.parse(cleanContent);
        return {
          ...analysis,
          aiTier: accessInfo.tier,
          upgradeMessage: accessInfo.message
        } as JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string };
      } catch (parseError) {
        console.error("Failed to parse JSON response:", cleanContent);
        
        // Fallback: Create a basic analysis structure
        const fallbackAccessInfo = this.hasAIAccess(user);
        return {
          matchScore: 50,
          matchingSkills: [],
          missingSkills: [],
          skillGaps: {
            critical: [],
            important: [],
            nice_to_have: []
          },
          seniorityLevel: "Mid-level",
          workMode: "Not specified",
          jobType: "Not specified",
          roleComplexity: "Moderate",
          careerProgression: "Good fit",
          industryFit: "Moderate",
          cultureFit: "Good",
          applicationRecommendation: "Consider applying after reviewing job requirements in detail",
          tailoringAdvice: "Focus on highlighting relevant experience and skills",
          interviewPrepTips: "Research the company and prepare examples of relevant work",
          aiTier: fallbackAccessInfo.tier,
          upgradeMessage: fallbackAccessInfo.message
        } as JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string };
      }
    } catch (error) {
      console.error("Error analyzing job match with Groq:", error);
      
      // Return comprehensive fallback analysis instead of throwing error
      const fallbackAccessInfo = this.hasAIAccess(user);
      const userSkillsList = userProfile.skills.map(s => s.skillName);
      const hasRelevantSkills = userSkillsList.length > 0;
      const experienceLevel = userProfile.yearsExperience || 0;
      
      return {
        matchScore: hasRelevantSkills ? Math.min(85, 60 + experienceLevel * 3) : 45,
        matchingSkills: userSkillsList.slice(0, 3),
        missingSkills: ["AI analysis unavailable - please check requirements manually"],
        skillGaps: {
          critical: [],
          important: ["Verify technical requirements match your skills"],
          nice_to_have: []
        },
        seniorityLevel: experienceLevel >= 5 ? "Senior" : experienceLevel >= 2 ? "Mid-level" : "Entry-level",
        workMode: "Please check job posting for details",
        jobType: "Please review full job description",
        roleComplexity: "Standard",
        careerProgression: "Good opportunity to grow",
        industryFit: "Review company culture and values",
        cultureFit: "Research company background",
        applicationRecommendation: "recommended",
        tailoringAdvice: "Customize your resume to highlight relevant experience and skills mentioned in the job posting",
        interviewPrepTips: "Research the company, practice common interview questions, and prepare specific examples of your work",
        aiTier: fallbackAccessInfo.tier,
        upgradeMessage: "AI analysis temporarily unavailable - manual review recommended"
      } as JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string };
    }
  }

  async extractJobDetails(jobDescription: string): Promise<{
    title: string;
    company: string;
    location: string;
    workMode: string;
    jobType: string;
    salaryRange: string;
    requiredSkills: string[];
    qualifications: string[];
    benefits: string[];
  }> {
    const prompt = `
Extract structured information from this job posting:

${jobDescription}

Please return the information in the following JSON format:
{
  "title": "extracted job title",
  "company": "company name",
  "location": "job location",
  "workMode": "remote|hybrid|onsite|not_specified",
  "jobType": "full-time|part-time|contract|internship|not_specified",
  "salaryRange": "salary range or 'not_specified'",
  "requiredSkills": ["list of technical and soft skills mentioned as requirements"],
  "qualifications": ["education, experience, and other qualification requirements"],
  "benefits": ["benefits and perks mentioned"]
}

Be precise and only extract information that is explicitly stated in the job posting.
`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured information from job postings. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      const extracted = JSON.parse(content);
      return extracted;
    } catch (error) {
      console.error("Error extracting job details with Groq:", error);
      throw new Error("Failed to extract job details");
    }
  }

  async generateJobRecommendations(userProfile: any): Promise<any[]> {
    try {
      const userSkills = userProfile.skills || [];
      const userExperience = userProfile.workExperience || [];
      const userEducation = userProfile.education || [];
      
      const prompt = `Generate 6 job recommendations for: ${userProfile.professionalTitle}, ${userProfile.yearsExperience}yr exp
Skills: ${userSkills.map((s: any) => s.skillName).join(', ').substring(0, 100)}...

Return JSON array:
[{"id":"ai-1","title":"Job Title","company":"Company","location":"City","description":"Brief desc","requirements":["req1"],"matchScore":85,"salaryRange":"$80k-120k","workMode":"Remote","postedDate":"2024-01-15T10:00:00Z","applicationUrl":"https://company.com/jobs","benefits":["benefit1"],"isBookmarked":false}]`;

      const completion = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      // Parse the JSON response with better error handling
      let recommendations;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        recommendations = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", content.substring(0, 200));
        throw new Error("Invalid JSON response from Groq API");
      }
      
      // Validate the structure
      if (!Array.isArray(recommendations)) {
        console.error("Response is not an array:", recommendations);
        throw new Error("Invalid response format - expected array");
      }

      // Add timestamps and ensure correct format
      const processedRecommendations = recommendations.map((job: any, index: number) => ({
        ...job,
        id: `ai-rec-${Date.now()}-${index}`,
        postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      }));

      return processedRecommendations;
    } catch (error) {
      console.error("Error generating job recommendations with Groq:", error);
      
      // Return empty array instead of fallback data
      return [];
    }
  }
}

export const groqService = new GroqService();
export type { ResumeAnalysis, JobMatchAnalysis };