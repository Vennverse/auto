import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, X, Zap, Target, Brain, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionData {
  planType: string;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
  usage?: {
    jobAnalyses: number;
    resumeAnalyses: number;
    applications: number;
    autoFills: number;
  };
  limits?: {
    jobAnalyses: number;
    resumeAnalyses: number;
    applications: number;
    autoFills: number;
  } | null;
}

export default function Subscription() {
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

  const { data: subscriptionData, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscription/status'],
    retry: 3,
    retryDelay: 1000,
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
          description: "Welcome to AutoJobr Premium! Enjoy unlimited access to all features.",
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

  const handleStripePayment = async () => {
    // Create Stripe Checkout session
    try {
      const response = await apiRequest('POST', '/api/payments/stripe/create-checkout', {
        amount: 1000, // $10 in cents
        currency: 'usd'
      });
      
      if (response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create Stripe checkout session');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw error;
    }
  };

  const handlePayPalPayment = async () => {
    // Create PayPal order
    try {
      const response = await apiRequest('POST', '/api/payments/paypal/create-order', {
        amount: '10.00',
        currency: 'USD'
      });
      
      if (response.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = response.approvalUrl;
      } else {
        throw new Error('Failed to create PayPal order');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
    // Create Razorpay order
    try {
      const response = await apiRequest('POST', '/api/payments/razorpay/create-order', {
        amount: 1000, // ₹10 in paise
        currency: 'INR'
      });
      
      if (response.orderId) {
        // Initialize Razorpay payment
        const options = {
          key: response.keyId,
          amount: response.amount,
          currency: response.currency,
          name: 'AutoJobr Premium',
          description: 'Monthly Premium Subscription',
          order_id: response.orderId,
          handler: async function (response: any) {
            try {
              await upgradeMutation.mutateAsync({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: 'razorpay'
              });
            } catch (error) {
              console.error('Payment verification error:', error);
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com'
          },
          theme: {
            color: '#3B82F6'
          }
        };
        
        // @ts-ignore
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        throw new Error('Failed to create Razorpay order');
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !subscriptionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Subscription</h1>
          <p className="mt-4 text-gray-600">Unable to load subscription data. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isPremium = subscriptionData.planType === 'premium';
  const isActive = subscriptionData.subscriptionStatus === 'active';
  const usage = subscriptionData.usage || { jobAnalyses: 0, resumeAnalyses: 0, applications: 0, autoFills: 0 };
  const limits = subscriptionData.limits;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription & Usage</h1>
          <p className="text-muted-foreground">
            Manage your AutoJobr subscription and track your daily usage
          </p>
        </div>

        {/* Premium Targeting Notification */}
        {pendingTargetingJob && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-purple-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                    Premium Targeting Job Pending
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    Job "{pendingTargetingJob.title}" ready to post with premium targeting for ${pendingTargetingJob.cost}. 
                    Upgrade to Premium to activate targeted candidate matching.
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  ${pendingTargetingJob.cost}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isPremium ? (
                  <>
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Premium Plan
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 text-blue-500" />
                    Free Plan
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isPremium ? (
                  isActive ? "Active until " + (subscriptionData.subscriptionEndDate ? new Date(subscriptionData.subscriptionEndDate).toLocaleDateString() : "N/A") : "Premium plan inactive"
                ) : (
                  "Limited daily usage with premium features available"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={isPremium && isActive ? "default" : "secondary"}>
                    {isPremium && isActive ? "Active" : isPremium ? "Inactive" : "Free"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Price</span>
                  <span className="font-semibold">
                    {isPremium ? "$10/month" : "$0/month"}
                  </span>
                </div>
                
                {!isPremium && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-bold">$10<span className="text-sm text-muted-foreground">/month</span></div>
                        <p className="text-sm text-muted-foreground">Unlock unlimited features & AI-powered tools</p>
                      </div>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Choose Payment Method</h4>
                        
                        <div className="grid gap-2">
                          <div 
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === 'stripe' 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod('stripe')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">
                                  S
                                </div>
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
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod('paypal')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-700 text-white rounded flex items-center justify-center text-xs font-bold">
                                  P
                                </div>
                                <div>
                                  <div className="font-medium text-sm">PayPal</div>
                                  <div className="text-xs text-muted-foreground">Secure PayPal Payment</div>
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

                          <div 
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === 'razorpay' 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod('razorpay')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center text-xs font-bold">
                                  R
                                </div>
                                <div>
                                  <div className="font-medium text-sm">Razorpay</div>
                                  <div className="text-xs text-muted-foreground">UPI, Cards, Net Banking</div>
                                </div>
                              </div>
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                selectedPaymentMethod === 'razorpay' 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedPaymentMethod === 'razorpay' && (
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
                          `Pay $10/month with ${selectedPaymentMethod === 'stripe' ? 'Stripe' : selectedPaymentMethod === 'paypal' ? 'PayPal' : 'Razorpay'}`
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

          {/* Daily Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Daily Usage
              </CardTitle>
              <CardDescription>
                {isPremium ? "Unlimited usage" : "Resets daily at midnight"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Unlimited Access</p>
                  <p className="text-sm text-muted-foreground">Enjoy all features without limits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Job Analyses
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.jobAnalyses || 0}/{subscriptionData?.limits?.jobAnalyses || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.jobAnalyses || 0, subscriptionData?.limits?.jobAnalyses || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Resume Analyses
                      </span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.resumeAnalyses || 0}/{subscriptionData?.limits?.resumeAnalyses || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.resumeAnalyses || 0, subscriptionData?.limits?.resumeAnalyses || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Applications</span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.applications || 0}/{subscriptionData?.limits?.applications || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.applications || 0, subscriptionData?.limits?.applications || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Auto-fills</span>
                      <span className="text-sm font-medium">
                        {subscriptionData?.usage.autoFills || 0}/{subscriptionData?.limits?.autoFills || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionData?.usage.autoFills || 0, subscriptionData?.limits?.autoFills || 1)}
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>
              See what's included with each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Free Plan
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    5 job analyses per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    2 resume analyses per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    10 application tracking per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    15 auto-fills per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Basic job recommendations
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Premium Plan
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited job analyses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited resume analyses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited application tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited auto-fills
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced AI job matching
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}