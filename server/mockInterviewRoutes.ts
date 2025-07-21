import { Router } from 'express';
import { mockInterviewService } from './mockInterviewService';
import { storage } from './storage';
import { isAuthenticated } from './auth';
import { paymentService } from './paymentService';
import { pistonService } from './pistonService';
import { mockInterviewPaymentService } from './mockInterviewPaymentService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const startInterviewSchema = z.object({
  role: z.string().min(1),
  company: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  interviewType: z.enum(['technical', 'behavioral', 'system_design']),
  language: z.string().default('javascript'),
  totalQuestions: z.number().min(1).max(10).default(3)
});

const submitAnswerSchema = z.object({
  questionId: z.number(),
  answer: z.string(),
  code: z.string().optional(),
  timeSpent: z.number().optional()
});

const executeCodeSchema = z.object({
  code: z.string(),
  language: z.string(),
  testCases: z.array(z.object({
    input: z.any(),
    expected: z.any(),
    description: z.string()
  })).optional()
});

// Check usage and payment requirements
router.get("/usage", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const usageInfo = await mockInterviewPaymentService.checkUsageAndPayment(userId);
    res.json(usageInfo);
  } catch (error) {
    console.error('Error checking mock interview usage:', error);
    res.status(500).json({ error: 'Failed to check usage limits' });
  }
});

// Get user's interview stats
router.get('/stats', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const stats = await storage.getUserInterviewStats(userId);
    const usageInfo = await mockInterviewPaymentService.checkUsageAndPayment(userId);
    
    res.json({
      ...stats,
      ...usageInfo
    });
  } catch (error) {
    console.error('Error fetching interview stats:', error);
    res.status(500).json({ error: 'Failed to fetch interview stats' });
  }
});

// Get user's interview history
router.get('/history', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const interviews = await storage.getMockInterviews(userId);
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
});

// Start/Activate an assigned mock interview session
router.post('/:sessionId/start', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const interview = await storage.getMockInterviewBySessionId(sessionId, userId);
    if (!interview) {
      return res.status(404).json({ error: 'Mock interview session not found' });
    }

    if (interview.status === 'active') {
      return res.json({ message: 'Interview already started', interview });
    }

    // Activate the interview
    await storage.updateMockInterview(interview.id, {
      status: 'active',
      startTime: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: 'Mock interview started successfully' });

  } catch (error) {
    console.error('Error starting mock interview:', error);
    res.status(500).json({ error: 'Failed to start mock interview' });
  }
});

// Start a new interview
router.post('/start', isAuthenticated, async (req: any, res) => {
  try {
    const { isPaid, paymentVerificationId, ...config } = req.body;
    const userId = req.user.id;
    const parsedConfig = startInterviewSchema.parse(config);
    
    console.log('🔍 Starting mock interview for user:', userId, 'with config:', parsedConfig);
    
    // STRICT PAYMENT ENFORCEMENT: Check usage limits and require payment verification
    const usageInfo = await mockInterviewPaymentService.checkUsageAndPayment(userId);
    
    // Block ALL users who require payment unless they have verified payment
    if (usageInfo.requiresPayment) {
      // Must have payment verification for paid access
      if (!isPaid || !paymentVerificationId) {
        return res.status(402).json({
          error: 'Payment verification required',
          message: 'You must complete payment through PayPal or Razorpay to start this mock interview.',
          requiresPayment: true,
          cost: usageInfo.cost,
          paymentMethods: ['PayPal', 'Razorpay']
        });
      }
      
      // Verify payment transaction was actually processed
      if (!paymentVerificationId.startsWith('PAYPAL_') && !paymentVerificationId.startsWith('RAZORPAY_')) {
        return res.status(402).json({
          error: 'Invalid payment verification',
          message: 'Payment verification failed. Please complete payment through PayPal or Razorpay and try again.',
          requiresPayment: true,
          cost: usageInfo.cost
        });
      }
    }
    
    // Additional check: Even free users must have explicit permission
    if (!usageInfo.canStartInterview && !isPaid) {
      return res.status(403).json({
        error: 'Interview access denied',
        message: usageInfo.message,
        requiresPayment: usageInfo.requiresPayment,
        cost: usageInfo.cost
      });
    }
    
    const interview = await mockInterviewService.startInterview(userId, parsedConfig);
    
    console.log('🔍 Mock interview created:', interview);
    
    if (!interview || !interview.sessionId) {
      console.error('❌ Mock interview creation failed - no sessionId returned');
      return res.status(500).json({ error: 'Interview creation failed' });
    }
    
    // Record the interview start in usage tracking
    await mockInterviewPaymentService.recordInterviewStart(userId, isPaid || false);
    
    // Ensure dates are properly serialized
    const response = {
      ...interview,
      startTime: interview.startTime?.toISOString(),
      endTime: interview.endTime?.toISOString(),
      createdAt: interview.createdAt?.toISOString(),
      updatedAt: interview.updatedAt?.toISOString()
    };
    
    console.log('🔍 Sending response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Get interview session with questions (both URL param and query param support)
router.get('/session/:sessionId', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const interviewData = await mockInterviewService.getInterviewWithQuestions(sessionId);
    
    if (!interviewData) {
      return res.status(404).json({ error: 'Interview session not found' });
    }
    
    // Verify user owns this interview
    if (interviewData.interview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to interview' });
    }
    
    res.json(interviewData);
  } catch (error) {
    console.error('Error fetching interview session:', error);
    res.status(500).json({ error: 'Failed to fetch interview session' });
  }
});

// Get interview session with questions (alternative route for frontend compatibility)
router.get('/session', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user.id;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const interviewData = await mockInterviewService.getInterviewWithQuestions(sessionId as string);
    
    if (!interviewData) {
      return res.status(404).json({ error: 'Interview session not found' });
    }
    
    // Verify user owns this interview
    if (interviewData.interview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to interview' });
    }
    
    res.json(interviewData);
  } catch (error) {
    console.error('Error fetching interview session:', error);
    res.status(500).json({ error: 'Failed to fetch interview session' });
  }
});

