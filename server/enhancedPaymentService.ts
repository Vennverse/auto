import { paymentService } from './paymentService';

interface PaymentProvider {
  name: 'stripe' | 'paypal' | 'razorpay';
  enabled: boolean;
  priority: number;
}

interface RetakePaymentData {
  amount: number;
  currency: string;
  provider?: 'stripe' | 'paypal' | 'razorpay';
  metadata?: any;
}

export class EnhancedPaymentService {
  private availableProviders: PaymentProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Check which payment providers are available
    const providers: PaymentProvider[] = [
      {
        name: 'stripe',
        enabled: !!process.env.STRIPE_SECRET_KEY,
        priority: 1
      },
      {
        name: 'paypal',
        enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        priority: 2
      },
      {
        name: 'razorpay',
        enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        priority: 3
      }
    ];

    this.availableProviders = providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    console.log('Enhanced Payment Service initialized with providers:', 
      this.availableProviders.map(p => p.name).join(', '));
  }

  getAvailableProviders(): string[] {
    return this.availableProviders.map(p => p.name);
  }

  getPreferredProvider(): string | null {
    return this.availableProviders.length > 0 ? this.availableProviders[0].name : null;
  }

  async createRetakePayment(
    interviewId: number,
    interviewType: 'virtual' | 'mock' | 'coding',
    userId: string,
    paymentData: RetakePaymentData
  ) {
    const preferredProvider = paymentData.provider || this.getPreferredProvider();
    
    if (!preferredProvider) {
      throw new Error('No payment providers are configured');
    }

    // Standard retake pricing
    const amount = paymentData.amount || this.getRetakePrice(interviewType);
    const currency = paymentData.currency || 'USD';

    const paymentRecord = {
      userId,
      interviewId,
      interviewType,
      amount,
      currency,
      status: 'pending',
      paymentProvider: preferredProvider,
      metadata: {
        retakeAttempt: true,
        originalAmount: amount,
        ...paymentData.metadata
      }
    };

    try {
      let paymentResult;

      switch (preferredProvider) {
        case 'stripe':
          paymentResult = await this.createStripePayment(paymentRecord);
          break;
        case 'paypal':
          paymentResult = await this.createPayPalPayment(paymentRecord);
          break;
        case 'razorpay':
          paymentResult = await this.createRazorpayPayment(paymentRecord);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${preferredProvider}`);
      }

      return {
        payment: paymentRecord,
        paymentResult,
        provider: preferredProvider,
        clientSecret: paymentResult.client_secret || paymentResult.clientSecret,
        paymentIntentId: paymentResult.id
      };
    } catch (error) {
      console.error(`Payment creation failed with ${preferredProvider}:`, error);
      
      // Try fallback providers
      const fallbackProviders = this.availableProviders
        .filter(p => p.name !== preferredProvider)
        .map(p => p.name);

      if (fallbackProviders.length > 0) {
        console.log(`Attempting fallback to: ${fallbackProviders[0]}`);
        return this.createRetakePayment(interviewId, interviewType, userId, {
          ...paymentData,
          provider: fallbackProviders[0] as any
        });
      }

      throw error;
    }
  }

  private getRetakePrice(interviewType: 'virtual' | 'mock' | 'coding'): number {
    const prices = {
      virtual: 2500, // $25.00
      mock: 1500,    // $15.00
      coding: 2000   // $20.00
    };
    return prices[interviewType] || 2500;
  }

  private async createStripePayment(paymentRecord: any) {
    // Use existing payment service
    return paymentService.createPaymentIntent(
      paymentRecord.amount,
      paymentRecord.currency,
      {
        interviewId: paymentRecord.interviewId,
        interviewType: paymentRecord.interviewType,
        userId: paymentRecord.userId,
        type: 'retake_payment'
      }
    );
  }

  private async createPayPalPayment(paymentRecord: any) {
    // PayPal integration for retake payments
    const paypalAmount = (paymentRecord.amount / 100).toFixed(2); // Convert cents to dollars
    
    const paypalData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: paymentRecord.currency,
          value: paypalAmount
        },
        description: `${paymentRecord.interviewType} Interview Retake`,
        custom_id: `retake_${paymentRecord.interviewId}_${paymentRecord.userId}`,
        invoice_id: `INV_${Date.now()}_${paymentRecord.interviewId}`
      }],
      application_context: {
        brand_name: 'AutoJobr',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    };

    // This would integrate with PayPal SDK
    // For now, return a mock structure that matches PayPal response
    return {
      id: `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'CREATED',
      intent: 'CAPTURE',
      purchase_units: paypalData.purchase_units,
      create_time: new Date().toISOString(),
      links: [
        {
          href: `${process.env.FRONTEND_URL}/payment/paypal/approval`,
          rel: 'approve',
          method: 'REDIRECT'
        }
      ]
    };
  }

  private async createRazorpayPayment(paymentRecord: any) {
    // Razorpay integration for retake payments
    const razorpayData = {
      amount: paymentRecord.amount, // Razorpay expects amount in smallest currency unit
      currency: paymentRecord.currency,
      receipt: `retake_${paymentRecord.interviewId}_${Date.now()}`,
      notes: {
        interview_id: paymentRecord.interviewId.toString(),
        interview_type: paymentRecord.interviewType,
        user_id: paymentRecord.userId,
        type: 'retake_payment'
      }
    };

    // This would integrate with Razorpay SDK
    // For now, return a mock structure that matches Razorpay response
    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: razorpayData.amount,
      amount_paid: 0,
      amount_due: razorpayData.amount,
      currency: razorpayData.currency,
      receipt: razorpayData.receipt,
      status: 'created',
      attempts: 0,
      notes: razorpayData.notes,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  async verifyPayment(paymentId: string, provider: string) {
    switch (provider) {
      case 'stripe':
        return paymentService.getPaymentIntent(paymentId);
      case 'paypal':
        return this.verifyPayPalPayment(paymentId);
      case 'razorpay':
        return this.verifyRazorpayPayment(paymentId);
      default:
        throw new Error(`Unsupported payment provider for verification: ${provider}`);
    }
  }

  private async verifyPayPalPayment(paymentId: string) {
    // PayPal payment verification logic
    // This would check payment status with PayPal API
    return {
      id: paymentId,
      status: 'COMPLETED', // Would come from actual PayPal API
      verified: true
    };
  }

  private async verifyRazorpayPayment(paymentId: string) {
    // Razorpay payment verification logic  
    // This would check payment status with Razorpay API
    return {
      id: paymentId,
      status: 'captured', // Would come from actual Razorpay API
      verified: true
    };
  }

  // Get payment methods available for the user's region/preferences
  async getPaymentMethodsForUser(userId: string, country?: string) {
    const methods = [];

    for (const provider of this.availableProviders) {
      const method = {
        provider: provider.name,
        name: this.getProviderDisplayName(provider.name),
        enabled: true,
        preferredForCountry: this.isPreferredForCountry(provider.name, country),
        fees: this.getProviderFees(provider.name)
      };
      methods.push(method);
    }

    return methods.sort((a, b) => {
      if (a.preferredForCountry && !b.preferredForCountry) return -1;
      if (!a.preferredForCountry && b.preferredForCountry) return 1;
      return 0;
    });
  }

  private getProviderDisplayName(provider: string): string {
    const names = {
      stripe: 'Credit/Debit Card',
      paypal: 'PayPal',
      razorpay: 'Razorpay (UPI, Cards, Wallets)'
    };
    return names[provider] || provider;
  }

  private isPreferredForCountry(provider: string, country?: string): boolean {
    if (!country) return false;
    
    const preferences = {
      'US': ['stripe', 'paypal'],
      'IN': ['razorpay', 'paypal'],
      'UK': ['stripe', 'paypal'],
      'CA': ['stripe', 'paypal']
    };

    return preferences[country]?.includes(provider) || false;
  }

  private getProviderFees(provider: string): string {
    const fees = {
      stripe: '2.9% + $0.30',
      paypal: '2.9% + $0.30',
      razorpay: '2% + ₹2'
    };
    return fees[provider] || 'Standard processing fees apply';
  }
}

export const enhancedPaymentService = new EnhancedPaymentService();