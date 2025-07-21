import { storage } from "./storage";
import { groqService } from "./groqService";
import { pistonService } from "./pistonService";
import { MockInterview, MockInterviewQuestion, InsertMockInterview, InsertMockInterviewQuestion } from "@shared/schema";
import { QUESTION_BANK, getRandomQuestions, getQuestionsByType } from "./questionBank";

interface InterviewQuestion {
  question: string;
  type: 'coding' | 'behavioral' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  testCases?: Array<{
    input: any;
    expected: any;
    description: string;
  }>;
  sampleAnswer?: string;
}

interface InterviewConfiguration {
  role: string;
  company?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interviewType: 'technical' | 'behavioral' | 'system_design';
  language: string;
  totalQuestions: number;
}

export class MockInterviewService {
  async generateInterviewQuestions(config: InterviewConfiguration): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];
    
    // Get questions from the comprehensive question bank
    const selectedQuestions = getRandomQuestions(
      config.interviewType === 'technical' ? 'coding' : config.interviewType,
      config.difficulty,
      config.totalQuestions
    );
    
    // Convert to the expected format
    questions.push(...selectedQuestions.map(q => ({
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      hints: q.hints,
      testCases: q.testCases,
      sampleAnswer: q.sampleAnswer
    })));

    // If we need more questions, generate them with AI
    if (questions.length < config.totalQuestions) {
      const aiQuestions = await this.generateAIQuestions(config, config.totalQuestions - questions.length);
      questions.push(...aiQuestions);
    }

    return questions;
  }

  private async generateAIQuestions(config: InterviewConfiguration, count: number): Promise<InterviewQuestion[]> {
    const prompt = `Generate ${count} ${config.difficulty} ${config.interviewType} questions for ${config.role}. Return JSON array:
[{"question": "text", "hints": ["h1","h2","h3"], "testCases": [{"input":1,"expected":2}], "sampleAnswer": "brief"}]`;

    try {
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const aiQuestions = JSON.parse(content);
      return aiQuestions.map((q: any) => ({
        question: q.question,
        type: config.interviewType === 'technical' ? 'coding' : config.interviewType,
        difficulty: config.difficulty,
        hints: q.hints || [],
        testCases: q.testCases || [],
        sampleAnswer: q.sampleAnswer || ''
      }));
    } catch (error) {
      console.error('Error generating AI questions:', error);
      return [];
    }
  }

  async startInterview(userId: string, config: InterviewConfiguration): Promise<MockInterview> {
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔍 Starting interview with sessionId:', sessionId);
    
    const interviewData: InsertMockInterview = {
      userId,
      sessionId,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      role: config.role,
      company: config.company,
      language: config.language,
      totalQuestions: config.totalQuestions,
      timeRemaining: 3600, // 1 hour
      isPaid: false // First interview is free
    };

    console.log('🔍 Interview data to insert:', interviewData);

    const interview = await storage.createMockInterview(interviewData);
    
    console.log('🔍 Interview created in storage:', interview);
    
    if (!interview) {
      throw new Error('Failed to create interview in storage');
    }
    
    // Generate and store questions
    const questions = await this.generateInterviewQuestions(config);
    
    console.log('🔍 Generated questions:', questions.length);
    
    for (let i = 0; i < questions.length; i++) {
      const questionData: InsertMockInterviewQuestion = {
        interviewId: interview.id,
        questionNumber: i + 1,
        question: questions[i].question,
        questionType: questions[i].type,
        difficulty: questions[i].difficulty,
        hints: JSON.stringify(questions[i].hints),
        testCases: JSON.stringify(questions[i].testCases || []),
        sampleAnswer: questions[i].sampleAnswer
      };
      
      await storage.createMockInterviewQuestion(questionData);
    }

    console.log('🔍 Returning interview:', interview);
    
    return interview;
  }

  async getInterviewWithQuestions(sessionId: string): Promise<{ interview: MockInterview; questions: MockInterviewQuestion[] } | null> {
    const interview = await storage.getMockInterviewBySessionId(sessionId);
    if (!interview) return null;

    const questions = await storage.getMockInterviewQuestions(interview.id);
    return { interview, questions };
  }

  async submitAnswer(questionId: number, answer: string, code?: string): Promise<void> {
    const question = await storage.getMockInterviewQuestion(questionId);
    if (!question) throw new Error('Question not found');

    // Update question with user's answer
    await storage.updateMockInterviewQuestion(questionId, {
      userAnswer: answer,
      userCode: code,
      timeSpent: 0 // Will be calculated on frontend
    });

    // Generate AI feedback for the answer
    const feedback = await this.generateFeedback(question, answer, code);
    const score = await this.calculateScore(question, answer, code);

    await storage.updateMockInterviewQuestion(questionId, {
      feedback,
      score
    });
  }

  private async generateFeedback(question: MockInterviewQuestion, answer: string, code?: string): Promise<string> {
    const prompt = `Provide constructive feedback for this interview answer:
    
    Question: ${question.question}
    Question Type: ${question.questionType}
    User Answer: ${answer}
    ${code ? `Code: ${code}` : ''}
    
    Provide specific, actionable feedback focusing on:
    1. Correctness and completeness
    2. Code quality and best practices (if applicable)
    3. Communication and explanation
    4. Suggestions for improvement
    
    Keep feedback constructive and encouraging.`;

    try {
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'No feedback available';
    } catch (error) {
      console.error('Error generating feedback:', error);
      return 'Feedback generation failed';
    }
  }

  private async calculateScore(question: MockInterviewQuestion, answer: string, code?: string): Promise<number> {
    if (question.questionType === 'coding' && code) {
      // For coding questions, test the code against test cases
      try {
        const testCases = JSON.parse(question.testCases || '[]');
        let passedTests = 0;
        
        // Simple code evaluation (in a real system, use a secure sandbox)
        for (const testCase of testCases) {
          try {
            // This is a simplified evaluation - in production, use a secure code execution environment
            const result = eval(`(${code})(${JSON.stringify(testCase.input)})`);
            if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
              passedTests++;
            }
          } catch (error) {
            // Code execution failed for this test case
          }
        }
        
        return Math.round((passedTests / testCases.length) * 100);
      } catch (error) {
        return 30; // Base score for attempt
      }
    } else {
      // For behavioral and system design questions, use AI to score
      const prompt = `Rate this interview answer on a scale of 0-100:
      
      Question: ${question.question}
      Answer: ${answer}
      
      Consider:
      - Completeness and relevance
      - Structure and clarity
      - Specific examples and details
      - Overall quality
      
      Return only the numeric score.`;

      try {
        const response = await groqService.client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 10,
        });

        const score = parseInt(response.choices[0]?.message?.content || '50');
        return Math.max(0, Math.min(100, score));
      } catch (error) {
        return 50; // Default score
      }
    }
  }

  async completeInterview(sessionId: string): Promise<MockInterview> {
    const interview = await storage.getMockInterviewBySessionId(sessionId);
    if (!interview) throw new Error('Interview not found');

    const questions = await storage.getMockInterviewQuestions(interview.id);
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    const averageScore = Math.round(totalScore / questions.length);

    const overallFeedback = await this.generateOverallFeedback(interview, questions);

    const updatedInterview = await storage.updateMockInterview(interview.id, {
      status: 'completed',
      endTime: new Date(),
      score: averageScore,
      feedback: overallFeedback
    });

    // Update user interview stats
    await this.updateUserStats(interview.userId, averageScore);

    return updatedInterview;
  }

  private async generateOverallFeedback(interview: MockInterview, questions: MockInterviewQuestion[]): Promise<string> {
    const prompt = `Generate overall interview feedback based on these responses:
    
    Interview Type: ${interview.interviewType}
    Role: ${interview.role}
    Difficulty: ${interview.difficulty}
    
    Questions and Scores:
    ${questions.map(q => `Q: ${q.question}\nScore: ${q.score || 0}/100`).join('\n\n')}
    
    Provide:
    1. Overall performance summary
    2. Strengths identified
    3. Areas for improvement
    4. Specific recommendations for next steps
    
    Keep it encouraging and actionable.`;

    try {
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || 'Great job completing the interview! Keep practicing to improve your skills.';
    } catch (error) {
      return 'Great job completing the interview! Keep practicing to improve your skills.';
    }
  }

  private async updateUserStats(userId: string, score: number): Promise<void> {
    const existingStats = await storage.getUserInterviewStats(userId);
    
    if (existingStats) {
      const totalInterviews = existingStats.totalInterviews + 1;
      const newAverage = Math.round(((existingStats.averageScore * existingStats.totalInterviews) + score) / totalInterviews);
      
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews,
        freeInterviewsUsed: existingStats.freeInterviewsUsed + 1,
        averageScore: newAverage,
        bestScore: Math.max(existingStats.bestScore, score),
        lastInterviewDate: new Date()
      });
    } else {
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: 1,
        freeInterviewsUsed: 1,
        averageScore: score,
        bestScore: score,
        lastInterviewDate: new Date()
      });
    }
  }

  async checkFreeInterviewsRemaining(userId: string): Promise<number> {
    const stats = await storage.getUserInterviewStats(userId);
    const freeInterviewsUsed = stats?.freeInterviewsUsed || 0;
    return Math.max(0, 1 - freeInterviewsUsed); // 1 free interview
  }

  async addInterviewCredits(userId: string, credits: number): Promise<void> {
    const stats = await storage.getUserInterviewStats(userId);
    
    if (stats) {
      // Reset free interviews used to allow more interviews
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: stats.totalInterviews,
        freeInterviewsUsed: Math.max(0, stats.freeInterviewsUsed - credits),
        averageScore: stats.averageScore,
        bestScore: stats.bestScore,
        lastInterviewDate: stats.lastInterviewDate
      });
    } else {
      // Create new stats with credits
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: 0,
        freeInterviewsUsed: -credits, // Negative means additional credits
        averageScore: 0,
        bestScore: 0,
        lastInterviewDate: new Date()
      });
    }
  }
}

export const mockInterviewService = new MockInterviewService();