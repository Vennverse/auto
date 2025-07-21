import { db } from "./db";
import { eq, desc, and, or, sql, between, count, asc } from "drizzle-orm";
import { 
  rankingTests, 
  weeklyRankings, 
  monthlyRankings, 
  recruiterRankingAccess,
  testTemplates,
  users,
  userProfiles,
  resumes,
  type InsertRankingTest,
  type InsertWeeklyRanking,
  type InsertMonthlyRanking,
  type InsertRecruiterRankingAccess,
  type RankingTest,
  type WeeklyRanking,
  type MonthlyRanking
} from "@shared/schema";
import { QUESTION_BANK, getQuestionsByCategory } from "./questionBank";
import { testService } from "./testService";

class RankingTestService {
  // Create a new ranking test for a user
  async createRankingTest(userId: string, category: string, domain: string, difficultyLevel: string): Promise<RankingTest> {
    // Generate questions using the existing question bank
    const questions = getQuestionsByCategory(category).slice(0, 30);
    
    const testData: InsertRankingTest = {
      userId,
      testTitle: `${category} - ${domain} (${difficultyLevel})`,
      category,
      domain,
      difficultyLevel,
      totalQuestions: questions.length,
      correctAnswers: 0,
      totalScore: 0,
      maxScore: questions.reduce((sum, q) => sum + q.points, 0),
      percentageScore: 0,
      timeSpent: 0,
      answers: [],
      questions,
      status: "in_progress",
      paymentStatus: "pending"
    };

    const [test] = await db.insert(rankingTests).values(testData).returning();
    return test;
  }

  // Submit a ranking test with answers
  async submitRankingTest(testId: number, answers: any[], timeSpent: number): Promise<RankingTest> {
    // Get the test
    const [test] = await db.select().from(rankingTests).where(eq(rankingTests.id, testId));
    if (!test) {
      throw new Error("Test not found");
    }

    // Calculate score using the existing test service
    const scoreResult = await testService.calculateScore(test.questions, answers);
    
    // Update the test with results
    const updatedTest = {
      answers,
      timeSpent,
      correctAnswers: scoreResult.correctAnswers,
      totalScore: scoreResult.totalScore,
      percentageScore: scoreResult.percentageScore,
      status: "completed" as const,
    };

    const [completedTest] = await db
      .update(rankingTests)
      .set(updatedTest)
      .where(eq(rankingTests.id, testId))
      .returning();

    // Calculate rankings immediately
    await this.calculateRankings(completedTest);
    
    return completedTest;
  }

  // Calculate rankings for a completed test
  async calculateRankings(test: RankingTest): Promise<void> {
    const { category, domain, percentageScore, totalScore } = test;
    
    // Calculate global rank
    const globalRankResult = await db
      .select({ count: count() })
      .from(rankingTests)
      .where(
        and(
          eq(rankingTests.category, category),
          eq(rankingTests.domain, domain),
          eq(rankingTests.status, "completed"),
          sql`${rankingTests.percentageScore} > ${percentageScore}`
        )
      );
    
    const globalRank = globalRankResult[0].count + 1;

    // Calculate weekly rank
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyRankResult = await db
      .select({ count: count() })
      .from(rankingTests)
      .where(
        and(
          eq(rankingTests.category, category),
          eq(rankingTests.domain, domain),
          eq(rankingTests.status, "completed"),
          sql`${rankingTests.percentageScore} > ${percentageScore}`,
          between(rankingTests.createdAt, weekStart, weekEnd)
        )
      );
    
    const weeklyRank = weeklyRankResult[0].count + 1;

    // Calculate monthly rank
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthlyRankResult = await db
      .select({ count: count() })
      .from(rankingTests)
      .where(
        and(
          eq(rankingTests.category, category),
          eq(rankingTests.domain, domain),
          eq(rankingTests.status, "completed"),
          sql`${rankingTests.percentageScore} > ${percentageScore}`,
          between(rankingTests.createdAt, monthStart, monthEnd)
        )
      );
    
    const monthlyRank = monthlyRankResult[0].count + 1;

    // Update the test with rankings
    await db
      .update(rankingTests)
      .set({
        rank: globalRank,
        weeklyRank,
        monthlyRank,
        categoryRank: globalRank
      })
      .where(eq(rankingTests.id, test.id));

    // Create weekly ranking entry
    await this.createWeeklyRanking(test, weeklyRank, weekStart, weekEnd);
    
    // Update monthly rankings
    await this.updateMonthlyRankings(test, monthlyRank);
    
    // Check if user qualifies for recruiter sharing
    await this.checkRecruiterSharing(test, weeklyRank);
  }

