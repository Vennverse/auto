import Groq from 'groq-sdk';

interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number; // 0-100
  indicators: string[];
  humanScore: number; // 0-100, higher = more human-like
  reasoning: string;
}

interface ResponseAnalysis {
  originalAnalysis: any;
  aiDetection: AIDetectionResult;
  finalScore: number; // Adjusted score considering AI usage
  partialResultsOnly: boolean; // Flag for recruiters
}

export class AIDetectionService {
  private groq: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is required for AI detection");
    }
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async detectAIUsage(userResponse: string, questionContext?: string): Promise<AIDetectionResult> {
    // Quick checks for obvious AI patterns
    const quickIndicators = this.performQuickChecks(userResponse);
    
    if (quickIndicators.isObvious) {
      return {
        isAIGenerated: true,
        confidence: 95,
        indicators: quickIndicators.indicators,
        humanScore: 5,
        reasoning: "Contains obvious AI-generated patterns"
      };
    }

    // Use Groq for detailed analysis with minimal tokens
    try {
      const prompt = `Analyze if this response was AI-generated. Be concise.

Response: "${userResponse}"
${questionContext ? `Question: "${questionContext}"` : ''}

Check for:
- Unnatural phrasing/structure
- Generic AI-style responses
- Overly perfect grammar
- Typical AI patterns

Return JSON: {"aiGenerated": boolean, "confidence": 0-100, "humanScore": 0-100, "indicators": ["reason1", "reason2"], "reasoning": "brief explanation"}`;

      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Faster, cheaper model
        temperature: 0.1,
        max_tokens: 200, // Minimal tokens
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI detection response');

      const analysis = JSON.parse(this.cleanJsonResponse(content));
      
      return {
        isAIGenerated: analysis.aiGenerated || false,
        confidence: Math.min(100, Math.max(0, analysis.confidence || 50)),
        indicators: Array.isArray(analysis.indicators) ? analysis.indicators : [],
        humanScore: Math.min(100, Math.max(0, analysis.humanScore || 50)),
        reasoning: analysis.reasoning || 'Standard AI detection analysis'
      };
    } catch (error) {
      console.error('AI detection error:', error);
      // Fallback to pattern-based detection
      return this.fallbackDetection(userResponse);
    }
  }

  private performQuickChecks(response: string): { isObvious: boolean; indicators: string[] } {
    const indicators: string[] = [];
    const text = response.toLowerCase();

    // Common AI phrases
    const aiPhrases = [
      'as an ai', 'i am an ai', 'i cannot', 'i apologize, but',
      'however, it\'s important to note', 'it\'s worth noting that',
      'while i understand', 'from my training data',
      'based on my knowledge', 'in my opinion as an ai'
    ];

    // Overly structured responses
    const structurePatterns = [
      /^(first|firstly|1\.)/i,
      /\n(second|secondly|2\.)/i,
      /\n(third|thirdly|3\.)/i,
      /\n(finally|in conclusion)/i
    ];

    // Check for AI phrases
    for (const phrase of aiPhrases) {
      if (text.includes(phrase)) {
        indicators.push(`Contains AI phrase: "${phrase}"`);
      }
    }

    // Check for overly structured responses
    const structureMatches = structurePatterns.filter(pattern => pattern.test(response));
    if (structureMatches.length >= 3) {
      indicators.push('Overly structured numbered/bullet format');
    }

    // Check for excessive length relative to question complexity
    if (response.length > 800 && response.split('\n').length > 5) {
      indicators.push('Unusually detailed and structured response');
    }

    return {
      isObvious: indicators.length >= 2,
      indicators
    };
  }

  private fallbackDetection(response: string): AIDetectionResult {
    const quickCheck = this.performQuickChecks(response);
    const confidence = quickCheck.indicators.length * 25;
    
    return {
      isAIGenerated: confidence > 50,
      confidence: Math.min(100, confidence),
      indicators: quickCheck.indicators,
      humanScore: Math.max(0, 100 - confidence),
      reasoning: 'Pattern-based detection (AI analysis unavailable)'
    };
  }

  analyzeResponseWithAI(originalAnalysis: any, aiDetection: AIDetectionResult): ResponseAnalysis {
    let finalScore = originalAnalysis.overallScore || originalAnalysis.responseQuality || 0;
    let partialResultsOnly = false;

    // Apply AI penalty if detected
    if (aiDetection.isAIGenerated && aiDetection.confidence > 60) {
      // Significant penalty for likely AI usage
      finalScore = Math.max(0, finalScore * 0.3); // 70% penalty
      partialResultsOnly = true;
    } else if (aiDetection.confidence > 40) {
      // Moderate penalty for suspicious responses
      finalScore = Math.max(0, finalScore * 0.7); // 30% penalty
      partialResultsOnly = true;
    }

    return {
      originalAnalysis,
      aiDetection,
      finalScore: Math.round(finalScore),
      partialResultsOnly
    };
  }

  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks and extra whitespace
    return content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  generateRecruiterFeedback(analysis: ResponseAnalysis): string {
    if (!analysis.aiDetection.isAIGenerated) {
      return "Response appears to be human-generated.";
    }

    const confidence = analysis.aiDetection.confidence;
    let feedback = `AI Usage Detected (${confidence}% confidence)\n`;
    
    if (confidence > 80) {
      feedback += "⚠️ High likelihood of AI assistance\n";
    } else if (confidence > 60) {
      feedback += "⚠️ Moderate likelihood of AI assistance\n";
    } else {
      feedback += "⚠️ Some indicators of possible AI assistance\n";
    }

    feedback += `Indicators: ${analysis.aiDetection.indicators.join(', ')}\n`;
    feedback += `Human-like score: ${analysis.aiDetection.humanScore}/100\n`;
    feedback += `Original score: ${analysis.originalAnalysis.overallScore || 'N/A'} → Adjusted: ${analysis.finalScore}`;

    return feedback;
  }

  generateCandidateFeedback(analysis: ResponseAnalysis): string {
    if (!analysis.partialResultsOnly) {
      return ""; // No need to inform if no AI detected
    }

    return `Note: This assessment includes an AI authenticity check. Partial results shown. For complete evaluation, ensure responses reflect your personal knowledge and experience.`;
  }
}

export const aiDetectionService = new AIDetectionService();