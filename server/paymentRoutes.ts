import { Express } from 'express';
import { subscriptionService } from './subscriptionService';
import { isAuthenticated } from './auth';
import Stripe from 'stripe';

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

export function setupPaymentRoutes(app: Express) {
  // Create payment intent for subscription
  app.post('/api/payment/create-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { planId, amount, billingCycle, provider } = req.body;
      const userId = req.user.id;

      if (amount === 0) {
        // Handle free plan "downgrade"
        await subscriptionService.updateSubscription(userId, {
          planType: 'free',
          subscriptionStatus: 'free'
        });
        return res.json({ success: true });
      }

      switch (provider) {
        case 'stripe':
          if (!stripe) {
            return res.status(500).json({ error: 'Stripe not configured - STRIPE_SECRET_KEY required' });
          }
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            metadata: {
              userId,
              planId,
              billingCycle
            }
          });
          
          res.json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
          });
          break;

        case 'paypal':
          // PayPal integration would go here
          // For now, return a mock response
          res.json({
            redirectUrl: `/api/payment/paypal/create?planId=${planId}&amount=${amount}&billingCycle=${billingCycle}&userId=${userId}`
          });
          break;

        case 'razorpay':
          // Razorpay integration would go here
          // For now, return a mock response
          res.json({
            redirectUrl: `/api/payment/razorpay/create?planId=${planId}&amount=${amount}&billingCycle=${billingCycle}&userId=${userId}`
          });
          break;

        default:
          res.status(400).json({ error: 'Invalid payment provider' });
      }
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/api/payment/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, planId, billingCycle } = paymentIntent.metadata;

      await subscriptionService.processSuccessfulPayment(userId, {
        planType: planId,
        paymentProvider: 'stripe',
        paymentId: paymentIntent.id,
        billingCycle: billingCycle as 'monthly' | 'annual',
        amount: paymentIntent.amount / 100
      });
    }

    res.json({ received: true });
  });

  // PayPal payment creation
  app.get('/api/payment/paypal/create', async (req, res) => {
    try {
      const { planId, amount, billingCycle, userId } = req.query;
      
      // Mock PayPal payment creation
      // In a real implementation, you would use PayPal SDK here
      const paymentId = `paypal_${Date.now()}`;
      
      await subscriptionService.processSuccessfulPayment(userId as string, {
        planType: planId as string,
        paymentProvider: 'paypal',
        paymentId,
        billingCycle: billingCycle as 'monthly' | 'annual',
        amount: parseFloat(amount as string)
      });

      res.redirect('/recruiter/dashboard?payment=success');
    } catch (error: any) {
      console.error('PayPal payment error:', error);
      res.redirect('/recruiter/premium?payment=error');
    }
  });

  // Razorpay payment creation
  app.get('/api/payment/razorpay/create', async (req, res) => {
    try {
      const { planId, amount, billingCycle, userId } = req.query;
      
      // Mock Razorpay payment creation
      // In a real implementation, you would use Razorpay SDK here
      const paymentId = `razorpay_${Date.now()}`;
      
      await subscriptionService.processSuccessfulPayment(userId as string, {
        planType: planId as string,
        paymentProvider: 'razorpay',
        paymentId,
        billingCycle: billingCycle as 'monthly' | 'annual',
        amount: parseFloat(amount as string)
      });

      res.redirect('/recruiter/dashboard?payment=success');
    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      res.redirect('/recruiter/premium?payment=error');
    }
  });

  // Get user subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await subscriptionService.getUserSubscription(userId);
      const usage = await subscriptionService.getUsageStats(userId);
      
      res.json({
        ...subscription,
        usage
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await subscriptionService.updateSubscription(userId, {
        subscriptionStatus: 'canceled'
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}