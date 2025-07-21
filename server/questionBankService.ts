import { db } from './db';
import { questionBank, testGenerationLogs } from '@shared/schema';
import { questionBank as questionBankData, generateTestQuestions, getQuestionsByCategory, getQuestionsByDomain } from './questionBank';
import { eq, inArray, and, or } from 'drizzle-orm';

export class QuestionBankService {
  
  // Initialize question bank with pre-defined questions
  async initializeQuestionBank(): Promise<void> {
    try {
      console.log('Initializing question bank...');
      
      // Check if questions already exist
      const existingQuestions = await db.select().from(questionBank).limit(1);
      if (existingQuestions.length > 0) {
        console.log('Question bank already initialized');
        return;
      }
      
      // Insert all questions from our question bank
      const questionsToInsert = questionBankData.map(q => ({
        questionId: q.id,
        type: q.type,
        category: q.category,
        domain: q.domain,
        subCategory: q.subCategory,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer),
        explanation: q.explanation,
        points: q.points,
        timeLimit: q.timeLimit,
        tags: q.tags,
        keywords: q.keywords,
        testCases: q.testCases,
        boilerplate: q.boilerplate,
        language: q.language,
        isActive: true,
        createdBy: null // System questions
      }));
      
      await db.insert(questionBank).values(questionsToInsert);
      console.log(`Initialized question bank with ${questionsToInsert.length} questions`);
      
    } catch (error) {
      console.error('Error initializing question bank:', error);
      throw error;
    }
  }
  
  // Generate test questions based on job profile tags
  async generateTestForProfile(
    jobProfileTags: string[],
    totalQuestions: number = 30,
    distribution: {
      aptitude: number;
      english: number;
      domain: number;
    } = { aptitude: 15, english: 6, domain: 9 },
    includeExtreme: boolean = true
  ): Promise<any[]> {
    try {
      const questions: any[] = [];
      
      // Get aptitude questions (50%)
      const aptitudeQuestions = await this.getQuestionsByCategory(
        'general_aptitude',
        [],
        includeExtreme ? ['easy', 'medium', 'hard', 'extreme'] : ['easy', 'medium', 'hard'],
        distribution.aptitude
      );
      
      // Get English questions (20%)
      const englishQuestions = await this.getQuestionsByCategory(
        'english',
        [],
        includeExtreme ? ['easy', 'medium', 'hard', 'extreme'] : ['easy', 'medium', 'hard'],
        distribution.english
      );
      
      // Get domain-specific questions (30%)
      const domainQuestions = await this.getQuestionsByCategory(
        'domain_specific',
        jobProfileTags,
        includeExtreme ? ['medium', 'hard', 'extreme'] : ['medium', 'hard'],
        distribution.domain
      );
      
      questions.push(...aptitudeQuestions, ...englishQuestions, ...domainQuestions);
      
      // Shuffle questions
      return questions.sort(() => Math.random() - 0.5);
      
    } catch (error) {
      console.error('Error generating test questions:', error);
      throw error;
    }
  }
  
  // Get questions by category with filtering
  async getQuestionsByCategory(
    category: string,
    tags: string[] = [],
    difficulty: string[] = ['easy', 'medium', 'hard', 'extreme'],
    limit: number = 10
  ): Promise<any[]> {
    try {
      let whereConditions: any[] = [
        eq(questionBank.category, category),
        eq(questionBank.isActive, true),
        inArray(questionBank.difficulty, difficulty)
      ];
      
      // Add tag filtering if provided
      if (tags.length > 0) {
        // Create tag filtering conditions
        const tagConditions = tags.map(tag => 
          // Check if any tag in the array matches
          db.select().from(questionBank).where(
            and(
              eq(questionBank.category, category),
              eq(questionBank.isActive, true),
              // SQL to check if tag exists in tags array
              // This is a simplified approach - in practice you'd use array operators
            )
          )
        );
      }
      
      const questions = await db.select()
        .from(questionBank)
        .where(and(...whereConditions))
        .limit(limit * 2); // Get more than needed for better randomization
      
      // Shuffle and limit
      return questions
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
        .map(q => ({
          ...q,
          correctAnswer: this.parseCorrectAnswer(q.correctAnswer),
          options: q.options || [],
          tags: q.tags || [],
          keywords: q.keywords || []
        }));
      
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      return [];
    }
  }
  
  // Get questions by domain (for domain-specific filtering)
  async getQuestionsByDomain(
    domain: string,
    tags: string[] = [],
    limit: number = 10
  ): Promise<any[]> {
    try {
      const questions = await db.select()
        .from(questionBank)
        .where(
          and(
            eq(questionBank.domain, domain),
            eq(questionBank.isActive, true),
            eq(questionBank.category, 'domain_specific')
          )
        )
        .limit(limit * 2);
      
      // Filter by tags if provided
      let filteredQuestions = questions;
      if (tags.length > 0) {
        filteredQuestions = questions.filter(q => 
          tags.some(tag => q.tags?.includes(tag))
        );
      }
      
      return filteredQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
        .map(q => ({
          ...q,
          correctAnswer: this.parseCorrectAnswer(q.correctAnswer),
          options: q.options || [],
          tags: q.tags || [],
          keywords: q.keywords || []
        }));
      
    } catch (error) {
      console.error('Error fetching questions by domain:', error);
      return [];
    }
  }
  
  // Log test generation for tracking
  async logTestGeneration(
    testTemplateId: number,
    assignmentId: number | null,
    generatedQuestions: any[],
    generationParams: any
  ): Promise<void> {
    try {
      const aptitudeCount = generatedQuestions.filter(q => q.category === 'general_aptitude').length;
      const englishCount = generatedQuestions.filter(q => q.category === 'english').length;
      const domainCount = generatedQuestions.filter(q => q.category === 'domain_specific').length;
      const extremeCount = generatedQuestions.filter(q => q.difficulty === 'extreme').length;
      
      await db.insert(testGenerationLogs).values({
        testTemplateId,
        assignmentId,
        generatedQuestions: generatedQuestions,
        generationParams,
        totalQuestions: generatedQuestions.length,
        aptitudeCount,
        englishCount,
        domainCount,
        extremeCount
      });
      
    } catch (error) {
      console.error('Error logging test generation:', error);
    }
  }
  
  // Get available domains for filtering
  async getAvailableDomains(): Promise<string[]> {
    try {
      const domains = await db.select({ domain: questionBank.domain })
        .from(questionBank)
        .where(eq(questionBank.isActive, true))
        .groupBy(questionBank.domain);
      
      return domains.map(d => d.domain);
    } catch (error) {
      console.error('Error fetching available domains:', error);
      return [];
    }
  }
  
  // Get available tags for filtering
  async getAvailableTags(): Promise<string[]> {
    try {
      const questions = await db.select({ tags: questionBank.tags })
        .from(questionBank)
        .where(eq(questionBank.isActive, true));
      
      const allTags = new Set<string>();
      questions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error fetching available tags:', error);
      return [];
    }
  }
  
  // Add custom question to question bank
  async addCustomQuestion(questionData: any, userId: string): Promise<any> {
    try {
      const [newQuestion] = await db.insert(questionBank).values({
        ...questionData,
        createdBy: userId,
        isActive: true
      }).returning();
      
      return newQuestion;
    } catch (error) {
      console.error('Error adding custom question:', error);
      throw error;
    }
  }
  
  // Search questions by keywords
  async searchQuestions(
    searchTerm?: string,
    category?: string,
    domain?: string,
    difficulty?: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      let whereConditions: any[] = [
        eq(questionBank.isActive, true)
      ];
      
      if (category) {
        whereConditions.push(eq(questionBank.category, category));
      }
      
      if (domain) {
        whereConditions.push(eq(questionBank.domain, domain));
      }
      
      if (difficulty) {
        whereConditions.push(eq(questionBank.difficulty, difficulty));
      }
      
      const questions = await db.select()
        .from(questionBank)
        .where(and(...whereConditions))
        .limit(limit * 3); // Get more for better filtering
      
      // Filter by search term if provided
      let filtered = questions;
      if (searchTerm && searchTerm.trim() !== '') {
        filtered = questions.filter(q => 
          q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.keywords?.some(keyword => 
            keyword?.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          q.tags?.some(tag => 
            tag?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      
      return filtered.slice(0, limit).map(q => ({
        ...q,
        correctAnswer: this.parseCorrectAnswer(q.correctAnswer),
        options: q.options || [],
        tags: q.tags || [],
        keywords: q.keywords || []
      }));
      
    } catch (error) {
      console.error('Error searching questions:', error);
      return [];
    }
  }
  
  // Helper method to parse correct answer
  private parseCorrectAnswer(answer: string | null): any {
    if (!answer) return null;
    
    try {
      return JSON.parse(answer);
    } catch {
      return answer;
    }
  }
  
  // Get question statistics
  async getQuestionStats(): Promise<any> {
    try {
      const questions = await db.select()
        .from(questionBank)
        .where(eq(questionBank.isActive, true));
      
      const stats = {
        total: questions.length,
        byCategory: {} as any,
        byDomain: {} as any,
        byDifficulty: {} as any,
        byType: {} as any
      };
      
      questions.forEach(q => {
        // Count by category
        stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
        
        // Count by domain
        stats.byDomain[q.domain] = (stats.byDomain[q.domain] || 0) + 1;
        
        // Count by difficulty
        stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
        
        // Count by type
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching question stats:', error);
      return { total: 0, byCategory: {}, byDomain: {}, byDifficulty: {}, byType: {} };
    }
  }
}

export const questionBankService = new QuestionBankService();