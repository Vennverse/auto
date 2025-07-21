import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UsageLimit {
  feature: string;
  used: number;
  limit: number;
  resetDate: string;
}

interface UsageReport {
  limits: UsageLimit[];
  isFreeTier: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
}

export function useUsageEnforcement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedFeature, setBlockedFeature] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch usage report every 5 seconds for real-time enforcement
  const { data: usageReport, refetch } = useQuery<UsageReport>({
    queryKey: ['/api/usage/report'],
    refetchInterval: 5000, // Very aggressive refresh
    enabled: !!user,
  });

  // Very restrictive free tier limits to force upgrades
  const FREE_TIER_LIMITS = {
    jobseeker: {
      job_applications: 1, // Only 1 application per month!
      resume_analysis: 1,  // Only 1 resume analysis per month!
      interview_practice: 1, // Only 1 practice session per month!
      auto_fill: 1,       // Only 1 auto-fill per month!
      career_ai: 1,       // Only 1 AI consultation per month!
      job_search: 5,      // Only 5 job searches per month!
    },
    recruiter: {
      job_posting: 1,     // Only 1 job posting per month!
      candidate_search: 5, // Only 5 candidate searches per month!
      interview_creation: 1, // Only 1 interview per month!
      analytics_view: 3,  // Only 3 analytics views per month!
      team_access: 0,     // No team access on free tier!
    }
  };

  const isFeatureBlocked = (featureName: string): boolean => {
    if (!usageReport || !usageReport.isFreeTier) return false;
    
    const userType = user?.userType === 'recruiter' ? 'recruiter' : 'jobseeker';
    const featureLimit = usageReport.limits.find(l => l.feature === featureName);
    
    if (!featureLimit) return false;
    
    // Block if at or over limit
    return featureLimit.used >= featureLimit.limit;
  };

  const checkFeatureAccess = (featureName: string): boolean => {
    if (isFeatureBlocked(featureName)) {
      setBlockedFeature(featureName);
      setShowUpgradeModal(true);
      
      // Show urgent toast
      toast({
        title: "🚫 Premium Feature Required",
        description: `You've reached your free limit for ${featureName}. Upgrade now to continue!`,
        variant: "destructive",
        duration: 5000,
      });
      
      return false;
    }
    return true;
  };

  const getUsagePercentage = (featureName: string): number => {
    if (!usageReport) return 0;
    
    const featureLimit = usageReport.limits.find(l => l.feature === featureName);
    if (!featureLimit || featureLimit.limit === -1) return 0;
    
    return Math.min((featureLimit.used / featureLimit.limit) * 100, 100);
  };

  const getRemainingUsage = (featureName: string): number => {
    if (!usageReport) return 0;
    
    const featureLimit = usageReport.limits.find(l => l.feature === featureName);
    if (!featureLimit || featureLimit.limit === -1) return Infinity;
    
    return Math.max(featureLimit.limit - featureLimit.used, 0);
  };

  // Auto-show upgrade modal when user approaches limits
  useEffect(() => {
    if (usageReport?.isFreeTier && usageReport.limits) {
      const anyLimitNearMax = usageReport.limits.some(limit => 
        limit.limit > 0 && (limit.used / limit.limit) >= 0.8
      );
      
      if (anyLimitNearMax && !showUpgradeModal) {
        // Show warning after 3 seconds
        setTimeout(() => {
          setShowUpgradeModal(true);
          toast({
            title: "⚠️ Approaching Usage Limits",
            description: "You're running out of free monthly usage. Upgrade to premium for unlimited access!",
            variant: "destructive",
            duration: 8000,
          });
        }, 3000);
      }
    }
  }, [usageReport, showUpgradeModal, toast]);

  // Force upgrade modal every 2 minutes for free users
  useEffect(() => {
    if (usageReport?.isFreeTier) {
      const interval = setInterval(() => {
        setShowUpgradeModal(true);
        toast({
          title: "🚀 Upgrade to Premium",
          description: "Stop limitations! Get unlimited access with premium membership.",
          variant: "default",
          duration: 6000,
        });
      }, 120000); // Every 2 minutes
      
      return () => clearInterval(interval);
    }
  }, [usageReport?.isFreeTier, toast]);

  return {
    usageReport,
    isFeatureBlocked,
    checkFeatureAccess,
    getUsagePercentage,
    getRemainingUsage,
    blockedFeature,
    showUpgradeModal,
    setShowUpgradeModal,
    refetchUsage: refetch,
  };
}