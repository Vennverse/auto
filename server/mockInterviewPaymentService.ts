import { db } from "./db";
import { userInterviewStats, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface MockInterviewUsage {
  canStartInterview: boolean;
  requiresPayment: boolean;
  freeInterviewsRemaining: number;
  message: string;
  cost?: number;
}

export class MockInterviewPaymentService {
  private readonly FREE_INTERVIEWS_LIMIT = 1; // 1 free interview for all users
  private readonly PREMIUM_FREE_LIMIT = 5; // 5 free interviews for premium users
  private readonly INTERVIEW_COST = 5; // $5 per interview after free limit

  async checkUsageAndPayment(userId: string): Promise<MockInterviewUsage> {
    try {
      // Get user subscription status
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create user stats
      let userStats = await db.query.userInterviewStats.findFirst({
        where: eq(userInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(userInterviewStats).values({
          userId,
          totalMockInterviews: 0,
          freeMockInterviewsUsed: 0,
          lastReset: new Date()
        }).returning();
        userStats = newStats;
      }

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      
      // Check free interviews based on user type
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      if (userStats.freeMockInterviewsUsed < freeLimit) {
        return {
          canStartInterview: true,
          requiresPayment: false,
          freeInterviewsRemaining: freeLimit - userStats.freeMockInterviewsUsed,
          message: `You have ${freeLimit - userStats.freeMockInterviewsUsed} free mock interview${freeLimit - userStats.freeMockInterviewsUsed === 1 ? '' : 's'} remaining.`
        };
      }

      // After free limit, all users must pay per interview
      return {
        canStartInterview: false,
        requiresPayment: true,
        freeInterviewsRemaining: 0,
        cost: this.INTERVIEW_COST,
        message: isPremium 
          ? `You've used all ${this.PREMIUM_FREE_LIMIT} free mock interviews. Pay $${this.INTERVIEW_COST} via PayPal or Razorpay for additional interviews.`
          : `You've used your ${this.FREE_INTERVIEWS_LIMIT} free mock interview. Upgrade to premium for ${this.PREMIUM_FREE_LIMIT} free interviews or pay $${this.INTERVIEW_COST} per interview via PayPal or Razorpay.`
      };

    } catch (error) {
      console.error('Error checking mock interview usage:', error);
      throw error;
    }
  }

  async recordInterviewStart(userId: string, isPaid: boolean = false): Promise<void> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      let userStats = await db.query.userInterviewStats.findFirst({
        where: eq(userInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(userInterviewStats).values({
          userId,
          totalMockInterviews: 1,
          freeMockInterviewsUsed: isPaid ? 0 : 1,
          lastReset: new Date()
        }).returning();
        return;
      }

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      let updateData: any = {
        totalMockInterviews: userStats.totalMockInterviews + 1
      };

      if (!isPaid) {
        // This is a free interview - update based on user type
        if (userStats.freeMockInterviewsUsed < freeLimit) {
          updateData.freeMockInterviewsUsed = userStats.freeMockInterviewsUsed + 1;
        }
      }

      await db.update(userInterviewStats)
        .set(updateData)
        .where(eq(userInterviewStats.userId, userId));

    } catch (error) {
      console.error('Error recording mock interview start:', error);
      throw error;
    }
  }

  async createPaymentIntent(userId: string): Promise<{ amount: number; currency: string }> {
    return {
      amount: this.INTERVIEW_COST * 100, // Convert to cents
      currency: 'usd'
    };
  }

  getInterviewCost(): number {
    return this.INTERVIEW_COST;
  }
}

export const mockInterviewPaymentService = new MockInterviewPaymentService();