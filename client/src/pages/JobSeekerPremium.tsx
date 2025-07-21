import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Star, 
  Zap, 
  CreditCard,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Brain,
  Target,
  FileText,
  Search
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import UsageMonitoringWidget from "@/components/UsageMonitoringWidget";

interface JobSeekerSubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker';
  features: string[];
  limits: {
    jobAnalyses?: number;
    resumeAnalyses?: number;
    applications?: number;
    autoFills?: number;
    interviews?: number;
  };
}

export default function JobSeekerPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cashfree' | 'razorpay'>('paypal');
  const [showPayment, setShowPayment] = useState(false);

  // Fetch only job seeker subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/subscription/tiers'],
    queryFn: () => fetch('/api/subscription/tiers?userType=jobseeker').then(res => res.json()),
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { tierId: string; paymentMethod: string }) => {
      return await apiRequest('/api/subscription/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.order?.orderId) {
        toast({
          title: "Payment initiated",
          description: "Complete your payment to activate premium features.",
        });
        setShowPayment(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/subscription/cancel', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled and will not renew.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    createSubscriptionMutation.mutate({ tierId, paymentMethod });
  };

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const getIconForTier = (tierName: string) => {
    if (tierName.includes('Basic')) return <Star className="h-6 w-6" />;
    if (tierName.includes('Premium')) return <Crown className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  if (tiersLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Filter to ensure only job seeker tiers are displayed
  const tiers: JobSeekerSubscriptionTier[] = (tiersData?.tiers || []).filter((tier: any) => tier.userType === 'jobseeker');
  const subscription = currentSubscription?.subscription;
  const isFreeTier = !subscription || !subscription.isActive;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Monitoring Sidebar */}
        <div className="lg:col-span-1">
          <UsageMonitoringWidget />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Job Seeker Premium Plans</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Supercharge your job search with AI-powered tools, unlimited applications, and premium features.
            </p>
            
            {isFreeTier && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Free tier limits applied - Upgrade now for unlimited access!</span>
                </div>
              </div>
            )}
          </div>

          {/* Current Subscription Status */}
          {subscription && (
            <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-semibold">{subscription.tierDetails?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={subscription.isActive ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billing</p>
                    <p className="font-semibold">
                      ${subscription.amount} / {subscription.billingCycle}
                    </p>
                  </div>
                </div>
                
                {subscription.isActive && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {subscription.daysRemaining} days remaining
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={cancelSubscriptionMutation.isPending}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {tiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative ${tier.name.includes('Premium') ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
              >
                {tier.name.includes('Premium') && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getIconForTier(tier.name)}
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/{tier.billingCycle}</span>
                    {tier.billingCycle === 'yearly' && (
                      <div className="text-green-600 text-sm font-medium mt-1">
                        Save 2 months free!
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Job Seeker Features & Limits</h4>
                    {tier.limits.jobAnalyses && (
                      <div className="flex justify-between text-sm">
                        <span>Job Analyses</span>
                        <span className="font-medium">{formatLimit(tier.limits.jobAnalyses)}</span>
                      </div>
                    )}
                    {tier.limits.resumeAnalyses && (
                      <div className="flex justify-between text-sm">
                        <span>Resume Analyses</span>
                        <span className="font-medium">{formatLimit(tier.limits.resumeAnalyses)}</span>
                      </div>
                    )}
                    {tier.limits.applications && (
                      <div className="flex justify-between text-sm">
                        <span>Job Applications</span>
                        <span className="font-medium">{formatLimit(tier.limits.applications)}</span>
                      </div>
                    )}
                    {tier.limits.autoFills && (
                      <div className="flex justify-between text-sm">
                        <span>Auto-Fill Forms</span>
                        <span className="font-medium">{formatLimit(tier.limits.autoFills)}</span>
                      </div>
                    )}
                    {tier.limits.interviews && (
                      <div className="flex justify-between text-sm">
                        <span>Virtual Interview Practice</span>
                        <span className="font-medium">{formatLimit(tier.limits.interviews)}</span>
                      </div>
                    )}
                  </div>
                  
                  <PaymentGatewaySelector
                    tierId={tier.id}
                    tierName={tier.name}
                    amount={tier.price}
                    currency="USD"
                    userType="jobseeker"
                    onPaymentSuccess={(data) => {
                      toast({
                        title: "Subscription Activated!",
                        description: "Your premium features are now active.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                    }}
                    onPaymentError={(error) => {
                      toast({
                        title: "Payment Error",
                        description: error.message || "Payment failed. Please try again.",
                        variant: "destructive",
                      });
                    }}
                    description={`Monthly subscription for ${tier.name} plan`}
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Method Selection */}
          {showPayment && selectedTier && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Payment
                </CardTitle>
                <CardDescription>
                  Choose your payment method to activate premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('paypal')}
                    className="flex-1"
                  >
                    PayPal
                  </Button>
                  <Button
                    variant={paymentMethod === 'razorpay' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('razorpay')}
                    className="flex-1"
                  >
                    Razorpay
                  </Button>
                </div>

                {paymentMethod === 'paypal' && (
                  <div className="border rounded-lg p-4">
                    <PayPalButton
                      amount={tiers.find(t => t.id === selectedTier)?.price.toString() || "0"}
                      currency="USD"
                      intent="CAPTURE"
                    />
                  </div>
                )}

                {paymentMethod === 'razorpay' && (
                  <div className="border rounded-lg p-4 text-center text-muted-foreground">
                    <p>Razorpay integration coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Seeker Benefits Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Job Seekers Choose Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center space-y-2">
                  <Brain className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold">AI Resume Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant ATS compatibility scores and personalized resume improvements
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Search className="h-8 w-8 mx-auto text-green-600" />
                  <h3 className="font-semibold">Smart Job Matching</h3>
                  <p className="text-sm text-muted-foreground">
                    Find relevant jobs faster with AI-powered matching algorithms
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Auto-Fill Applications</h3>
                  <p className="text-sm text-muted-foreground">
                    Chrome extension fills job applications automatically across 500+ sites
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-orange-600" />
                  <h3 className="font-semibold">Interview Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice virtual interviews and improve your performance with AI feedback
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}