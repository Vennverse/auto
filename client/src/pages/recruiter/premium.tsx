import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Crown,
  Star,
  Check,
  X,
  Zap,
  Target,
  Users,
  BarChart3,
  Shield,
  Headphones,
  Globe,
  Infinity,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";

export default function RecruiterPremium() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out AutoJobr',
      price: { monthly: 0, annual: 0 },
      badge: null,
      features: [
        { name: 'Up to 2 job postings', included: true },
        { name: 'Basic applicant tracking', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Standard job board listing', included: true },
        { name: 'Basic candidate profiles', included: true },
        { name: 'Premium targeting', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom test creation', included: false },
        { name: 'Unlimited job postings', included: false }
      ],
      popular: false,
      current: user?.planType === 'free'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced recruiting tools for growing teams',
      price: { monthly: 49, annual: 490 },
      badge: <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="w-3 h-3 mr-1" />Premium</Badge>,
      features: [
        { name: 'Unlimited job postings', included: true },
        { name: 'Advanced applicant tracking', included: true },
        { name: 'Premium targeting system', included: true },
        { name: 'Advanced analytics & insights', included: true },
        { name: 'Custom test creation (50/month)', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Candidate background checks', included: true },
        { name: 'Team collaboration tools', included: true },
        { name: 'API access', included: true },
        { name: 'Enterprise features', included: false }
      ],
      popular: true,
      current: user?.planType === 'premium'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for large organizations',
      price: { monthly: 199, annual: 1990 },
      badge: <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Enterprise</Badge>,
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Unlimited custom tests', included: true },
        { name: 'White-label solution', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Advanced security features', included: true },
        { name: '24/7 phone support', included: true },
        { name: 'Custom reporting', included: true },
        { name: 'Multi-team management', included: true },
        { name: 'SLA guarantee', included: true }
      ],
      popular: false,
      current: user?.planType === 'enterprise'
    }
  ];

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async ({ planId, provider }: { planId: string; provider: 'stripe' | 'paypal' | 'razorpay' }) => {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      const amount = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly;
      
      const response = await apiRequest('/api/payment/create-intent', 'POST', {
        planId,
        amount,
        billingCycle,
        provider
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.clientSecret) {
        // Handle Stripe payment
        handleStripePayment(data.clientSecret);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive"
      });
    }
  });

  const handleStripePayment = async (clientSecret: string) => {
    // Implement Stripe payment handling
    toast({
      title: "Redirecting to Stripe",
      description: "You'll be redirected to complete your payment"
    });
  };

  const handlePlanSelection = (planId: string, provider: 'stripe' | 'paypal' | 'razorpay') => {
    if (planId === 'free') {
      // Handle downgrade to free
      return;
    }
    
    setSelectedPlan(planId);
    createPaymentMutation.mutate({ planId, provider });
  };

  const getSavings = (plan: any) => {
    if (billingCycle === 'annual') {
      const monthlyCost = plan.price.monthly * 12;
      const annualCost = plan.price.annual;
      const savings = monthlyCost - annualCost;
      return savings > 0 ? `Save $${savings}` : null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecruiterNavbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Unlock powerful recruiting tools and find the perfect candidates faster
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <Badge className="bg-green-100 text-green-800">Save up to 17%</Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-lg scale-105' : ''} ${plan.current ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.badge}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${billingCycle === 'annual' ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  {getSavings(plan) && (
                    <div className="text-green-600 text-sm mt-1">{getSavings(plan)}</div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {!plan.current && (
                  <div className="space-y-2">
                    {plan.id === 'free' ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handlePlanSelection(plan.id, 'stripe')}
                      >
                        Downgrade to Free
                      </Button>
                    ) : (
                      <>
                        {/* Stripe Payment */}
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => handlePlanSelection(plan.id, 'stripe')}
                          disabled={createPaymentMutation.isPending && selectedPlan === plan.id}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay with Stripe
                        </Button>
                        
                        {/* PayPal Payment */}
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handlePlanSelection(plan.id, 'paypal')}
                          disabled={createPaymentMutation.isPending && selectedPlan === plan.id}
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Pay with PayPal
                        </Button>
                        
                        {/* Razorpay Payment */}
                        <Button 
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => handlePlanSelection(plan.id, 'razorpay')}
                          disabled={createPaymentMutation.isPending && selectedPlan === plan.id}
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Pay with Razorpay
                        </Button>
                      </>
                    )}
                  </div>
                )}
                
                {plan.current && (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Feature Comparison
          </h2>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feature
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Free
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Premium
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      { name: 'Job Postings', free: '2', premium: 'Unlimited', enterprise: 'Unlimited' },
                      { name: 'Applicant Tracking', free: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
                      { name: 'Premium Targeting', free: false, premium: true, enterprise: true },
                      { name: 'Analytics', free: false, premium: true, enterprise: true },
                      { name: 'Custom Tests', free: false, premium: '50/month', enterprise: 'Unlimited' },
                      { name: 'API Access', free: false, premium: true, enterprise: true },
                      { name: 'Support', free: 'Email', premium: 'Priority Email', enterprise: '24/7 Phone' },
                    ].map((feature, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{feature.free}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {typeof feature.premium === 'boolean' ? (
                            feature.premium ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{feature.premium}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{feature.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  We accept all major credit cards through Stripe, PayPal payments, and Razorpay for international customers.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial for premium plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  All premium plans come with a 14-day free trial. No credit card required to start your trial.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}