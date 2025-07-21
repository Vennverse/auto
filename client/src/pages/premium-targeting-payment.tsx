import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Target, CreditCard, Shield, Users, Star, CheckCircle } from "lucide-react";
import OneTimePaymentGateway from "@/components/OneTimePaymentGateway";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TargetingJob {
  title: string;
  description: string;
  estimatedCost: number;
  targetingCriteria: {
    education?: string[];
    experience?: string;
    skills?: string[];
    location?: string;
    gpa?: number;
    certifications?: string[];
  };
  estimatedReach: number;
  matchQuality: number;
}

export default function PremiumTargetingPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [targetingJob, setTargetingJob] = useState<TargetingJob | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'cashfree' | 'razorpay'>('paypal');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    // Load targeting job data from localStorage
    const storedJob = localStorage.getItem('pendingTargetingJob');
    if (storedJob) {
      setTargetingJob(JSON.parse(storedJob));
    } else {
      // Redirect back if no targeting job found
      window.location.href = '/premium-targeting';
    }
  }, []);

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('POST', '/api/premium-targeting/payment', paymentData);
    },
    onSuccess: async (response) => {
      // Clear the pending job
      localStorage.removeItem('pendingTargetingJob');
      
      // Create the targeted job posting
      if (targetingJob) {
        try {
          await apiRequest('POST', '/api/jobs/targeted', {
            ...targetingJob,
            isPremiumTargeting: true,
            paymentId: response.paymentId
          });
          
          toast({
            title: "Premium Targeting Activated!",
            description: `Your job "${targetingJob.title}" is now live with premium targeting for $${targetingJob.estimatedCost}.`,
          });
          
          // Redirect to dashboard
          window.location.href = '/dashboard';
        } catch (error) {
          toast({
            title: "Job Creation Failed",
            description: "Payment successful but job creation failed. Please contact support.",
            variant: "destructive"
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStripePayment = async () => {
    if (!targetingJob) return;
    
    setIsProcessingPayment(true);
    
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: targetingJob.estimatedCost * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          type: 'premium-targeting',
          jobTitle: targetingJob.title
        }
      });
      
      paymentMutation.mutate({
        stripePaymentIntentId: response.paymentIntent.id,
        paymentMethod: 'stripe',
        amount: targetingJob.estimatedCost,
        jobData: targetingJob
      });
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Could not process Stripe payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!targetingJob) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Create PayPal order for premium targeting payment
      const response = await fetch('/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: targetingJob.estimatedCost.toString(),
          currency: 'USD',
          intent: 'CAPTURE',
          description: `Premium Targeting for ${targetingJob.title}`
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
      console.error('PayPal payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Could not process PayPal payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = () => {
    if (selectedPaymentMethod === 'stripe') {
      handleStripePayment();
    } else {
      handlePayPalPayment();
    }
  };

  if (!targetingJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading targeting job details...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Premium Candidate Targeting</h1>
            </div>
            <p className="text-muted-foreground">
              Complete your payment to activate precision targeting for your job posting
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Job Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Job Summary
                </CardTitle>
                <CardDescription>
                  Review your premium targeting job details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{targetingJob.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {targetingJob.description}
                  </p>
                </div>

                <Separator />

                {/* Targeting Criteria */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Targeting Criteria
                  </h4>
                  
                  {targetingJob.targetingCriteria.education && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Education: </span>
                      <span className="text-sm">{targetingJob.targetingCriteria.education.join(', ')}</span>
                    </div>
                  )}
                  
                  {targetingJob.targetingCriteria.experience && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Experience: </span>
                      <span className="text-sm">{targetingJob.targetingCriteria.experience}</span>
                    </div>
                  )}
                  
                  {targetingJob.targetingCriteria.skills && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Skills: </span>
                      <span className="text-sm">{targetingJob.targetingCriteria.skills.join(', ')}</span>
                    </div>
                  )}
                  
                  {targetingJob.targetingCriteria.location && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Location: </span>
                      <span className="text-sm">{targetingJob.targetingCriteria.location}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Targeting Metrics */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Targeting Metrics
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {targetingJob.estimatedReach.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Estimated Reach</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {targetingJob.matchQuality}%
                      </div>
                      <div className="text-xs text-muted-foreground">Match Quality</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Complete your premium targeting payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* One-Time Payment Gateway */}
                <OneTimePaymentGateway
                  amount={targetingJob.estimatedCost}
                  currency="USD"
                  purpose="premium_targeting"
                  itemId="pending"
                  itemName={targetingJob.title}
                  description="Complete payment to activate precision candidate targeting"
                  onPaymentSuccess={(data) => {
                    localStorage.removeItem('pendingTargetingJob');
                    toast({
                      title: "Premium Targeting Activated!",
                      description: `Your job "${targetingJob.title}" is now live with premium targeting.`,
                    });
                    window.location.href = '/dashboard';
                  }}
                  onPaymentError={(error) => {
                    toast({
                      title: "Payment Failed",
                      description: error.message || "Payment could not be processed. Please try again.",
                      variant: "destructive",
                    });
                  }}
                  disabled={isProcessingPayment}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}