  // Create weekly ranking entry
  async createWeeklyRanking(test: RankingTest, rank: number, weekStart: Date, weekEnd: Date): Promise<void> {
    const weeklyRankingData: InsertWeeklyRanking = {
      userId: test.userId,
      testId: test.id,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      rank,
      category: test.category,
      domain: test.domain,
      totalScore: test.totalScore,
      percentageScore: test.percentageScore,
      isTopPerformer: rank <= 10,
      resumeSharedToRecruiters: false,
      shareCount: 0
    };

    await db.insert(weeklyRankings).values(weeklyRankingData);
  }

  // Update monthly rankings
  async updateMonthlyRankings(test: RankingTest, rank: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Check if user already has a monthly ranking
    const [existingRanking] = await db
      .select()
      .from(monthlyRankings)
      .where(
        and(
          eq(monthlyRankings.userId, test.userId),
          eq(monthlyRankings.month, month),
          eq(monthlyRankings.year, year),
          eq(monthlyRankings.category, test.category),
          eq(monthlyRankings.domain, test.domain)
        )
      );

    if (existingRanking) {
      // Update existing ranking
      const newAverage = Math.round((existingRanking.averageScore * existingRanking.totalTests + test.percentageScore) / (existingRanking.totalTests + 1));
      const newBestScore = Math.max(existingRanking.bestScore, test.percentageScore);
      
      await db
        .update(monthlyRankings)
        .set({
          totalTests: existingRanking.totalTests + 1,
          averageScore: newAverage,
          bestScore: newBestScore,
          rank: rank
        })
        .where(eq(monthlyRankings.id, existingRanking.id));
    } else {
      // Create new monthly ranking
      const monthlyRankingData: InsertMonthlyRanking = {
        userId: test.userId,
        month,
        year,
        rank,
        category: test.category,
        domain: test.domain,
        totalTests: 1,
        averageScore: test.percentageScore,
        bestScore: test.percentageScore,
        profileSharedCount: 0
      };

      await db.insert(monthlyRankings).values(monthlyRankingData);
    }
  }

  // Check if user qualifies for recruiter sharing
  async checkRecruiterSharing(test: RankingTest, weeklyRank: number): Promise<void> {
    // Top 10 weekly performers get shared to recruiters
    if (weeklyRank <= 10) {
      await this.shareToRecruiters(test, "weekly_top", weeklyRank);
    }

    // Monthly top performers also get shared
    if (test.monthlyRank && test.monthlyRank <= 5) {
      await this.shareToRecruiters(test, "monthly_share", test.monthlyRank);
    }
  }

  // Share top performers to recruiters
  async shareToRecruiters(test: RankingTest, accessType: string, rank: number): Promise<void> {
    // Get all recruiters
    const recruiters = await db
      .select()
      .from(users)
      .where(eq(users.userType, "recruiter"));

    // Get user profile and resume
    const [userProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, test.userId));

