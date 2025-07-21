import { db } from "./db";
import { virtualInterviewStats, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface VirtualInterviewUsage {
  canStartInterview: boolean;
  requiresPayment: boolean;
  freeInterviewsRemaining: number;
  monthlyInterviewsRemaining: number;
  message: string;
  cost?: number;
}

export class VirtualInterviewPaymentService {
  private readonly FREE_INTERVIEWS_LIMIT = 1; // 1 free interview for all users
  private readonly PREMIUM_FREE_LIMIT = 5; // 5 free interviews for premium users
  private readonly INTERVIEW_COST = 5; // $5 per interview after free limit

  async checkUsageAndPayment(userId: string): Promise<VirtualInterviewUsage> {
    try {
      // Get user subscription status
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create user stats
      let userStats = await db.query.virtualInterviewStats.findFirst({
        where: eq(virtualInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(virtualInterviewStats).values({
          userId,
          totalInterviews: 0,
          freeInterviewsUsed: 0,
          monthlyInterviewsUsed: 0,
          lastMonthlyReset: new Date()
        }).returning();
        userStats = newStats;
      }

      // Reset monthly usage if needed
      userStats = await this.resetMonthlyUsageIfNeeded(userStats);

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      
      // Check free interviews based on user type
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      if (userStats.freeInterviewsUsed < freeLimit) {
        return {
          canStartInterview: true,
          requiresPayment: false,
          freeInterviewsRemaining: freeLimit - userStats.freeInterviewsUsed,
          monthlyInterviewsRemaining: 0,
          message: `You have ${freeLimit - userStats.freeInterviewsUsed} free interview${freeLimit - userStats.freeInterviewsUsed === 1 ? '' : 's'} remaining.`
        };
      }

      // After free limit, all users must pay per interview
      // No additional monthly limits - just pay-per-use

      // User needs to pay
      return {
        canStartInterview: false,
        requiresPayment: true,
        freeInterviewsRemaining: 0,
        monthlyInterviewsRemaining: 0,
        cost: this.INTERVIEW_COST,
        message: isPremium 
          ? `You've used all ${this.PREMIUM_FREE_LIMIT} free interviews. Pay $${this.INTERVIEW_COST} via PayPal or Razorpay for additional interviews.`
          : `You've used your ${this.FREE_INTERVIEWS_LIMIT} free interview. Upgrade to premium for ${this.PREMIUM_FREE_LIMIT} free interviews or pay $${this.INTERVIEW_COST} per interview via PayPal or Razorpay.`
      };

    } catch (error) {
      console.error('Error checking virtual interview usage:', error);
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

      let userStats = await db.query.virtualInterviewStats.findFirst({
        where: eq(virtualInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(virtualInterviewStats).values({
          userId,
          totalInterviews: 1,
          freeInterviewsUsed: isPaid ? 0 : 1,
          monthlyInterviewsUsed: 0, // Removed monthly tracking - all pay per use after free limit
          lastMonthlyReset: new Date()
        }).returning();
        return;
      }

      // Reset monthly usage if needed
      userStats = await this.resetMonthlyUsageIfNeeded(userStats);

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      let updateData: any = {
        totalInterviews: userStats.totalInterviews + 1
      };

      if (!isPaid) {
        // This is a free interview - update based on user type
        if (userStats.freeInterviewsUsed < freeLimit) {
          updateData.freeInterviewsUsed = userStats.freeInterviewsUsed + 1;
        }
      }

      await db.update(virtualInterviewStats)
        .set(updateData)
        .where(eq(virtualInterviewStats.userId, userId));

    } catch (error) {
      console.error('Error recording interview start:', error);
      throw error;
    }
  }

  private async resetMonthlyUsageIfNeeded(userStats: any): Promise<any> {
    const now = new Date();
    const lastReset = new Date(userStats.lastMonthlyReset);
    
    // Check if a month has passed
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      const [updatedStats] = await db.update(virtualInterviewStats)
        .set({
          monthlyInterviewsUsed: 0,
          lastMonthlyReset: now
        })
        .where(eq(virtualInterviewStats.userId, userStats.userId))
        .returning();
      
      return updatedStats;
    }
    
    return userStats;
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

export const virtualInterviewPaymentService = new VirtualInterviewPaymentService();