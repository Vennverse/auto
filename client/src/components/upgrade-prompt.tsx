import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Crown, Zap, Target, FileText, Bot } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  userPlan: string;
}

export function UpgradePrompt({ userPlan }: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [promptType, setPromptType] = useState<'daily' | 'usage' | 'feature'>('daily');

  useEffect(() => {
    // Only show to free users
    if (userPlan === 'premium') {
      setIsVisible(false);
      return;
    }

    // Check if daily prompt should be shown
    const lastPromptDate = localStorage.getItem('lastUpgradePrompt');
    const today = new Date().toDateString();
    
    if (lastPromptDate !== today) {
      setIsVisible(true);
      setPromptType('daily');
      localStorage.setItem('lastUpgradePrompt', today);
    }
  }, [userPlan]);

  const prompts = {
    daily: {
      title: "🚀 Unlock Your Full Potential",
      subtitle: "Ready to supercharge your job search?",
      benefits: [
        { icon: <Bot className="w-4 h-4" />, text: "Unlimited AI job analysis" },
        { icon: <FileText className="w-4 h-4" />, text: "Unlimited resume uploads & analysis" },
        { icon: <Target className="w-4 h-4" />, text: "Unlimited job applications" },
        { icon: <Zap className="w-4 h-4" />, text: "Unlimited auto-fill actions" }
      ]
    },
    usage: {
      title: "🎯 You're Making Great Progress!",
      subtitle: "Don't let limits slow you down",
      benefits: [
        { icon: <Crown className="w-4 h-4" />, text: "Remove all usage limits" },
        { icon: <Sparkles className="w-4 h-4" />, text: "Advanced AI insights" },
        { icon: <Target className="w-4 h-4" />, text: "Priority support" },
        { icon: <Zap className="w-4 h-4" />, text: "Early access to new features" }
      ]
    },
    feature: {
      title: "⭐ This Feature Needs Premium",
      subtitle: "Upgrade to access all tools",
      benefits: [
        { icon: <Bot className="w-4 h-4" />, text: "Full AI analysis suite" },
        { icon: <FileText className="w-4 h-4" />, text: "Advanced resume tools" },
        { icon: <Target className="w-4 h-4" />, text: "Enhanced job matching" },
        { icon: <Sparkles className="w-4 h-4" />, text: "Premium insights" }
      ]
    }
  };

  const currentPrompt = prompts[promptType];

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardContent className="p-6 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
            <Crown className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPrompt.title}
              </h3>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                $10/month
              </Badge>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {currentPrompt.subtitle}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {currentPrompt.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="text-blue-600 dark:text-blue-400">
                    {benefit.icon}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Link href="/subscription">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                onClick={() => setIsVisible(false)}
                className="border-gray-300 dark:border-gray-600"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for showing usage-based upgrade prompts
export function useUpgradePrompt() {
  const showUsagePrompt = () => {
    // This can be called when user hits usage limits
    const event = new CustomEvent('showUpgradePrompt', { 
      detail: { type: 'usage' } 
    });
    window.dispatchEvent(event);
  };

  const showFeaturePrompt = () => {
    // This can be called when user tries to access premium features
    const event = new CustomEvent('showUpgradePrompt', { 
      detail: { type: 'feature' } 
    });
    window.dispatchEvent(event);
  };

  return { showUsagePrompt, showFeaturePrompt };
}