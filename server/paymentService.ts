import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });
  console.log('Stripe initialized successfully');
} else {
  console.log('STRIPE_SECRET_KEY not provided - payment features will be disabled');
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      value: string;
      currency_code: string;
    };
  }>;
  payer: {
    email_address: string;
  };
}

interface RazorpayPaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  order_id: string;
}

class PaymentService {
  private paypalAccessToken: string | null = null;
  private paypalTokenExpiry: number = 0;

  async verifyStripePayment(paymentIntentId: string): Promise<boolean> {
    try {
      // Handle demo payment intents for testing
      if (paymentIntentId.includes('_demo')) {
        console.log('Demo payment detected, returning success for testing');
        return true;
      }

      if (!stripe) {
        console.log('Stripe not initialized - treating as demo payment');
        return paymentIntentId.includes('_demo');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify payment is successful and for correct amount ($10)
      return paymentIntent.status === 'succeeded' && 
             paymentIntent.amount === 1000 && // $10.00 in cents
             paymentIntent.currency === 'usd';
    } catch (error) {
      console.error('Stripe verification error:', error);
      
      // If it's a demo payment, allow it for testing
      if (paymentIntentId.includes('_demo')) {
        return true;
      }
      
      return false;
    }
  }

  // Create Stripe payment intent
  async createStripePaymentIntent(amount: number, currency: string = 'usd') {
    if (!stripe) {
      throw new Error('Stripe not initialized - STRIPE_SECRET_KEY required');
    }
    return await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card', 'link', 'us_bank_account'],
    });
  }

  // Create PayPal order
  async createPaypalOrder(amount: number, currency: string = 'USD') {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    // Get access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2) // Convert cents to dollars
          }
        }]
      })
    });

    return await orderResponse.json();
  }

  // Create Razorpay order
  async createRazorpayOrder(amount: number, currency: string = 'USD') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // For now, return a mock order since Razorpay integration would need API setup
    return {
      id: `razorpay_order_${Date.now()}`,
      amount,
      currency,
      status: 'created'
    };
  }

  async createStripeSubscription(customerId: string, email: string): Promise<string | null> {
    try {
      let customer;
      
      if (customerId) {
        customer = await stripe.customers.retrieve(customerId);
      } else {
        customer = await stripe.customers.create({
          email: email,
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID!,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription.id;
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      return null;
    }
  }

  private async getPayPalAccessToken(): Promise<string | null> {
    try {
      // Check if we have a valid token
      if (this.paypalAccessToken && Date.now() < this.paypalTokenExpiry) {
        return this.paypalAccessToken;
      }

      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64');

      const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.paypalAccessToken = data.access_token;
        this.paypalTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
        return this.paypalAccessToken;
      }

      return null;
    } catch (error) {
      console.error('PayPal token error:', error);
      return null;
    }
  }

  async verifyPayPalOrder(orderId: string): Promise<boolean> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return false;

      const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const order: PayPalOrderResponse = await response.json();
      
      // Verify order is completed and for correct amount ($10)
      return order.status === 'COMPLETED' && 
             order.purchase_units[0]?.amount.value === '10.00' &&
             order.purchase_units[0]?.amount.currency_code === 'USD';
    } catch (error) {
      console.error('PayPal verification error:', error);
      return false;
    }
  }

  async verifyPayPalSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return false;

      const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const subscription = await response.json();
      
      // Verify subscription is active
      return subscription.status === 'ACTIVE';
    } catch (error) {
      console.error('PayPal subscription verification error:', error);
      return false;
    }
  }

  verifyRazorpayPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    amount: number = 1000 // ₹10.00 in paise
  ): boolean {
    try {
      // Handle demo payments for testing
      if (paymentId.includes('_demo') || orderId.includes('_demo')) {
        console.log('Demo Razorpay payment detected, returning success for testing');
        return true;
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Razorpay verification error:', error);
      
      // If it's a demo payment, allow it for testing
      if (paymentId.includes('_demo') || orderId.includes('_demo')) {
        return true;
      }
      
      return false;
    }
  }

  async fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResponse | null> {
    try {
      const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
      
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Razorpay fetch error:', error);
      return null;
    }
  }

  async createRazorpayOrder(amount: number = 1000): Promise<any> {
    try {
      const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
      
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount, // Amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();