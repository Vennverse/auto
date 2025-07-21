import { db } from './db';
import { users, userProfiles, subscriptions, dailyUsage } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { subscriptionPaymentService, SUBSCRIPTION_TIERS } from './subscriptionPaymentService';

interface UsageStats {
  jobAnalyses: number;
  resumeAnalyses: number;
  applications: number;
  autoFills: number;
  jobPostings: number;
  interviews: number;
  candidates: number;
}

interface UsageLimits {
  jobAnalyses?: number;
  resumeAnalyses?: number;
  applications?: number;
  autoFills?: number;
  jobPostings?: number;
  interviews?: number;
  candidates?: number;
}

export class UsageMonitoringService {
  async getCurrentUsage(userId: string): Promise<UsageStats> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const usage = await db.query.dailyUsage.findFirst({
      where: and(
        eq(dailyUsage.userId, userId),
        gte(dailyUsage.date, startOfMonth)
      ),
      orderBy: [desc(dailyUsage.date)]
    });

    if (!usage) {
      return {
        jobAnalyses: 0,
        resumeAnalyses: 0,
        applications: 0,
        autoFills: 0,
        jobPostings: 0,
        interviews: 0,
        candidates: 0
      };
    }

    return {
      jobAnalyses: usage.jobAnalyses || 0,
      resumeAnalyses: usage.resumeAnalyses || 0,
      applications: usage.applications || 0,
      autoFills: usage.autoFills || 0,
      jobPostings: usage.jobPostings || 0,
      interviews: usage.interviews || 0,
      candidates: usage.candidates || 0
    };
  }

  async getUserLimits(userId: string): Promise<UsageLimits> {
    const subscription = await subscriptionPaymentService.getUserSubscription(userId);
    
    if (!subscription || !subscription.isActive) {
      // Free tier limits - very restrictive to encourage upgrades
      return {
        jobAnalyses: 5,
        resumeAnalyses: 2,
        applications: 10,
        autoFills: 5,
        jobPostings: 1,
        interviews: 1,
        candidates: 10
      };
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier);
    return tier?.limits || {};
  }

  async checkUsageLimit(userId: string, feature: keyof UsageStats): Promise<{ allowed: boolean; remaining: number; limit: number; isUpgradeRequired: boolean }> {
    const [currentUsage, limits] = await Promise.all([
      this.getCurrentUsage(userId),
      this.getUserLimits(userId)
    ]);

    const used = currentUsage[feature] || 0;
    const limit = limits[feature] || -1; // -1 means unlimited

    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1, isUpgradeRequired: false };
    }

    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;
    const isUpgradeRequired = !allowed;

    return { allowed, remaining, limit, isUpgradeRequired };
  }

  async incrementUsage(userId: string, feature: keyof UsageStats, amount: number = 1): Promise<boolean> {
    const check = await this.checkUsageLimit(userId, feature);
    
    if (!check.allowed) {
      return false; // Usage limit exceeded
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    try {
      // Try to update existing record for today
      const existingUsage = await db.query.dailyUsage.findFirst({
        where: and(
          eq(dailyUsage.userId, userId),
          eq(dailyUsage.date, new Date(dateStr))
        )
      });

      if (existingUsage) {
        await db.update(dailyUsage)
          .set({ [feature]: (existingUsage[feature] || 0) + amount })
          .where(eq(dailyUsage.id, existingUsage.id));
      } else {
        await db.insert(dailyUsage).values({
          userId,
          date: new Date(dateStr),
          [feature]: amount
        });
      }

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  async getUsagePercentage(userId: string, feature: keyof UsageStats): Promise<number> {
    const [currentUsage, limits] = await Promise.all([
      this.getCurrentUsage(userId),
      this.getUserLimits(userId)
    ]);

    const used = currentUsage[feature] || 0;
    const limit = limits[feature] || -1;

    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;

    return Math.min(100, Math.round((used / limit) * 100));
  }

  async shouldShowUpgradePrompt(userId: string): Promise<{ show: boolean; feature?: string; usage?: number; limit?: number }> {
    const [currentUsage, limits] = await Promise.all([
      this.getCurrentUsage(userId),
      this.getUserLimits(userId)
    ]);

    // Check each feature for high usage (80% or more)
    const features: (keyof UsageStats)[] = ['jobAnalyses', 'resumeAnalyses', 'applications', 'autoFills', 'jobPostings', 'interviews', 'candidates'];
    
    for (const feature of features) {
      const used = currentUsage[feature] || 0;
      const limit = limits[feature] || -1;
      
      if (limit > 0 && (used / limit) >= 0.8) {
        return {
          show: true,
          feature,
          usage: used,
          limit
        };
      }
    }

    return { show: false };
  }

  async generateUsageReport(userId: string): Promise<{
    subscription: any;
    usage: UsageStats;
    limits: UsageLimits;
    percentages: Record<keyof UsageStats, number>;
    upgradeRecommended: boolean;
  }> {
    const [subscription, usage, limits] = await Promise.all([
      subscriptionPaymentService.getUserSubscription(userId),
      this.getCurrentUsage(userId),
      this.getUserLimits(userId)
    ]);

    const percentages = {} as Record<keyof UsageStats, number>;
    let upgradeRecommended = false;

    const features: (keyof UsageStats)[] = ['jobAnalyses', 'resumeAnalyses', 'applications', 'autoFills', 'jobPostings', 'interviews', 'candidates'];
    
    for (const feature of features) {
      percentages[feature] = await this.getUsagePercentage(userId, feature);
      if (percentages[feature] >= 70) {
        upgradeRecommended = true;
      }
    }

    return {
      subscription,
      usage,
      limits,
      percentages,
      upgradeRecommended
    };
  }

  async enforceUsageLimit(userId: string, feature: keyof UsageStats): Promise<{ allowed: boolean; upgradeRequired: boolean; message: string }> {
    const check = await this.checkUsageLimit(userId, feature);
    
    if (check.allowed) {
      await this.incrementUsage(userId, feature);
      return {
        allowed: true,
        upgradeRequired: false,
        message: `${check.remaining} uses remaining this month`
      };
    }

    const subscription = await subscriptionPaymentService.getUserSubscription(userId);
    const isFreeTier = !subscription || !subscription.isActive;
    
    return {
      allowed: false,
      upgradeRequired: true,
      message: isFreeTier 
        ? `Free tier limit reached (${check.limit} per month). Upgrade to premium for unlimited access.`
        : `Monthly limit reached (${check.limit}). Upgrade to a higher tier for more usage.`
    };
  }
}

export const usageMonitoringService = new UsageMonitoringService();