import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trophy, Star, Clock, Users, Crown, Target, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function RankingTests() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [showPayment, setShowPayment] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paypal'>('stripe');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available test categories and domains
  const { data: categories = { categories: [], domains: [] } } = useQuery({
    queryKey: ['/api/ranking-tests/categories'],
    queryFn: () => apiRequest('GET', '/api/ranking-tests/categories').then(res => res.json())
  });

  // Fetch user's test history
  const { data: testHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/ranking-tests/history'],
    queryFn: () => apiRequest('GET', '/api/ranking-tests/history').then(res => res.json())
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/ranking-tests/leaderboard', selectedCategory, selectedDomain, leaderboardType],
    queryFn: () => {
      if (!selectedCategory || !selectedDomain) return [];
      return apiRequest('GET', `/api/ranking-tests/leaderboard?category=${selectedCategory}&domain=${selectedDomain}&type=${leaderboardType}&limit=10`)
        .then(res => res.json());
    },
    enabled: !!selectedCategory && !!selectedDomain
  });

  // Create new test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: { category: string; domain: string; difficultyLevel: string }) => {
      const response = await apiRequest('POST', '/api/ranking-tests/create', testData);
      return response.json();
    },
    onSuccess: (test) => {
      setCurrentTest(test);
      setShowPayment(true);
      toast({
        title: "Test Created",
        description: "Your ranking test has been created. Complete payment to start.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test",
        variant: "destructive",
      });
    }
  });

  const handleCreateTest = () => {
    if (!selectedCategory || !selectedDomain) {
      toast({
        title: "Missing Information",
        description: "Please select category and domain",
        variant: "destructive",
      });
      return;
    }

    createTestMutation.mutate({
      category: selectedCategory,
      domain: selectedDomain,
      difficultyLevel: 'expert'
    });
  };

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Basic questions' },
    { value: 'intermediate', label: 'Intermediate', description: 'Moderate difficulty' },
    { value: 'advanced', label: 'Advanced', description: 'Challenging questions' },
    { value: 'expert', label: 'Expert', description: 'Very difficult questions' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-4 h-4 text-orange-500" />;
    return <Target className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ranking Test System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Take paid ranking tests ($1 per attempt) to compete for top positions. 
            Top performers get their profiles shared with recruiters automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Creation Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Take New Ranking Test
                </CardTitle>
                <CardDescription>
                  Select your test parameters and compete for rankings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.categories.map((cat: string) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Domain</label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.domains.map((domain: string) => (
                          <SelectItem key={domain} value={domain}>
                            {domain.charAt(0).toUpperCase() + domain.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Expert Level Only</span>
                  </div>
                  <p className="text-sm text-amber-800">
                    All ranking tests are set to expert difficulty level to ensure fair competition among top performers.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Ranking System</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Weekly top 10 performers get shared with recruiters</li>
                    <li>• Monthly top 5 performers get additional exposure</li>
                    <li>• All rankings are public and competitive</li>
                    <li>• Each test attempt costs $1</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleCreateTest}
                  disabled={!selectedCategory || !selectedDomain || createTestMutation.isPending}
                  className="w-full"
                >
                  {createTestMutation.isPending ? 'Starting Test...' : 'Take Test ($1)'}
                </Button>
              </CardContent>
            </Card>

            {/* Test History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Your Test History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test history...</p>
                  </div>
                ) : testHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No tests taken yet. Create your first ranking test!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testHistory.map((test: any) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getRankBadge(test.rank || 0)}
                            <span className="font-medium">{test.testTitle}</span>
                          </div>
                          <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                            {test.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Score:</span>
                            <span className={`ml-1 font-medium ${getScoreColor(test.percentageScore)}`}>
                              {test.percentageScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rank:</span>
                            <span className="ml-1 font-medium">#{test.rank || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-1 font-medium">{Math.round(test.timeSpent / 60)}m</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment:</span>
                            <span className="ml-1 font-medium">
                              {test.paymentStatus === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 inline" />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  Top performers in selected category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="all-time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!selectedCategory || !selectedDomain ? (
                  <p className="text-gray-500 text-center py-8">
                    Select category and domain to view leaderboard
                  </p>
                ) : leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No rankings yet. Be the first to take a test!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry: any, index: number) => (
                      <div key={entry.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getRankBadge(entry.rank)}
                          <span className="font-bold text-lg">#{entry.rank}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {entry.userName} {entry.userLastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Score: <span className={getScoreColor(entry.score)}>{entry.score}%</span>
                          </div>
                        </div>
                        {entry.rank <= 10 && (
                          <Badge variant="secondary" className="text-xs">
                            Recruiter Visible
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Complete Payment to Start Test</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Test: {currentTest.testTitle}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">$1.00</p>
            
            {/* Payment Provider Selection */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Select Payment Method</Label>
              <RadioGroup value={paymentProvider} onValueChange={(value: 'stripe' | 'paypal') => setPaymentProvider(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <CreditCard className="w-4 h-4" />
                    Cards, Apple Pay, Google Pay (Stripe)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.696.696 0 0 0-.682.816l-.73 4.607a.384.384 0 0 0 .38.44h2.287a.56.56 0 0 0 .556-.48l.23-1.458.024-.127a.56.56 0 0 1 .555-.48h.35c3.581 0 6.389-1.455 7.208-5.662.343-1.762.166-3.238-.65-4.394a3.27 3.27 0 0 0-.552-.576z"/>
                    </svg>
                    PayPal
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {paymentProvider === 'stripe' ? (
              <Elements stripe={stripePromise}>
                <StripePaymentForm 
                  testId={currentTest.id}
                  onSuccess={() => {
                    setShowPayment(false);
                    setCurrentTest(null);
                    queryClient.invalidateQueries({ queryKey: ['/api/ranking-tests/history'] });
                  }}
                  onCancel={() => {
                    setShowPayment(false);
                    setCurrentTest(null);
                  }}
                />
              </Elements>
            ) : (
              <PayPalPaymentForm
                testId={currentTest.id}
                onSuccess={() => {
                  setShowPayment(false);
                  setCurrentTest(null);
                  queryClient.invalidateQueries({ queryKey: ['/api/ranking-tests/history'] });
                }}
                onCancel={() => {
                  setShowPayment(false);
                  setCurrentTest(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StripePaymentForm({ testId, onSuccess, onCancel }: { testId: number; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const response = await apiRequest('POST', `/api/ranking-tests/${testId}/payment`, {
        paymentProvider: 'stripe'
      });
      const { clientSecret } = await response.json();

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You can now start your ranking test!",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Supports all major credit cards, Apple Pay, Google Pay, Stripe Link, and bank accounts
      </div>
      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={!stripe || processing}
          className="flex-1"
        >
          {processing ? 'Processing...' : 'Pay $1'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PayPalPaymentForm({ testId, onSuccess, onCancel }: { testId: number; onSuccess: () => void; onCancel: () => void }) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
    setProcessing(true);

    try {
      // Create PayPal order
      const response = await apiRequest('POST', `/api/ranking-tests/${testId}/payment`, {
        paymentProvider: 'paypal'
      });
      const { approvalUrl } = await response.json();

      // Redirect to PayPal for approval
      window.location.href = approvalUrl;
    } catch (error: any) {
      let errorMessage = "Failed to create PayPal order";
      
      if (error.message && error.message.includes('not configured')) {
        errorMessage = "PayPal is not configured yet. Please use Stripe or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You will be redirected to PayPal to complete your payment securely
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handlePayPalPayment}
          disabled={processing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {processing ? 'Redirecting...' : 'Pay with PayPal'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}