import { Router } from "express";
import { db } from "./db";
import { virtualInterviews, virtualInterviewMessages, virtualInterviewFeedback, virtualInterviewStats } from "@shared/schema";
import { isAuthenticated } from "./auth";
import { virtualInterviewService } from "./virtualInterviewService";
import { virtualInterviewPaymentService } from "./virtualInterviewPaymentService";
import { aiDetectionService } from "./aiDetectionService";
import { behavioralQuestionService } from "./behavioralQuestions";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Check usage and payment requirements
router.get("/usage", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const usageInfo = await virtualInterviewPaymentService.checkUsageAndPayment(userId);
    res.json(usageInfo);
  } catch (error) {
    console.error('Error checking virtual interview usage:', error);
    res.status(500).json({ error: 'Failed to check usage limits' });
  }
});

// Create payment intent for virtual interview
router.post("/payment-intent", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const paymentInfo = await virtualInterviewPaymentService.createPaymentIntent(userId);
    
    // For now, just return the payment info without Stripe integration
    // Real implementation would create Stripe PaymentIntent here
    res.json({
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      description: `Virtual Interview Session - $${virtualInterviewPaymentService.getInterviewCost()}`,
      clientSecret: `mock_payment_intent_${Date.now()}` // Mock for testing
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Start a new virtual interview session
router.post("/start", isAuthenticated, async (req: any, res) => {
  try {
    const { interviewType, role, company, difficulty, duration, personality, style, jobDescription, isPaid } = req.body;
    const userId = req.user.id;
    
    // STRICT PAYMENT ENFORCEMENT: Check usage limits and require payment verification
    const usageInfo = await virtualInterviewPaymentService.checkUsageAndPayment(userId);
    
    // Block ALL users who require payment unless they have verified payment
    if (usageInfo.requiresPayment) {
      // Must have payment verification for paid access
      if (!isPaid || !req.body.paymentVerificationId) {
        return res.status(402).json({
          error: 'Payment verification required',
          message: 'You must complete payment through PayPal or Razorpay to start this interview.',
          requiresPayment: true,
          cost: usageInfo.cost,
          paymentMethods: ['PayPal', 'Razorpay']
        });
      }
      
      // Verify payment transaction was actually processed (mock verification for now)
      if (!req.body.paymentVerificationId.startsWith('PAYPAL_') && !req.body.paymentVerificationId.startsWith('RAZORPAY_')) {
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
    
    // Generate unique session ID
    const sessionId = `virtual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user context for personalized questions
    const userProfile = await db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, userId)
    });
    
    const resumeContext = userProfile ? 
      `Experience: ${userProfile.yearsExperience || 0} years, Skills: ${userProfile.summary || 'Not specified'}` 
      : undefined;

    // Create interview session
    const [interview] = await db.insert(virtualInterviews).values({
      userId,
      sessionId,
      interviewType: interviewType || 'technical',
      role: role || 'software_engineer',
      company,
      difficulty: difficulty || 'medium',
      duration: duration || 30,
      interviewerPersonality: personality || 'professional',
      interviewStyle: style || 'conversational',
      jobDescription,
      resumeContext,
      timeRemaining: (duration || 30) * 60, // Convert to seconds
    }).returning();

    // Generate and send greeting message
    const greeting = await virtualInterviewService.generateGreeting(
      personality || 'professional',
      role || 'software_engineer',
      company
    );

    // Insert greeting message
    await db.insert(virtualInterviewMessages).values({
      interviewId: interview.id,
      sender: 'interviewer',
      messageType: 'text',
      content: greeting,
      messageIndex: 1
    });

    // Record the interview start in usage tracking
    await virtualInterviewPaymentService.recordInterviewStart(userId, isPaid || false);

    res.json({
      success: true,
      interview: {
        id: interview.id,
        sessionId: interview.sessionId,
        status: interview.status,
        timeRemaining: interview.timeRemaining
      },
      greeting
    });

  } catch (error) {
    console.error('Error starting virtual interview:', error);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// Start/Activate an assigned interview session
router.post("/:sessionId/start", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    if (interview.status === 'active') {
      return res.json({ message: 'Interview already started', interview });
    }

    // Activate the interview
    await db.update(virtualInterviews)
      .set({
        status: 'active',
        startTime: new Date(),
        currentStep: 'interviewing',
        updatedAt: new Date()
      })
      .where(eq(virtualInterviews.id, interview.id));

    // Check if initial messages exist, if not create them
    const existingMessages = await db.query.virtualInterviewMessages.findMany({
      where: eq(virtualInterviewMessages.interviewId, interview.id)
    });

    if (existingMessages.length === 0) {
      // Create greeting and first question
      const greeting = await virtualInterviewService.generateGreeting(
        interview.interviewerPersonality,
        interview.role,
        interview.company
      );

      await db.insert(virtualInterviewMessages).values({
        interviewId: interview.id,
        sender: 'interviewer',
        messageType: 'text',
        content: greeting,
        messageIndex: 1
      });

      // Generate first question
      const question = await virtualInterviewService.generateQuestion(
        interview.interviewType,
        interview.difficulty,
        interview.role,
        1,
        [],
        interview.resumeContext || undefined
      );

      await db.insert(virtualInterviewMessages).values({
        interviewId: interview.id,
        sender: 'interviewer',
        messageType: 'question',
        content: question.question,
        messageIndex: 2,
        questionCategory: interview.interviewType,
        difficulty: interview.difficulty
      });

      // Update questions asked
      await db.update(virtualInterviews)
        .set({ questionsAsked: 1 })
        .where(eq(virtualInterviews.id, interview.id));
    }

    res.json({ success: true, message: 'Interview started successfully' });

  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Get interview session details
router.get("/:sessionId", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Get all messages for this interview
    const messages = await db.query.virtualInterviewMessages.findMany({
      where: eq(virtualInterviewMessages.interviewId, interview.id),
      orderBy: [virtualInterviewMessages.messageIndex]
    });

    // Calculate actual time remaining based on start time and duration
    let actualTimeRemaining = interview.timeRemaining;
    if (interview.startTime && interview.status === 'active') {
      const elapsedSeconds = Math.floor((Date.now() - new Date(interview.startTime).getTime()) / 1000);
      actualTimeRemaining = Math.max(0, (interview.duration * 60) - elapsedSeconds);
      
      // Update time remaining in database
      if (actualTimeRemaining !== interview.timeRemaining) {
        await db.update(virtualInterviews)
          .set({ timeRemaining: actualTimeRemaining })
          .where(eq(virtualInterviews.id, interview.id));
      }
      
      // Auto-complete if time is up
      if (actualTimeRemaining <= 0 && interview.status === 'active') {
        await db.update(virtualInterviews)
          .set({ status: 'completed', endTime: new Date() })
          .where(eq(virtualInterviews.id, interview.id));
      }
    }

    res.json({
      interview: {
        ...interview,
        timeRemaining: actualTimeRemaining
      },
      messages
    });

  } catch (error) {
    console.error('Error fetching interview session:', error);
    res.status(500).json({ error: 'Failed to fetch interview session' });
  }
});

// Send message/response in interview
router.post("/:sessionId/message", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.id;

    // Get interview session
    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({ error: 'Interview session is not active' });
    }

    // Get current message count
    const messageCount = await db.query.virtualInterviewMessages.findMany({
      where: eq(virtualInterviewMessages.interviewId, interview.id)
    });

    const nextIndex = messageCount.length + 1;

    // Insert candidate's message
    const [candidateMessage] = await db.insert(virtualInterviewMessages).values({
      interviewId: interview.id,
      sender: 'candidate',
      messageType,
      content,
      messageIndex: nextIndex,
      responseTime: Math.floor(Math.random() * 30) + 10 // Mock response time for now
    }).returning();

    // Get previous messages for context
    const recentMessages = await db.query.virtualInterviewMessages.findMany({
      where: eq(virtualInterviewMessages.interviewId, interview.id),
      orderBy: [desc(virtualInterviewMessages.messageIndex)],
      limit: 5
    });

    // Analyze the response if it's an answer to a question
    const lastInterviewerMessage = recentMessages.find(m => m.sender === 'interviewer' && m.messageType === 'question');
    let analysis = null;
    
    if (lastInterviewerMessage && messageType === 'answer') {
      analysis = await virtualInterviewService.analyzeResponse(
        lastInterviewerMessage.content,
        content,
        [], // We'll implement keyword extraction later
        lastInterviewerMessage.questionCategory || 'general'
      );

      // Update the candidate message with analysis
      await db.update(virtualInterviewMessages)
        .set({
          responseQuality: analysis.responseQuality,
          technicalAccuracy: analysis.technicalAccuracy,
          clarityScore: analysis.clarityScore,
          depthScore: analysis.depthScore,
          keywordsMatched: analysis.keywordsMatched,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence
        })
        .where(eq(virtualInterviewMessages.id, candidateMessage.id));
    }

    // Generate AI response
    let aiResponse = '';
    let aiMessageType = 'text';

    if (interview.questionsAsked < interview.totalQuestions) {
      // Generate next question
      const previousResponses = recentMessages
        .filter(m => m.sender === 'candidate')
        .map(m => m.content);

      const question = await virtualInterviewService.generateQuestion(
        interview.interviewType,
        interview.difficulty,
        interview.role,
        interview.questionsAsked + 1,
        previousResponses,
        interview.resumeContext || undefined
      );

      aiResponse = question.question;
      aiMessageType = 'question';

      // Update interview progress
      await db.update(virtualInterviews)
        .set({ 
          questionsAsked: interview.questionsAsked + 1,
          currentStep: interview.questionsAsked + 1 >= interview.totalQuestions ? 'conclusion' : 'main_questions'
        })
        .where(eq(virtualInterviews.id, interview.id));

    } else if (analysis && lastInterviewerMessage) {
      // Generate follow-up or closing
      aiResponse = await virtualInterviewService.generateFollowUp(
        lastInterviewerMessage.content,
        content,
        analysis,
        interview.interviewerPersonality
      );
      
      // Mark interview as completed
      await db.update(virtualInterviews)
        .set({ 
          status: 'completed',
          endTime: new Date(),
          currentStep: 'conclusion'
        })
        .where(eq(virtualInterviews.id, interview.id));

    } else {
      aiResponse = "Thank you for your response. Let me ask you another question.";
    }

    // Insert AI response
    await db.insert(virtualInterviewMessages).values({
      interviewId: interview.id,
      sender: 'interviewer',
      messageType: aiMessageType,
      content: aiResponse,
      messageIndex: nextIndex + 1,
      questionCategory: aiMessageType === 'question' ? interview.interviewType : undefined,
      difficulty: interview.difficulty
    });

    res.json({
      success: true,
      candidateMessage,
      aiResponse: {
        content: aiResponse,
        type: aiMessageType
      },
      analysis,
      interviewStatus: interview.status
    });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Complete interview and generate feedback
router.post("/:sessionId/complete", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get interview session
    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Get all messages
    const messages = await db.query.virtualInterviewMessages.findMany({
      where: eq(virtualInterviewMessages.interviewId, interview.id),
      orderBy: [virtualInterviewMessages.messageIndex]
    });

    // Generate comprehensive feedback
    const feedback = await virtualInterviewService.generateFinalFeedback(interview, messages);

    // Calculate scores
    const candidateMessages = messages.filter(m => m.sender === 'candidate');
    const avgTechnical = candidateMessages.reduce((sum, m) => sum + (m.technicalAccuracy || 50), 0) / Math.max(candidateMessages.length, 1);
    const avgCommunication = candidateMessages.reduce((sum, m) => sum + (m.clarityScore || 50), 0) / Math.max(candidateMessages.length, 1);
    const avgConfidence = candidateMessages.reduce((sum, m) => sum + (m.confidence || 50), 0) / Math.max(candidateMessages.length, 1);

    // Update interview with final scores
    await db.update(virtualInterviews)
      .set({
        status: 'completed',
        endTime: new Date(),
        overallScore: feedback.overallScore,
        technicalScore: Math.round(avgTechnical),
        communicationScore: Math.round(avgCommunication),
        confidenceScore: Math.round(avgConfidence),
        strengths: feedback.keyStrengths,
        weaknesses: feedback.areasForImprovement,
        recommendations: feedback.nextSteps,
        detailedFeedback: feedback.performanceSummary
      })
      .where(eq(virtualInterviews.id, interview.id));

    // Save detailed feedback
    await db.insert(virtualInterviewFeedback).values({
      interviewId: interview.id,
      performanceSummary: feedback.performanceSummary,
      keyStrengths: feedback.keyStrengths,
      areasForImprovement: feedback.areasForImprovement,
      technicalSkillsScore: feedback.technicalScore,
      problemSolvingScore: Math.round(avgTechnical),
      communicationScore: feedback.communicationScore,
      responseConsistency: 85, // Mock for now
      adaptabilityScore: 80, // Mock for now
      stressHandling: Math.round(avgConfidence),
      recommendedResources: feedback.recommendedResources,
      nextSteps: feedback.nextSteps,
      roleReadiness: feedback.overallScore >= 80 ? 'ready' : feedback.overallScore >= 60 ? 'needs_practice' : 'significant_gaps',
      aiConfidenceScore: 85 // Mock for now
    });

    // Update user stats
    const stats = await db.query.virtualInterviewStats.findFirst({
      where: eq(virtualInterviewStats.userId, userId)
    });

    if (stats) {
      const newAverage = Math.round((stats.averageScore * stats.completedInterviews + feedback.overallScore) / (stats.completedInterviews + 1));
      
      await db.update(virtualInterviewStats)
        .set({
          completedInterviews: stats.completedInterviews + 1,
          averageScore: newAverage,
          bestScore: Math.max(stats.bestScore, feedback.overallScore),
          lastInterviewDate: new Date(),
          totalTimeSpent: stats.totalTimeSpent + (interview.duration || 30)
        })
        .where(eq(virtualInterviewStats.userId, userId));
    }

    res.json({
      success: true,
      feedback,
      finalScores: {
        overall: feedback.overallScore,
        technical: Math.round(avgTechnical),
        communication: Math.round(avgCommunication),
        confidence: Math.round(avgConfidence)
      }
    });

  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// Get user's interview history
router.get("/history", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const interviews = await db.query.virtualInterviews.findMany({
      where: eq(virtualInterviews.userId, userId),
      orderBy: [desc(virtualInterviews.createdAt)],
      limit: 20
    });

    const stats = await db.query.virtualInterviewStats.findFirst({
      where: eq(virtualInterviewStats.userId, userId)
    });

    res.json({
      interviews,
      stats: stats || {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        bestScore: 0
      }
    });

  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
});

// Get detailed feedback for a specific interview
router.get("/:sessionId/feedback", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const feedback = await db.query.virtualInterviewFeedback.findFirst({
      where: eq(virtualInterviewFeedback.interviewId, interview.id)
    });

    res.json({
      interview,
      feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get behavioral questions for interview
router.get("/behavioral-questions", isAuthenticated, async (req: any, res) => {
  try {
    const { personality = 'professional', difficulty = 'medium', count = 5 } = req.query;
    
    const questions = behavioralQuestionService.selectQuestionsByPersonality(
      personality as string,
      difficulty as string,
      parseInt(count as string) || 5
    );
    
    res.json({ questions });
  } catch (error) {
    console.error('Error fetching behavioral questions:', error);
    res.status(500).json({ error: 'Failed to fetch behavioral questions' });
  }
});

// Analyze behavioral responses for personality insights
router.post("/analyze-behavioral", isAuthenticated, async (req: any, res) => {
  try {
    const { responses } = req.body;
    
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'Responses array is required' });
    }
    
    const insights = behavioralQuestionService.generatePersonalityInsights(responses);
    
    res.json({ insights });
  } catch (error) {
    console.error('Error analyzing behavioral responses:', error);
    res.status(500).json({ error: 'Failed to analyze behavioral responses' });
  }
});

// Get behavioral questions for interview
router.get("/behavioral-questions", isAuthenticated, async (req: any, res) => {
  try {
    const { personality = 'professional', difficulty = 'medium', count = 5 } = req.query;
    
    const questions = behavioralQuestionService.selectQuestionsByPersonality(
      personality as string,
      difficulty as string,
      parseInt(count as string) || 5
    );
    
    res.json({ questions });
  } catch (error) {
    console.error('Error fetching behavioral questions:', error);
    res.status(500).json({ error: 'Failed to fetch behavioral questions' });
  }
});

// Analyze AI usage in interview responses
router.post("/analyze-ai/:sessionId", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Get interview session
    const interview = await db.query.virtualInterviews.findFirst({
      where: and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      )
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }
    
    // Get all user messages
    const messages = await db.query.virtualInterviewMessages.findMany({
      where: and(
        eq(virtualInterviewMessages.interviewId, interview.id),
        eq(virtualInterviewMessages.sender, 'candidate')
      )
    });
    
    // Analyze each response for AI usage
    const analyses = await Promise.all(
      messages.map(async (msg) => {
        const detection = await aiDetectionService.detectAIUsage(msg.content, 'Interview response');
        return {
          messageId: msg.id,
          content: msg.content.substring(0, 100) + '...', // Preview only
          aiDetection: detection,
          timestamp: msg.timestamp
        };
      })
    );
    
    // Calculate overall AI usage statistics
    const aiUsageCount = analyses.filter(a => a.aiDetection.isAIGenerated).length;
    const averageConfidence = analyses.reduce((sum, a) => sum + a.aiDetection.confidence, 0) / analyses.length;
    
    res.json({
      totalResponses: analyses.length,
      aiUsageDetected: aiUsageCount,
      aiUsagePercentage: Math.round((aiUsageCount / analyses.length) * 100),
      averageConfidence: Math.round(averageConfidence),
      analyses: analyses.map(a => ({
        ...a,
        content: undefined // Don't send full content to protect privacy
      })),
      summary: aiUsageCount > 0 ? 
        `AI usage detected in ${aiUsageCount} out of ${analyses.length} responses` :
        'No significant AI usage detected'
    });
    
  } catch (error) {
    console.error('Error analyzing AI usage:', error);
    res.status(500).json({ error: 'Failed to analyze AI usage' });
  }
});

export default router;