import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, X, Target, Users, BrainCircuit, Zap, Building2, Mail, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecruiterSubscriptionData {
  subscription: {
    planType: string;
    subscriptionStatus: string;
    subscriptionEndDate?: string;
  };
  usage: {
    jobPostings: number;
    premiumTargeting: number;
    candidateMessages: number;
    resumeViews: number;
  };
  limits: {
    jobPostings: number;
    premiumTargeting: number;
    candidateMessages: number;
    resumeViews: number;
  } | null;
}

export default function RecruiterSubscription() {
  const { toast } = useToast();
  const [pendingTargetingJob, setPendingTargetingJob] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'razorpay'>('stripe');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check for pending targeting job from Premium Targeting page
  useEffect(() => {
    const pending = localStorage.getItem('pendingTargetingJob');
    if (pending) {
      setPendingTargetingJob(JSON.parse(pending));
    }
  }, []);

  const { data: subscriptionData, isLoading } = useQuery<RecruiterSubscriptionData>({
    queryKey: ['/api/subscription/status'],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('POST', '/api/subscription/upgrade', paymentData);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      // If there's a pending targeting job, create it now
      if (pendingTargetingJob) {
        try {
          await apiRequest('POST', '/api/jobs/targeted', pendingTargetingJob);
          localStorage.removeItem('pendingTargetingJob');
          toast({
            title: "Premium Targeting Job Created!",
            description: `Your targeted job posting "${pendingTargetingJob.title}" is now live with premium targeting.`,
          });
          // Redirect to dashboard
          window.location.href = '/';
        } catch (error) {
          toast({
            title: "Job Creation Failed", 
            description: "Premium subscription activated but job creation failed. Please try posting again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Upgraded Successfully!",
          description: "Welcome to AutoJobr Premium for Recruiters! Enjoy unlimited access to all features.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/subscription/cancel');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled. You'll retain premium features until the end of your billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment handlers
  const handleStripePayment = async () => {
    // Determine payment amount based on pending targeting job or default subscription
    const amount = pendingTargetingJob ? (pendingTargetingJob.estimatedCost * 100) : 4900; // $49 for basic, or targeting cost
    
    const response = await apiRequest('POST', '/api/create-payment-intent', {
      amount: amount,
      currency: 'usd',
    });
    
    // Handle Stripe payment flow
    upgradeMutation.mutate({
      stripePaymentIntentId: response.paymentIntent.id,
      paymentMethod: 'stripe'
    });
  };

  const handlePayPalPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Determine payment amount based on pending targeting job or default subscription
      const amount = pendingTargetingJob ? pendingTargetingJob.estimatedCost : 49; // $49 for basic, or targeting cost
      
      // Create PayPal order
      const response = await fetch('/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: 'USD',
          intent: 'CAPTURE'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }
      
      const orderData = await response.json();
      
      // Redirect to PayPal for payment approval
      if (orderData.links) {
        const approveUrl = orderData.links.find((link: any) => link.rel === 'approve')?.href;
        if (approveUrl) {
          window.location.href = approveUrl;
          return;
        }
      }
      
      throw new Error('PayPal approval URL not found');
      
    } catch (error) {
      setIsProcessingPayment(false);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate PayPal payment",
        variant: "destructive"
      });
    }
  };

  const handleRazorpayPayment = async () => {
    toast({
      title: "Coming Soon",
      description: "Razorpay integration is coming soon. Please use PayPal for now.",
      variant: "default"
    });
  };

  const handleUpgrade = async () => {
    setIsProcessingPayment(true);
    
    try {
      if (selectedPaymentMethod === 'stripe') {
        await handleStripePayment();
      } else if (selectedPaymentMethod === 'paypal') {
        await handlePayPalPayment();
      } else if (selectedPaymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = subscriptionData?.subscription.planType === 'premium';
  const isActive = subscriptionData?.subscription.subscriptionStatus === 'active';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Recruiter Subscription & Usage</h1>
          <p className="text-muted-foreground">
            Manage your AutoJobr Premium subscription and track your hiring metrics
          </p>
        </div>

        {/* Premium Targeting Notification */}
        {pendingTargetingJob && (
          <Card className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-purple-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Premium Targeting Job Pending</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    Job "{pendingTargetingJob.title}" ready to post with premium targeting for ${pendingTargetingJob.estimatedCost}. 
                    Upgrade to Premium to activate targeted candidate matching.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  ${pendingTargetingJob.estimatedCost}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {isPremium ? "Premium Plan" : "Basic Plan"}
              </CardTitle>
              <CardDescription>
                {isPremium ? "Unlimited recruiting tools and premium targeting" : "Limited recruiting features with upgrade options"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={isPremium && isActive ? "default" : "secondary"}>
                    {isPremium && isActive ? "Premium" : "Basic"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price</span>
                  <span className="text-lg font-bold">
                    {isPremium ? "$49/month" : pendingTargetingJob ? `$${pendingTargetingJob.estimatedCost}` : "$49/month"}
                  </span>
                </div>

                <Separator />

                {!isPremium && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">
                        {pendingTargetingJob ? 'Complete Premium Targeting Payment' : 'Upgrade to Premium'}
                      </h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        {pendingTargetingJob 
                          ? `Pay $${pendingTargetingJob.estimatedCost} for premium targeting of "${pendingTargetingJob.title}"` 
                          : 'Unlock advanced recruiting features and unlimited access'
                        }
                      </div>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Method</label>
                        <div className="space-y-2">
                          <div 
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === 'stripe' 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod('stripe')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium text-sm">Stripe</div>
                                  <div className="text-xs text-muted-foreground">Credit/Debit Card</div>
                                </div>
                              </div>
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                selectedPaymentMethod === 'stripe' 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedPaymentMethod === 'stripe' && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === 'paypal' 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod('paypal')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center text-xs font-bold">
                                  P
                                </div>
                                <div>
                                  <div className="font-medium text-sm">PayPal</div>
                                  <div className="text-xs text-muted-foreground">PayPal Account</div>
                                </div>
                              </div>
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                selectedPaymentMethod === 'paypal' 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedPaymentMethod === 'paypal' && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleUpgrade} 
                        disabled={upgradeMutation.isPending || isProcessingPayment}
                        className="w-full"
                      >
                        {upgradeMutation.isPending || isProcessingPayment ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing Payment...
                          </div>
                        ) : (
                          pendingTargetingJob 
                            ? `Pay $${pendingTargetingJob.estimatedCost} with ${selectedPaymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}` 
                            : `Pay $49/month with ${selectedPaymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}`
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {isPremium && isActive && (
                  <Button 
                    onClick={() => cancelMutation.mutate()} 
                    disabled={cancelMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {cancelMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Monthly Usage
              </CardTitle>
              <CardDescription>
                {isPremium ? "Unlimited recruiting capacity" : "Resets monthly"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Unlimited Access</p>
                  <p className="text-sm text-muted-foreground">Post unlimited jobs with premium targeting</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Job Postings
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.jobPostings || 0}/{subscriptionData?.limits?.jobPostings || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.jobPostings || 0, subscriptionData?.limits?.jobPostings || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Premium Targeting
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.premiumTargeting || 0}/{subscriptionData?.limits?.premiumTargeting || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.premiumTargeting || 0, subscriptionData?.limits?.premiumTargeting || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Candidate Messages
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.candidateMessages || 0}/{subscriptionData?.limits?.candidateMessages || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.candidateMessages || 0, subscriptionData?.limits?.candidateMessages || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4" />
                        Resume Views
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.resumeViews || 0}/{subscriptionData?.limits?.resumeViews || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.resumeViews || 0, subscriptionData?.limits?.resumeViews || 1)}
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Premium Recruiting Features
            </CardTitle>
            <CardDescription>
              Advanced tools for efficient recruitment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Unlimited Job Postings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Premium Candidate Targeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Priority Support</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Unlimited Candidate Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Resume Database Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">Custom Branding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPremium ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-gray-500" />}
                  </div>
                  <span className="text-sm">API Access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}