// Submit answer to a question
router.post('/answer', isAuthenticated, async (req: any, res) => {
  try {
    const { questionId, answer, code, timeSpent } = submitAnswerSchema.parse(req.body);
    
    // Verify user owns this question's interview
    const question = await storage.getMockInterviewQuestion(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const interview = await storage.getMockInterview(question.interviewId);
    if (!interview || interview.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    await mockInterviewService.submitAnswer(questionId, answer, code);
    
    // Update time spent if provided
    if (timeSpent) {
      await storage.updateMockInterviewQuestion(questionId, { timeSpent });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Execute code with test cases
router.post('/execute-code', isAuthenticated, async (req: any, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }
    
    const result = await pistonService.executeCode(code, language, testCases || []);
    res.json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Complete an interview
router.post('/complete/:sessionId', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Verify user owns this interview
    const interviewData = await mockInterviewService.getInterviewWithQuestions(sessionId);
    if (!interviewData || interviewData.interview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const completedInterview = await mockInterviewService.completeInterview(sessionId);
    res.json(completedInterview);
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// Get interview results
router.get('/results/:sessionId', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const interviewData = await mockInterviewService.getInterviewWithQuestions(sessionId);
    
    if (!interviewData || interviewData.interview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (interviewData.interview.status !== 'completed') {
      return res.status(400).json({ error: 'Interview not completed yet' });
    }
    
    res.json({
      interview: interviewData.interview,
      questions: interviewData.questions,
      overallScore: interviewData.interview.score,
      feedback: interviewData.interview.feedback
    });
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({ error: 'Failed to fetch interview results' });
  }
});

// Payment routes for mock interviews
router.post('/payment', isAuthenticated, async (req: any, res) => {
  try {
    const { amount, currency, method, item } = req.body;
    const userId = req.user.id;
    
    // Validate payment amount for mock interviews
    if (amount !== 2.00) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    if (method === 'stripe') {
      // Create Stripe payment intent
      const paymentIntent = await paymentService.createStripePaymentIntent({
        amount: amount * 100, // Convert to cents
        currency: currency || 'usd',
        metadata: {
          userId,
          type: 'mock_interview',
          item
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else if (method === 'razorpay') {
      // Create Razorpay order
      const order = await paymentService.createRazorpayOrder({
        amount: amount * 100, // Convert to paise
        currency: currency || 'USD',
        receipt: `mock_interview_${Date.now()}`,
        notes: {
          userId,
          type: 'mock_interview',
          item
        }
      });
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        email: req.user.email || '',
        phone: req.user.phone || ''
      });
    } else if (method === 'paypal') {
      // Create PayPal order
      const order = await paymentService.createPaypalOrder({
        amount: amount.toString(),
        currency: currency || 'USD',
        description: 'Mock Interview Practice',
        metadata: {
          userId,
          type: 'mock_interview',
          item
        }
      });
      
      res.json({
        orderId: order.id,
        approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href
      });
    } else {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Handle payment success
router.post('/payment/success', isAuthenticated, async (req: any, res) => {
  try {
    const { paymentId, method } = req.body;
    const userId = req.user.id;
    
    // Verify payment based on method
    let isPaymentValid = false;
    
    if (method === 'stripe') {
      isPaymentValid = await paymentService.verifyStripePayment(paymentId);
    } else if (method === 'razorpay') {
      isPaymentValid = await paymentService.verifyRazorpayPayment(paymentId);
    } else if (method === 'paypal') {
      isPaymentValid = await paymentService.verifyPaypalPayment(paymentId);
    }
    
    if (isPaymentValid) {
      // Grant additional interview credits
      await mockInterviewService.addInterviewCredits(userId, 1);
      
      res.json({ 
        success: true, 
        message: 'Payment successful! You can now start your mock interview.' 
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Execute code with Piston API
router.post('/execute-code', isAuthenticated, async (req: any, res) => {
  try {
    const { code, language, testCases } = executeCodeSchema.parse(req.body);
    
    // Execute code using Piston API
    const result = await pistonService.executeCode(code, language, testCases || []);
    
    res.json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Get available programming languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await pistonService.getAvailableLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch available languages' });
  }
});

// Get boilerplate code for a language
router.get('/boilerplate/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const boilerplate = pistonService.getBoilerplate(language);
    res.json({ boilerplate });
  } catch (error) {
    console.error('Error getting boilerplate:', error);
    res.status(500).json({ error: 'Failed to get boilerplate code' });
  }
});



export { router as mockInterviewRoutes };