import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface PremiumPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  usagePercentage?: number;
}

export default function PremiumPromptModal({ isOpen, onClose, feature, usagePercentage }: PremiumPromptModalProps) {
  const [, setLocation] = useLocation();

  const { data: usageReport } = useQuery({
    queryKey: ['/api/usage/report'],
    enabled: isOpen,
  });

  const handleUpgrade = () => {
    // Determine if user is recruiter or job seeker based on current route
    const isRecruiter = window.location.pathname.includes('recruiter') || 
                       window.location.pathname.includes('post-job') ||
                       window.location.pathname.includes('dashboard');
    
    if (isRecruiter) {
      setLocation('/recruiter-premium');
    } else {
      setLocation('/job-seeker-premium');
    }
    onClose();
  };

  const getFeatureMessage = (feature?: string) => {
    switch (feature) {
      case 'jobAnalyses':
        return 'You\'ve reached your job analysis limit for this month.';
      case 'resumeAnalyses':
        return 'You\'ve reached your resume analysis limit for this month.';
      case 'applications':
        return 'You\'ve reached your application limit for this month.';
      case 'autoFills':
        return 'You\'ve reached your auto-fill limit for this month.';
      case 'jobPostings':
        return 'You\'ve reached your job posting limit for this month.';
      case 'interviews':
        return 'You\'ve reached your interview limit for this month.';
      case 'candidates':
        return 'You\'ve reached your candidate limit for this month.';
      default:
        return 'You\'ve reached your usage limits for this month.';
    }
  };

  const isFreeTier = !usageReport?.subscription || !usageReport?.subscription.isActive;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFreeTier ? (
              <>
                <Crown className="h-5 w-5 text-yellow-600" />
                Upgrade to Premium
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Usage Limit Reached
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {feature ? getFeatureMessage(feature) : 'Upgrade now to continue using all features.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {usagePercentage && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Usage</span>
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {usagePercentage}% used
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Premium Benefits:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited usage of all features</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm">AI-powered advanced features</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Priority support and analytics</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}