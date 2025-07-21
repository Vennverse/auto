import { groqService } from './groqService';
import { aiDetectionService } from './aiDetectionService';

export interface QuestionType {
  id: string;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'long_answer' | 'coding' | 'scenario' | 'case_study';
  question: string;
  options?: string[];
  correctAnswer?: number | number[] | string;
  points: number;
  explanation?: string;
  domain: 'technical' | 'finance' | 'marketing' | 'sales' | 'hr' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords?: string[];
}

export interface TestSubmission {
  testTemplateId: number;
  jobSeekerId: string;
  answers: Record<string, any>;
  timeSpent: number;
  submittedAt: Date;
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionScores: Array<{
    questionId: string;
    score: number;
    maxScore: number;
    feedback: string;
    correct: boolean;
  }>;
  domainBreakdown: Record<string, {
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  recommendations: string[];
}

class TestScoringService {
  /**
   * Automatically score a test submission
   */
  async scoreTest(
    questions: QuestionType[],
    answers: Record<string, any>,
    passingScore: number = 70
  ): Promise<ScoringResult> {
    const questionScores: ScoringResult['questionScores'] = [];
    const domainScores: Record<string, { score: number; maxScore: number }> = {};
    
    let totalScore = 0;
    let maxScore = 0;

    // Process each question
    for (const question of questions) {
      const userAnswer = answers[question.id];
      const questionScore = await this.scoreQuestion(question, userAnswer);
      
      questionScores.push(questionScore);
      totalScore += questionScore.score;
      maxScore += questionScore.maxScore;

      // Track domain scores
      if (!domainScores[question.domain]) {
        domainScores[question.domain] = { score: 0, maxScore: 0 };
      }
      domainScores[question.domain].score += questionScore.score;
      domainScores[question.domain].maxScore += questionScore.maxScore;
    }

    // Calculate domain breakdown
    const domainBreakdown: Record<string, { score: number; maxScore: number; percentage: number }> = {};
    for (const [domain, scores] of Object.entries(domainScores)) {
      domainBreakdown[domain] = {
        ...scores,
        percentage: (scores.score / scores.maxScore) * 100
      };
    }

    const percentage = (totalScore / maxScore) * 100;
    const passed = percentage >= passingScore;

    // Generate recommendations
    const recommendations = await this.generateRecommendations(questionScores, domainBreakdown);

    return {
      totalScore,
      maxScore,
      percentage,
      passed,
      questionScores,
      domainBreakdown,
      recommendations
    };
  }

  /**
   * Score an individual question based on its type
   */
  private async scoreQuestion(
    question: QuestionType,
    userAnswer: any
  ): Promise<ScoringResult['questionScores'][0]> {
    switch (question.type) {
      case 'multiple_choice':
        return this.scoreMultipleChoice(question, userAnswer);
      
      case 'multiple_select':
        return this.scoreMultipleSelect(question, userAnswer);
      
      case 'true_false':
        return this.scoreTrueFalse(question, userAnswer);
      
      case 'short_answer':
        return await this.scoreShortAnswer(question, userAnswer);
      
      case 'long_answer':
        return await this.scoreLongAnswer(question, userAnswer);
      
      case 'coding':
        return await this.scoreCoding(question, userAnswer);
      
      case 'scenario':
        return await this.scoreScenario(question, userAnswer);
      
      case 'case_study':
        return await this.scoreCaseStudy(question, userAnswer);
      
      default:
        throw new Error(`Unsupported question type: ${question.type}`);
    }
  }

  /**
   * Score multiple choice questions
   */
  private scoreMultipleChoice(question: QuestionType, userAnswer: number): ScoringResult['questionScores'][0] {
    const correct = userAnswer === question.correctAnswer;
    
    return {
      questionId: question.id,
      score: correct ? question.points : 0,
      maxScore: question.points,
      feedback: correct ? 'Correct answer!' : `Incorrect. The correct answer was: ${question.options?.[question.correctAnswer as number] || 'N/A'}`,
      correct
    };
  }

