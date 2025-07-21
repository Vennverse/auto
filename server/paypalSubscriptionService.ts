import axios from 'axios';
import { db } from './db';
import { subscriptions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface PayPalAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
}

interface PayPalSubscription {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  subscriber: {
    email_address: string;
    payer_id: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalSubscriptionService {
  private readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

  // Product and Plan IDs (these would be created once and stored)
  // Dynamic plan creation - we'll create plans on demand based on subscription tiers
  private readonly PRODUCT_CATEGORIES = {
    JOBSEEKER: 'SOFTWARE',
    RECRUITER: 'SOFTWARE'
  };

  constructor() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      console.warn('PayPal credentials not configured - subscription features will be disabled');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/oauth2/token`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
        },
        data: 'grant_type=client_credentials'
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('PayPal token error:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  // Create or get existing product for a subscription tier
  async createOrGetProduct(tierName: string, userType: 'jobseeker' | 'recruiter'): Promise<string> {
    const token = await this.getAccessToken();
    
    const productData = {
      name: `AutoJobr ${tierName} - ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
      description: `${tierName} subscription plan for ${userType}s on AutoJobr platform`,
      type: "SERVICE",
      category: this.PRODUCT_CATEGORIES[userType.toUpperCase() as keyof typeof this.PRODUCT_CATEGORIES],
      image_url: "https://your-domain.com/logo.png", // You can add your logo URL
      home_url: "https://autojobr.com"
    };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/catalogs/products`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: productData
      });
      
      return response.data.id;
    } catch (error: any) {
      console.error('PayPal product creation error:', error.response?.data);
      throw new Error('Failed to create PayPal product');
    }
  }

  // Create billing plan for a product
  async createBillingPlan(productId: string, price: number, currency: string = 'USD', tierName: string): Promise<string> {
    const token = await this.getAccessToken();
    
    const planData = {
      product_id: productId,
      name: `${tierName} Monthly Plan`,
      description: `Monthly subscription for ${tierName}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 means infinite cycles
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: currency
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0",
        inclusive: false
      }
    };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/plans`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: planData
      });
      
      return response.data.id;
    } catch (error: any) {
      console.error('PayPal plan creation error:', error.response?.data);
      throw new Error('Failed to create PayPal billing plan');
    }
  }

  async createSubscription(userId: string, tierName: string, price: number, userType: 'jobseeker' | 'recruiter', userEmail: string): Promise<{
    subscriptionId: string;
    approvalUrl: string;
  }> {
    try {
      // Create product and plan
      const productId = await this.createOrGetProduct(tierName, userType);
      const planId = await this.createBillingPlan(productId, price, 'USD', tierName);
      
      const token = await this.getAccessToken();
      
      const subscriptionData = {
        plan_id: planId,
        start_time: new Date().toISOString(),
        subscriber: {
          email_address: userEmail
        },
        application_context: {
          brand_name: "AutoJobr",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
          },
          return_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscription/success?userId=${userId}`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscription/cancel`
        }
      };

      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: subscriptionData
      });

      const subscription = response.data;
      const approvalLink = subscription.links.find((link: any) => link.rel === 'approve');
      
      if (!approvalLink) {
        throw new Error('No approval URL received from PayPal');
      }

      return {
        subscriptionId: subscription.id,
        approvalUrl: approvalLink.href
      };
    } catch (error: any) {
      console.error('PayPal subscription creation error:', error.response?.data || error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  // Cancel a PayPal subscription
  async cancelSubscription(subscriptionId: string, reason: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    try {
      await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: reason
        }
      });

      // Update subscription status in database
      await db.update(subscriptions)
        .set({ 
          status: 'cancelled',
          cancelledAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      return true;
    } catch (error: any) {
      console.error('PayPal subscription cancellation error:', error.response?.data || error);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  async verifySubscription(subscriptionId: string): Promise<{
    status: string;
    subscriberEmail: string;
    nextBillingTime?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const subscription: PayPalSubscription = response.data;

      return {
        status: subscription.status,
        subscriberEmail: subscription.subscriber?.email_address || '',
        nextBillingTime: subscription.start_time
      };
    } catch (error) {
      console.error('PayPal subscription verification error:', error);
      throw new Error('Failed to verify PayPal subscription');
    }
  }

  async activateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Update database subscription status
      await db.update(subscriptions)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      // Update user subscription status
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.paypalSubscriptionId, subscriptionId)
      });

      if (subscription) {
        await db.update(users)
          .set({
            planType: 'premium',
            subscriptionStatus: 'active',
            updatedAt: new Date()
          })
          .where(eq(users.id, subscription.userId));
      }

      return true;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw new Error('Failed to activate subscription');
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        data: { reason }
      });

      // Update database
      await db.update(subscriptions)
        .set({ 
          status: 'cancelled',
          canceledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      // Update user status
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.paypalSubscriptionId, subscriptionId)
      });

      if (subscription) {
        await db.update(users)
          .set({
            planType: 'free',
            subscriptionStatus: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(users.id, subscription.userId));
      }

      return true;
    } catch (error) {
      console.error('PayPal subscription cancellation error:', error);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  getPlanIdForTier(userType: 'jobseeker' | 'recruiter', tierName: string): string {
    if (userType === 'jobseeker') {
      if (tierName.includes('Basic')) return this.PLANS.JOBSEEKER_BASIC_MONTHLY;
      if (tierName.includes('Premium')) return this.PLANS.JOBSEEKER_PREMIUM_MONTHLY;
    } else if (userType === 'recruiter') {
      if (tierName.includes('Starter')) return this.PLANS.RECRUITER_STARTER_MONTHLY;
      if (tierName.includes('Professional')) return this.PLANS.RECRUITER_PROFESSIONAL_MONTHLY;
      if (tierName.includes('Enterprise')) return this.PLANS.RECRUITER_ENTERPRISE_MONTHLY;
    }
    
    throw new Error('Invalid user type or tier name');
  }

  // Check if user has active premium subscription
  async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      return user?.subscriptionStatus === 'active' && user?.planType === 'premium';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }
}

export const paypalSubscriptionService = new PayPalSubscriptionService();