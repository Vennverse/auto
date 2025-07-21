import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Zap, Star, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  userType?: 'job_seeker' | 'recruiter';
}

export default function FeatureBlockModal({ isOpen, onClose, feature, userType = 'job_seeker' }: FeatureBlockModalProps) {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  const handleUpgrade = () => {
    const premiumPage = userType === 'recruiter' ? '/recruiter-premium' : '/job-seeker-premium';
    setLocation(premiumPage);
    onClose();
  };

  const getFeatureDescription = () => {
    const descriptions = {
      'job_applications': 'Apply to unlimited jobs with AI-powered cover letters',
      'resume_analysis': 'Get detailed ATS scores and optimization suggestions',
      'interview_practice': 'Access unlimited mock interviews with AI feedback',
      'job_tracking': 'Track application status and get follow-up reminders',
      'career_ai': 'Get personalized career advice and job recommendations',
      'auto_fill': 'Automatically fill job applications on 1000+ job boards',
      'job_posting': 'Post unlimited jobs and reach premium candidates',
      'candidate_search': 'Search and filter through premium candidate database',
      'analytics': 'Advanced recruiting analytics and pipeline insights',
      'team_collaboration': 'Collaborate with your recruiting team',
      'priority_support': '24/7 priority customer support'
    };
    return descriptions[feature] || `Unlock ${feature} with premium`;
  };

  const getPricingInfo = () => {
    if (userType === 'recruiter') {
      return {
        price: '$49',
        billing: 'per month',
        savings: 'Save $100 with annual billing',
        features: [
          'Unlimited job postings',
          'Premium candidate targeting',
          'Advanced analytics dashboard',
          'Team collaboration tools',
          'Priority support'
        ]
      };
    } else {
      return {
        price: '$19',
        billing: 'per month',
        savings: 'Save $50 with annual billing',
        features: [
          'Unlimited job applications',
          'AI-powered resume optimization',
          'Interview practice with feedback',
          'Auto-fill Chrome extension',
          'Career coaching AI assistant'
        ]
      };
    }
  };

  const pricing = getPricingInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            Premium Feature Required
          </DialogTitle>
          <DialogDescription className="text-lg">
            {getFeatureDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Urgency Banner */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Free Tier Limit Reached</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    You've used all your free monthly allowances. Upgrade now to continue using AutoJobr.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-2">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM UPGRADE
                </Badge>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">{pricing.price}</span>
                  <span className="text-muted-foreground">{pricing.billing}</span>
                </div>
                <p className="text-sm text-green-600 font-medium">{pricing.savings}</p>
              </div>

              <div className="space-y-3 mb-6">
                {pricing.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                size="lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Premium Now
              </Button>
            </CardContent>
          </Card>

          {/* Continue with Limited Access */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Or continue with limited access for {countdown} seconds
            </p>
            {countdown === 0 && (
              <Button 
                variant="outline" 
                onClick={onClose}
                className="text-xs opacity-50"
              >
                Continue with limited access
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}