  /**
   * Score multiple select questions
   */
  private scoreMultipleSelect(question: QuestionType, userAnswer: number[]): ScoringResult['questionScores'][0] {
    const correctAnswers = question.correctAnswer as number[];
    
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswers)) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        feedback: 'Invalid answer format',
        correct: false
      };
    }

    const correctCount = userAnswer.filter(answer => correctAnswers.includes(answer)).length;
    const incorrectCount = userAnswer.filter(answer => !correctAnswers.includes(answer)).length;
    const missedCount = correctAnswers.filter(answer => !userAnswer.includes(answer)).length;

    // Partial scoring: (correct - incorrect) / total correct, minimum 0
    const score = Math.max(0, (correctCount - incorrectCount) / correctAnswers.length) * question.points;
    const correct = correctCount === correctAnswers.length && incorrectCount === 0;

    return {
      questionId: question.id,
      score: Math.round(score),
      maxScore: question.points,
      feedback: correct ? 'All correct selections!' : `Partial credit: ${correctCount} correct, ${incorrectCount} incorrect, ${missedCount} missed`,
      correct
    };
  }

  /**
   * Score true/false questions
   */
  private scoreTrueFalse(question: QuestionType, userAnswer: boolean): ScoringResult['questionScores'][0] {
    const correct = userAnswer === question.correctAnswer;
    
    return {
      questionId: question.id,
      score: correct ? question.points : 0,
      maxScore: question.points,
      feedback: correct ? 'Correct!' : `Incorrect. The correct answer was: ${question.correctAnswer}`,
      correct
    };
  }

  /**
   * Score short answer questions using AI
   */
  private async scoreShortAnswer(question: QuestionType, userAnswer: string): Promise<ScoringResult['questionScores'][0]> {
    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        feedback: 'No answer provided',
        correct: false
      };
    }

    try {
      const prompt = `Score answer (0-${question.points}). Return JSON:

Q: ${question.question}
Expected: ${question.correctAnswer || 'N/A'}
Answer: ${userAnswer}

{"score": number, "feedback": "brief", "correct": boolean}`;

      const response = await groqService.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        questionId: question.id,
        score: Math.min(Math.max(0, result.score), question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Answer evaluated by AI',
        correct: result.correct || false
      };
    } catch (error) {
      console.error('Error scoring short answer:', error);
      
      // Fallback keyword matching
      const keywords = question.keywords || [];
      const answerLower = userAnswer.toLowerCase();
      const matchedKeywords = keywords.filter(keyword => 
        answerLower.includes(keyword.toLowerCase())
      );
      
      const score = Math.round((matchedKeywords.length / Math.max(keywords.length, 1)) * question.points);
      
      return {
        questionId: question.id,
        score,
        maxScore: question.points,
        feedback: `Keyword matching: ${matchedKeywords.length}/${keywords.length} keywords found`,
        correct: score >= question.points * 0.7
      };
    }
  }

  /**
   * Score long answer questions using AI
   */
  private async scoreLongAnswer(question: QuestionType, userAnswer: string): Promise<ScoringResult['questionScores'][0]> {
    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        feedback: 'No answer provided',
        correct: false
      };
    }

    try {
      const prompt = `
        As an expert evaluator in ${question.domain}, score this long answer question:

        Question: ${question.question}
        Expected Answer Guidelines: ${question.correctAnswer || 'N/A'}
        Student Answer: ${userAnswer}

        Evaluate based on:
        1. Content accuracy and depth
        2. Structure and organization
        3. Use of relevant examples
        4. Demonstration of understanding
        5. Completeness of response

        Return ONLY a JSON object with:
        {
          "score": number (0 to ${question.points}),
          "feedback": "detailed feedback with specific strengths and areas for improvement",
          "correct": boolean
        }
      `;

      const response = await groqService.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        questionId: question.id,
        score: Math.min(Math.max(0, result.score), question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Answer evaluated by AI',
        correct: result.correct || false
      };
    } catch (error) {
      console.error('Error scoring long answer:', error);
      
      // Fallback scoring based on length and keywords
      const wordCount = userAnswer.trim().split(/\s+/).length;
      const hasKeywords = question.keywords?.some(keyword => 
        userAnswer.toLowerCase().includes(keyword.toLowerCase())
      ) || false;
      
      let score = 0;
      if (wordCount >= 50) score += question.points * 0.3; // Length bonus
      if (hasKeywords) score += question.points * 0.4; // Keyword bonus
      if (wordCount >= 100) score += question.points * 0.3; // Thoroughness bonus
      
      return {
        questionId: question.id,
        score: Math.round(score),
        maxScore: question.points,
        feedback: `Fallback scoring: ${wordCount} words, keywords: ${hasKeywords ? 'present' : 'missing'}`,
        correct: score >= question.points * 0.7
      };
    }
  }

  /**
   * Score coding questions
   */
  private async scoreCoding(question: QuestionType, userAnswer: string): Promise<ScoringResult['questionScores'][0]> {
    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        feedback: 'No code provided',
        correct: false
      };
    }

    try {
      // First, detect if AI was used for the coding solution
      const aiDetection = await aiDetectionService.detectAIUsage(userAnswer, question.question);
      
      const prompt = `
        Evaluate this coding solution. Be concise.

        Problem: ${question.question}
        Code: ${userAnswer}

        Return JSON: {"score": 0-${question.points}, "feedback": "brief technical review", "correct": boolean}
      `;

      const response = await groqService.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Use cheaper model
        temperature: 0.1,
        max_tokens: 400, // Reduced tokens
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Apply AI detection analysis
      const baseScore = Math.min(Math.max(0, result.score), question.points);
      const responseAnalysis = aiDetectionService.analyzeResponseWithAI(
        { overallScore: baseScore },
        aiDetection
      );

      let feedback = result.feedback || 'Code evaluated by AI';
      
      // Add AI detection feedback for recruiters
      if (aiDetection.isAIGenerated && aiDetection.confidence > 60) {
        feedback += `\n\n[RECRUITER ONLY] ${aiDetectionService.generateRecruiterFeedback(responseAnalysis)}`;
      }

      // Add candidate feedback if AI detected
      const candidateFeedback = aiDetectionService.generateCandidateFeedback(responseAnalysis);
      if (candidateFeedback) {
        feedback += `\n\n${candidateFeedback}`;
      }
      
      return {
        questionId: question.id,
        score: responseAnalysis.finalScore,
        maxScore: question.points,
        feedback,
        correct: result.correct && !responseAnalysis.partialResultsOnly
      };
    } catch (error) {
      console.error('Error scoring coding question:', error);
      
      // Basic syntax and structure check
      const hasFunction = /function|def|class|=>/i.test(userAnswer);
      const hasLogic = /if|for|while|switch|case/i.test(userAnswer);
      const hasReturn = /return/i.test(userAnswer);
      
      let score = 0;
      if (hasFunction) score += question.points * 0.3;
      if (hasLogic) score += question.points * 0.4;
      if (hasReturn) score += question.points * 0.3;
      
      return {
        questionId: question.id,
        score: Math.round(score),
        maxScore: question.points,
        feedback: `Basic code structure check: Function: ${hasFunction}, Logic: ${hasLogic}, Return: ${hasReturn}`,
        correct: score >= question.points * 0.7
      };
    }
  }

  /**
   * Score scenario-based questions
   */
  private async scoreScenario(question: QuestionType, userAnswer: string): Promise<ScoringResult['questionScores'][0]> {
    return await this.scoreLongAnswer(question, userAnswer); // Use same logic as long answer
  }

  /**
   * Score case study questions
   */
  private async scoreCaseStudy(question: QuestionType, userAnswer: string): Promise<ScoringResult['questionScores'][0]> {
    return await this.scoreLongAnswer(question, userAnswer); // Use same logic as long answer
  }

  /**
   * Generate personalized recommendations based on performance
   */
  private async generateRecommendations(
    questionScores: ScoringResult['questionScores'],
    domainBreakdown: Record<string, { score: number; maxScore: number; percentage: number }>
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Find weak domains
    const weakDomains = Object.entries(domainBreakdown)
      .filter(([_, stats]) => stats.percentage < 60)
      .sort((a, b) => a[1].percentage - b[1].percentage);

    // Find strong domains
    const strongDomains = Object.entries(domainBreakdown)
      .filter(([_, stats]) => stats.percentage >= 80)
      .sort((a, b) => b[1].percentage - a[1].percentage);

    // Domain-specific recommendations
    for (const [domain, stats] of weakDomains) {
      const domainAdvice = this.getDomainAdvice(domain, stats.percentage);
      recommendations.push(domainAdvice);
    }

    // Question-specific recommendations
    const incorrectQuestions = questionScores.filter(q => !q.correct);
    if (incorrectQuestions.length > 0) {
      recommendations.push(
        `Review ${incorrectQuestions.length} incorrect questions and focus on understanding the concepts behind them.`
      );
    }

    // Positive reinforcement
    if (strongDomains.length > 0) {
      recommendations.push(
        `Great work in ${strongDomains.map(([domain]) => domain).join(', ')}! Continue building on these strengths.`
      );
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Get domain-specific advice
   */
  private getDomainAdvice(domain: string, percentage: number): string {
    const domainAdvice = {
      technical: `Focus on strengthening your technical skills through coding practice, algorithm study, and staying updated with latest technologies.`,
      finance: `Improve your financial analysis skills by studying financial statements, ratios, and market analysis techniques.`,
      marketing: `Enhance your marketing knowledge by learning about digital marketing, consumer behavior, and marketing analytics.`,
      sales: `Develop your sales skills through understanding customer psychology, negotiation techniques, and sales process optimization.`,
      hr: `Strengthen your HR knowledge by studying employment law, talent management, and organizational behavior.`,
      general: `Work on your general knowledge and analytical thinking skills through reading and problem-solving practice.`
    };

    const baseAdvice = domainAdvice[domain as keyof typeof domainAdvice] || 'Focus on improving your skills in this area.';
    
    if (percentage < 30) {
      return `Critical improvement needed in ${domain}: ${baseAdvice}`;
    } else if (percentage < 60) {
      return `Room for improvement in ${domain}: ${baseAdvice}`;
    } else {
      return `Good foundation in ${domain}, but ${baseAdvice}`;
    }
  }
}

export const testScoringService = new TestScoringService();