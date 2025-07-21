import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionLimits {
  jobPostings: number;
  applications: number;
  customTests: number;
  premiumTargeting: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  dedicatedManager: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    jobPostings: 2,
    applications: 50,
    customTests: 0,
    premiumTargeting: false,
    analytics: false,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
    dedicatedManager: false
  },
  premium: {
    jobPostings: -1, // unlimited
    applications: -1, // unlimited
    customTests: 50,
    premiumTargeting: true,
    analytics: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: false,
    dedicatedManager: false
  },
  enterprise: {
    jobPostings: -1, // unlimited
    applications: -1, // unlimited
    customTests: -1, // unlimited
    premiumTargeting: true,
    analytics: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: true,
    dedicatedManager: true
  }
};

export class SubscriptionService {
  async getUserSubscription(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');

    return {
      planType: user.planType || 'free',
      subscriptionStatus: user.subscriptionStatus || 'free',
      limits: SUBSCRIPTION_LIMITS[user.planType || 'free']
    };
  }

  async canAccessFeature(userId: string, feature: keyof SubscriptionLimits): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[feature];
    
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    return limit !== 0;
  }

  async checkLimit(userId: string, feature: 'jobPostings' | 'applications' | 'customTests', currentCount: number): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[feature] as number;
    
    if (limit === -1) {
      return { allowed: true, limit: -1, remaining: -1 };
    }
    
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;
    
    return { allowed, limit, remaining };
  }

  async updateSubscription(userId: string, updates: {
    planType?: string;
    subscriptionStatus?: string;
    paymentProvider?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    razorpayPaymentId?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }) {
    await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async processSuccessfulPayment(userId: string, paymentData: {
    planType: string;
    paymentProvider: 'stripe' | 'paypal' | 'razorpay';
    paymentId: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
  }) {
    const endDate = new Date();
    if (paymentData.billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updates: any = {
      planType: paymentData.planType,
      subscriptionStatus: 'active',
      paymentProvider: paymentData.paymentProvider,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate
    };

    switch (paymentData.paymentProvider) {
      case 'stripe':
        updates.stripeSubscriptionId = paymentData.paymentId;
        break;
      case 'paypal':
        updates.paypalSubscriptionId = paymentData.paymentId;
        break;
      case 'razorpay':
        updates.razorpayPaymentId = paymentData.paymentId;
        break;
    }

    await this.updateSubscription(userId, updates);
  }

  async getUsageStats(userId: string) {
    // Get current usage counts from database
    // This would typically involve counting records from various tables
    // For now, we'll return mock data - implement actual counting as needed
    
    return {
      jobPostings: 0, // Count from job_postings table
      applications: 0, // Count from applications table  
      customTests: 0, // Count from test_templates table
    };
  }

  async isFeatureAccessible(userId: string, feature: keyof SubscriptionLimits): Promise<{ accessible: boolean; reason?: string; upgradeRequired?: boolean }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const hasAccess = await this.canAccessFeature(userId, feature);
      
      if (hasAccess) {
        return { accessible: true };
      }
      
      const currentPlan = subscription.planType;
      let requiredPlan = '';
      
      // Determine required plan for feature
      if (SUBSCRIPTION_LIMITS.premium[feature]) {
        requiredPlan = 'premium';
      } else if (SUBSCRIPTION_LIMITS.enterprise[feature]) {
        requiredPlan = 'enterprise';
      }
      
      return {
        accessible: false,
        reason: `This feature requires a ${requiredPlan} plan. You are currently on the ${currentPlan} plan.`,
        upgradeRequired: true
      };
    } catch (error) {
      return {
        accessible: false,
        reason: 'Unable to verify subscription status'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();