    const userResumes = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, test.userId), eq(resumes.isActive, true)));

    const testDetails = {
      testTitle: test.testTitle,
      category: test.category,
      domain: test.domain,
      score: test.percentageScore,
      rank,
      completedAt: test.createdAt,
      userProfile,
      resumes: userResumes
    };

    // Share to all recruiters
    for (const recruiter of recruiters) {
      const accessData: InsertRecruiterRankingAccess = {
        recruiterId: recruiter.id,
        candidateId: test.userId,
        accessType,
        rankingType: accessType === "weekly_top" ? "weekly" : "monthly",
        category: test.category,
        domain: test.domain,
        candidateRank: rank,
        candidateScore: test.percentageScore,
        testDetails
      };

      await db.insert(recruiterRankingAccess).values(accessData);
    }

    // Mark test as shared
    await db
      .update(rankingTests)
      .set({ isSharedToRecruiters: true })
      .where(eq(rankingTests.id, test.id));
  }

  // Get available test categories and domains
  async getAvailableTests(): Promise<{ categories: string[], domains: string[] }> {
    const categories = ["technical", "behavioral", "general"];
    const domains = ["general", "technical", "finance", "marketing", "sales", "hr", "accounting"];
    
    return { categories, domains };
  }

  // Get user's test history
  async getUserTestHistory(userId: string): Promise<RankingTest[]> {
    return await db
      .select()
      .from(rankingTests)
      .where(eq(rankingTests.userId, userId))
      .orderBy(desc(rankingTests.createdAt));
  }

  // Get leaderboard
  async getLeaderboard(category: string, domain: string, type: "weekly" | "monthly" | "all-time", limit: number = 10): Promise<any[]> {
    if (type === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      return await db
        .select({
          rank: weeklyRankings.rank,
          userId: weeklyRankings.userId,
          userName: users.firstName,
          userLastName: users.lastName,
          score: weeklyRankings.percentageScore,
          totalScore: weeklyRankings.totalScore,
          category: weeklyRankings.category,
          domain: weeklyRankings.domain,
          completedAt: weeklyRankings.createdAt
        })
        .from(weeklyRankings)
        .innerJoin(users, eq(weeklyRankings.userId, users.id))
        .where(
          and(
            eq(weeklyRankings.category, category),
            eq(weeklyRankings.domain, domain),
            eq(weeklyRankings.weekStart, weekStart.toISOString().split('T')[0])
          )
        )
        .orderBy(asc(weeklyRankings.rank))
        .limit(limit);
    } else if (type === "monthly") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      return await db
        .select({
          rank: monthlyRankings.rank,
          userId: monthlyRankings.userId,
          userName: users.firstName,
          userLastName: users.lastName,
          score: monthlyRankings.averageScore,
          bestScore: monthlyRankings.bestScore,
          totalTests: monthlyRankings.totalTests,
          category: monthlyRankings.category,
          domain: monthlyRankings.domain
        })
        .from(monthlyRankings)
        .innerJoin(users, eq(monthlyRankings.userId, users.id))
        .where(
          and(
            eq(monthlyRankings.category, category),
            eq(monthlyRankings.domain, domain),
            eq(monthlyRankings.month, month),
            eq(monthlyRankings.year, year)
          )
        )
        .orderBy(asc(monthlyRankings.rank))
        .limit(limit);
    } else {
      return await db
        .select({
          rank: rankingTests.rank,
          userId: rankingTests.userId,
          userName: users.firstName,
          userLastName: users.lastName,
          score: rankingTests.percentageScore,
          totalScore: rankingTests.totalScore,
          category: rankingTests.category,
          domain: rankingTests.domain,
          completedAt: rankingTests.createdAt
        })
        .from(rankingTests)
        .innerJoin(users, eq(rankingTests.userId, users.id))
        .where(
          and(
            eq(rankingTests.category, category),
            eq(rankingTests.domain, domain),
            eq(rankingTests.status, "completed")
          )
        )
        .orderBy(asc(rankingTests.rank))
        .limit(limit);
    }
  }

  // Get recruiter's ranking access
  async getRecruiterRankingAccess(recruiterId: string, viewed?: boolean): Promise<any[]> {
    const conditions = [eq(recruiterRankingAccess.recruiterId, recruiterId)];
    
    if (viewed !== undefined) {
      conditions.push(eq(recruiterRankingAccess.viewed, viewed));
    }

    return await db
      .select({
        id: recruiterRankingAccess.id,
        candidateId: recruiterRankingAccess.candidateId,
        candidateName: users.firstName,
        candidateLastName: users.lastName,
        candidateEmail: users.email,
        accessType: recruiterRankingAccess.accessType,
        rankingType: recruiterRankingAccess.rankingType,
        category: recruiterRankingAccess.category,
        domain: recruiterRankingAccess.domain,
        candidateRank: recruiterRankingAccess.candidateRank,
        candidateScore: recruiterRankingAccess.candidateScore,
        testDetails: recruiterRankingAccess.testDetails,
        viewed: recruiterRankingAccess.viewed,
        contacted: recruiterRankingAccess.contacted,
        sharedAt: recruiterRankingAccess.sharedAt,
        viewedAt: recruiterRankingAccess.viewedAt
      })
      .from(recruiterRankingAccess)
      .innerJoin(users, eq(recruiterRankingAccess.candidateId, users.id))
      .where(and(...conditions))
      .orderBy(desc(recruiterRankingAccess.sharedAt));
  }

  // Mark ranking access as viewed
  async markRankingAsViewed(accessId: number): Promise<void> {
    await db
      .update(recruiterRankingAccess)
      .set({ viewed: true, viewedAt: new Date() })
      .where(eq(recruiterRankingAccess.id, accessId));
  }

  // Mark candidate as contacted
  async markCandidateAsContacted(accessId: number, notes?: string): Promise<void> {
    await db
      .update(recruiterRankingAccess)
      .set({ contacted: true, contactedAt: new Date(), notes })
      .where(eq(recruiterRankingAccess.id, accessId));
  }
}

export const rankingTestService = new RankingTestService();