import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface PayPalSubscriptionButtonProps {
  tierId: string;
  tierName: string;
  price: number;
  userType: 'jobseeker' | 'recruiter';
  onSuccess: (subscriptionId: string) => void;
  disabled?: boolean;
}

export default function PayPalSubscriptionButton({
  tierId,
  tierName,
  price,
  userType,
  onSuccess,
  disabled = false
}: PayPalSubscriptionButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { tierId: string; userType: string; paymentMethod: string }) => {
      const response = await apiRequest('/api/subscription/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.approvalUrl) {
        toast({
          title: "Redirecting to PayPal",
          description: "Complete your monthly subscription setup with PayPal.",
        });
        // Redirect to PayPal approval URL for subscription
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubscribe = async () => {
    if (disabled) return;
    
    setIsProcessing(true);
    try {
      createSubscriptionMutation.mutate({ 
        tierId, 
        userType, 
        paymentMethod: 'paypal' 
      });
    } catch (error) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* PayPal Subscription Button */}
      <Button
        onClick={handleSubscribe}
        disabled={disabled || isProcessing || createSubscriptionMutation.isPending}
        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white relative"
        size="lg"
      >
        {isProcessing || createSubscriptionMutation.isPending ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-3" />
            Subscribe with PayPal - ${price}/month
          </>
        )}
      </Button>

      {/* Security Notice */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Secure PayPal Subscription</span>
          </div>
          <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Automatic monthly billing</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Cancel anytime in your account</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Secure PayPal payment processing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
        By subscribing, you agree to our terms of service. Subscription will automatically renew monthly until cancelled.
      </p>
    </div>
  );
}