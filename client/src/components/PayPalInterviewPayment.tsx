import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Clock, CheckCircle } from "lucide-react";

interface PayPalInterviewPaymentProps {
  cost: number;
  onPaymentComplete: (paymentVerificationId: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function PayPalInterviewPayment({ 
  cost, 
  onPaymentComplete, 
  onCancel, 
  isProcessing = false 
}: PayPalInterviewPaymentProps) {
  const [isPayPalLoading, setIsPayPalLoading] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
    setIsPayPalLoading(true);
    try {
      // Create PayPal order for interview retake payment
      const response = await fetch('/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cost.toString(),
          currency: 'USD',
          intent: 'CAPTURE',
          description: 'Virtual Interview Retake Payment'
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
      setIsPayPalLoading(false);
      toast({
        title: "Payment Failed",
        description: error.message || "PayPal payment could not be processed. Please try again.",
        variant: "destructive",
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

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
          <Shield className="h-4 w-4" />
          Payment Required
        </div>
        <h3 className="text-xl font-bold">Complete Payment to Start Interview</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your preferred payment method to proceed with your virtual interview
        </p>
      </div>

      {/* Interview Cost */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Virtual Interview Session</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">30 minutes • AI-powered</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">${cost}</div>
            <div className="text-xs text-gray-500">USD</div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h4 className="font-medium text-center">Select Payment Method</h4>
        
        {/* PayPal Button */}
        <Button
          onClick={handlePayPalPayment}
          disabled={isPayPalLoading || isRazorpayLoading || isProcessing}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white relative"
          size="lg"
        >
          {isPayPalLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Processing PayPal Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-3" />
              Pay ${cost} with PayPal
            </>
          )}
        </Button>

        {/* Razorpay Button */}
        <Button
          onClick={handleRazorpayPayment}
          disabled={isPayPalLoading || isRazorpayLoading || isProcessing}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white relative"
          size="lg"
        >
          {isRazorpayLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Processing Razorpay Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-3" />
              Pay ${cost} with Razorpay
            </>
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Your payment is processed securely through encrypted channels. We never store your payment information.
        </p>
      </div>

      {/* Cancel Button */}
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isPayPalLoading || isRazorpayLoading || isProcessing}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}