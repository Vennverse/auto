// Import PayPal services for payment processing  
// Note: PayPal integration uses the existing PayPal service for order creation
import { db } from './db';
import { userProfiles, subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker' | 'recruiter';
  features: string[];
  limits: {
    jobAnalyses?: number;
    resumeAnalyses?: number;
    applications?: number;
    autoFills?: number;
    jobPostings?: number;
    interviews?: number;
    candidates?: number;
  };
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  // Job Seeker Plans
  {
    id: 'jobseeker_basic_monthly',
    name: 'Basic Monthly',
    price: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'jobseeker',
    features: [
      'AI Resume Analysis',
      'Job Matching',
      'Chrome Extension',
      'Basic Support'
    ],
    limits: {
      jobAnalyses: 50,
      resumeAnalyses: 10,
      applications: 100,
      autoFills: 50
    }
  },
  {
    id: 'jobseeker_premium_monthly',
    name: 'Premium Monthly',
    price: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'jobseeker',
    features: [
      'Everything in Basic',
      'Virtual AI Interviews',
      'Coding Tests',
      'Advanced Analytics',
      'Priority Support'
    ],
    limits: {
      jobAnalyses: 200,
      resumeAnalyses: 50,
      applications: 500,
      autoFills: 200,
      interviews: 20
    }
  },
  {
    id: 'jobseeker_premium_yearly',
    name: 'Premium Yearly',
    price: 199.99,
    currency: 'USD',
    billingCycle: 'yearly',
    userType: 'jobseeker',
    features: [
      'Everything in Premium Monthly',
      '2 months free',
      'Career Coaching Session',
      'Resume Writing Service'
    ],
    limits: {
      jobAnalyses: 2400,
      resumeAnalyses: 600,
      applications: 6000,
      autoFills: 2400,
      interviews: 240
    }
  },

  // Recruiter Plans
  {
    id: 'recruiter_starter_monthly',
    name: 'Recruiter Starter',
    price: 49.99,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'Job Posting',
      'Candidate Search',
      'Basic Analytics',
      'Email Support'
    ],
    limits: {
      jobPostings: 5,
      candidates: 100,
      interviews: 50
    }
  },
  {
    id: 'recruiter_professional_monthly',
    name: 'Recruiter Professional',
    price: 99.99,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'Everything in Starter',
      'Virtual Interview Assignments',
      'Coding Test Creation',
      'Advanced Analytics',
      'Priority Support'
    ],
    limits: {
      jobPostings: 20,
      candidates: 500,
      interviews: 200
    }
  },
  {
    id: 'recruiter_enterprise_monthly',
    name: 'Recruiter Enterprise',
    price: 199.99,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'Everything in Professional',
      'Unlimited Job Postings',
      'Custom Branding',
      'API Access',
      'Dedicated Support'
    ],
    limits: {
      jobPostings: -1, // Unlimited
      candidates: -1,
      interviews: -1
    }
  }
];

export class SubscriptionPaymentService {
  async createSubscriptionOrder(
    userId: string,
    tierId: string,
    paymentMethod: 'paypal' | 'razorpay'
  ): Promise<{ orderId: string; approvalUrl?: string }> {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    if (!tier) {
      throw new Error('Invalid subscription tier');
    }

    // Create subscription record in database (pending)
    const subscription = await db.insert(subscriptions).values({
      userId,
      tier: tierId,
      status: 'pending',
      paymentMethod,
      amount: tier.price,
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      startDate: new Date(),
      endDate: this.calculateEndDate(tier.billingCycle),
      autoRenew: true
    }).returning();

    if (paymentMethod === 'paypal') {
      return this.createPayPalSubscription(tier, subscription[0].id);
    } else {
      return this.createRazorpaySubscription(tier, subscription[0].id);
    }
  }

  private async createPayPalSubscription(
    tier: SubscriptionTier,
    subscriptionId: number
  ): Promise<{ orderId: string }> {
    // For now, create a one-time payment order
    // In production, you'd create a PayPal subscription plan
    const mockRequest = {
      body: {
        amount: tier.price.toString(),
        currency: tier.currency,
        intent: 'CAPTURE'
      }
    } as any;

    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => ({ statusCode: code, ...data })
      })
    } as any;

    await createPaypalOrder(mockRequest, mockResponse);
    
    // In a real implementation, extract the order ID from the response
    return { orderId: `PP_${subscriptionId}_${Date.now()}` };
  }

  private async createRazorpaySubscription(
    tier: SubscriptionTier,
    subscriptionId: number
  ): Promise<{ orderId: string }> {
    // Razorpay integration would go here
    // For now, return a mock order ID
    return { orderId: `RZ_${subscriptionId}_${Date.now()}` };
  }

  async handlePaymentSuccess(
    orderId: string,
    paymentDetails: any
  ): Promise<void> {
    // Extract subscription ID from order ID
    const subscriptionId = this.extractSubscriptionId(orderId);
    
    // Update subscription status to active
    await db.update(subscriptions)
      .set({
        status: 'active',
        paymentId: paymentDetails.id || orderId,
        activatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId));

    // Update user's subscription tier
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId)
    });

    if (subscription) {
      await db.update(userProfiles)
        .set({
          subscriptionTier: subscription.tier,
          subscriptionStatus: 'active'
        })
        .where(eq(userProfiles.userId, subscription.userId));
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    // Mark subscription as cancelled
    await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false
      })
      .where(eq(subscriptions.userId, userId));

    // Update user profile
    await db.update(userProfiles)
      .set({
        subscriptionStatus: 'cancelled'
      })
      .where(eq(userProfiles.userId, userId));
  }

  async getSubscriptionTiers(userType?: 'jobseeker' | 'recruiter'): Promise<SubscriptionTier[]> {
    if (userType) {
      return SUBSCRIPTION_TIERS.filter(tier => tier.userType === userType);
    }
    return SUBSCRIPTION_TIERS;
  }

  async getUserSubscription(userId: string) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)]
    });

    if (!subscription) {
      return null;
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier);
    
    return {
      ...subscription,
      tierDetails: tier,
      isActive: subscription.status === 'active' && new Date() < subscription.endDate,
      daysRemaining: Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    };
  }

  private calculateEndDate(billingCycle: 'monthly' | 'yearly'): Date {
    const now = new Date();
    if (billingCycle === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  private extractSubscriptionId(orderId: string): number {
    // Extract subscription ID from order ID format: PP_123_timestamp or RZ_123_timestamp
    const parts = orderId.split('_');
    return parseInt(parts[1]);
  }

  async processSubscriptionRenewal(subscriptionId: number): Promise<boolean> {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId)
    });

    if (!subscription || !subscription.autoRenew) {
      return false;
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier);
    if (!tier) {
      return false;
    }

    try {
      // Create renewal order (would integrate with PayPal/Razorpay recurring billing)
      const newEndDate = this.calculateEndDate(tier.billingCycle);
      
      await db.update(subscriptions)
        .set({
          endDate: newEndDate,
          renewedAt: new Date()
        })
        .where(eq(subscriptions.id, subscriptionId));

      return true;
    } catch (error) {
      console.error('Failed to renew subscription:', error);
      return false;
    }
  }
}

export const subscriptionPaymentService = new SubscriptionPaymentService();