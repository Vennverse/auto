import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function SubscriptionCancel() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            Subscription Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Your subscription process was cancelled. No payment was charged to your account.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Why Subscribe to Premium?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>• Unlimited job applications and analyses</li>
                <li>• Advanced AI-powered interview preparation</li>
                <li>• Priority customer support</li>
                <li>• Advanced analytics and insights</li>
                <li>• No monthly limits on key features</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/premium')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}