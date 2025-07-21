import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../subscriptionService';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    planType?: string;
  };
}

// Middleware to check if user can access premium features
export const requirePremium = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (subscription.planType === 'free') {
      return res.status(403).json({
        error: 'Premium subscription required',
        message: 'This feature requires a premium or enterprise subscription',
        upgradeUrl: '/recruiter/premium'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

// Middleware to check if user can access enterprise features
export const requireEnterprise = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (subscription.planType !== 'enterprise') {
      return res.status(403).json({
        error: 'Enterprise subscription required',
        message: 'This feature requires an enterprise subscription',
        upgradeUrl: '/recruiter/premium'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

// Middleware to check usage limits
export const checkUsageLimit = (feature: 'jobPostings' | 'applications' | 'customTests') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const usage = await subscriptionService.getUsageStats(userId);
      const currentCount = usage[feature];
      
      const limitCheck = await subscriptionService.checkLimit(userId, feature, currentCount);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: `You have reached your ${feature} limit of ${limitCheck.limit}`,
          current: currentCount,
          limit: limitCheck.limit,
          upgradeUrl: '/recruiter/premium'
        });
      }
      
      // Add limit info to request for use in route handlers
      req.user = {
        ...req.user,
        limits: limitCheck
      };
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to check usage limits' });
    }
  };
};

// Middleware to check feature access
export const requireFeature = (feature: keyof typeof subscriptionService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const access = await subscriptionService.isFeatureAccessible(userId, feature as any);
      
      if (!access.accessible) {
        return res.status(403).json({
          error: 'Feature not accessible',
          message: access.reason,
          upgradeRequired: access.upgradeRequired,
          upgradeUrl: '/recruiter/premium'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};