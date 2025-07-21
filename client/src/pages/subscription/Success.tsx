import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(true);
  const [activationComplete, setActivationComplete] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionId = urlParams.get('subscription_id');
    const token = urlParams.get('token');

    if (subscriptionId || token) {
      activateSubscription(subscriptionId || token || '');
    } else {
      setIsActivating(false);
      toast({
        title: "Missing Parameters",
        description: "Subscription ID not found in URL parameters.",
        variant: "destructive",
      });
    }
  }, []);

  const activateSubscription = async (subscriptionId: string) => {
    try {
      const response = await apiRequest('POST', `/api/subscription/activate/${subscriptionId}`);
      
      if (response.ok) {
        setActivationComplete(true);
        toast({
          title: "Subscription Activated!",
          description: "Your premium subscription is now active. Welcome to AutoJobr Premium!",
        });
      } else {
        throw new Error('Failed to activate subscription');
      }
    } catch (error) {
      console.error('Subscription activation error:', error);
      toast({
        title: "Activation Error",
        description: "There was an issue activating your subscription. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  if (isActivating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Activating Your Subscription</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we activate your premium subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            {activationComplete ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            {activationComplete ? "Subscription Activated!" : "Payment Successful"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {activationComplete ? (
              <>
                <p className="text-gray-600 dark:text-gray-300">
                  Congratulations! Your AutoJobr Premium subscription is now active.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    What's Next?
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                    <li>• Unlimited job applications and analyses</li>
                    <li>• Advanced interview preparation tools</li>
                    <li>• Priority customer support</li>
                    <li>• Premium AI-powered features</li>
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                Your payment was processed successfully. If your subscription is not activated automatically, please contact our support team.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}