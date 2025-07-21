import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface OneTimePaymentProps {
  amount: number;
  currency: string;
  purpose: 'test_retake' | 'mock_interview' | 'coding_test' | 'ranking_test';
  itemId: string;
  itemName: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export default function OneTimePaymentGateway({
  amount,
  currency,
  purpose,
  itemId,
  itemName,
  onPaymentSuccess,
  onPaymentError,
  description,
  className,
  disabled = false
}: OneTimePaymentProps) {
  const [selectedGateway, setSelectedGateway] = useState<'paypal' | 'cashfree' | 'razorpay'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentGateways = [
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">P</div>,
      description: 'Pay securely with PayPal',
      status: 'active',
      badge: 'Primary',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'cashfree',
      name: 'Cashfree',
      icon: <Wallet className="w-6 h-6 text-orange-600" />,
      description: 'UPI, Cards, Netbanking & Wallets',
      status: 'setup',
      badge: 'Coming Soon',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      description: 'Cards, UPI, BNPL & more payment options',
      status: 'setup',
      badge: 'Coming Soon',
      badgeColor: 'bg-blue-100 text-blue-800'
    }
  ];

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'test_retake': return 'Test Retake';
      case 'mock_interview': return 'Mock Interview Retake';
      case 'coding_test': return 'Coding Test Retake';
      case 'ranking_test': return 'Ranking Test Retake';
      default: return 'Payment';
    }
  };

  const handlePayPalSuccess = (data: any) => {
    setIsProcessing(false);
    onPaymentSuccess?.(data);
  };

  const handlePayPalError = (error: any) => {
    setIsProcessing(false);
    onPaymentError?.(error);
  };

  const handleComingSoonPayment = (gatewayName: string) => {
    onPaymentError?.({
      message: `${gatewayName} integration is coming soon. Please use PayPal for now.`
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Gateway Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Select Payment Method
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gateway Options */}
          <div className="grid gap-3">
            {paymentGateways.map((gateway) => (
              <div
                key={gateway.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedGateway === gateway.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : gateway.status === 'active'
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 dark:bg-gray-900'
                }`}
                onClick={() => {
                  if (gateway.status === 'active') {
                    setSelectedGateway(gateway.id as any);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {gateway.icon}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {gateway.name}
                        <Badge className={`text-xs ${gateway.badgeColor}`}>
                          {gateway.badge}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {gateway.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gateway.status === 'active' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-500" />
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedGateway === gateway.id && gateway.status === 'active'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedGateway === gateway.id && gateway.status === 'active' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Item:</span>
                <span className="font-medium">{itemName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Purpose:</span>
                <span className="font-medium">{getPurposeLabel(purpose)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">
                  {currency.toUpperCase()} {amount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Card>
        <CardContent className="pt-6">
          {selectedGateway === 'paypal' ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold">Complete One-Time Payment with PayPal</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button below to proceed with secure PayPal payment
                </p>
              </div>
              <Button
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    // Create PayPal order for one-time payment
                    const response = await fetch('/paypal/order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: amount.toString(),
                        currency: currency.toUpperCase(),
                        intent: 'CAPTURE',
                        description: `${getPurposeLabel(purpose)} - ${itemName}`
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
                  } catch (error: any) {
                    setIsProcessing(false);
                    console.error('PayPal payment error:', error);
                    
                    let errorMessage = 'PayPal payment failed';
                    if (error.message) {
                      if (error.message.includes('temporarily unavailable')) {
                        errorMessage = 'PayPal is temporarily unavailable. Please contact support.';
                      } else {
                        errorMessage = error.message;
                      }
                    }
                    
                    handlePayPalError({ message: errorMessage });
                  }
                }}
                disabled={isProcessing || disabled}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-3" />
                    Pay {currency.toUpperCase()} {amount} with PayPal
                  </>
                )}
              </Button>
            </div>
          ) : selectedGateway === 'cashfree' ? (
            <div className="text-center space-y-4">
              <div className="text-orange-600">
                <Wallet className="w-12 h-12 mx-auto mb-2" />
                <h3 className="font-semibold">Cashfree Integration Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  We're working on integrating Cashfree for UPI and card payments.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleComingSoonPayment('Cashfree')}
                className="w-full"
                disabled={disabled}
              >
                Notify Me When Available
              </Button>
            </div>
          ) : selectedGateway === 'razorpay' ? (
            <div className="text-center space-y-4">
              <div className="text-blue-600">
                <CreditCard className="w-12 h-12 mx-auto mb-2" />
                <h3 className="font-semibold">Razorpay Integration Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  We're working on integrating Razorpay for comprehensive payment options.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleComingSoonPayment('Razorpay')}
                className="w-full"
                disabled={disabled}
              >
                Notify Me When Available
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Payment Security Info */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-green-800 dark:text-green-200">
              Secure One-Time Payment
            </div>
            <div className="text-green-700 dark:text-green-300">
              All payments are processed securely with industry-standard encryption. 
              Your payment information is never stored on our servers. Access will be granted immediately after successful payment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}