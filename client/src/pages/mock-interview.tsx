import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MockInterviewPayment } from "@/components/mock-interview-payment";
import PayPalMockInterviewPayment from "@/components/PayPalMockInterviewPayment";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Play, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Code, 
  MessageCircle, 
  Settings, 
  Star,
  Users,
  Award,
  Target,
  Brain,
  Zap,
  BookOpen,
  CheckCircle,
  AlertCircle,
  CreditCard
} from "lucide-react";

interface InterviewStats {
  totalInterviews: number;
  freeInterviewsUsed: number;
  freeInterviewsRemaining: number;
  averageScore: number;
  bestScore: number;
  lastInterviewDate: string;
}

interface InterviewHistory {
  id: number;
  sessionId: string;
  role: string;
  company: string;
  interviewType: string;
  difficulty: string;
  score: number;
  status: string;
  createdAt: string;
  completedAt: string;
}

interface StartInterviewForm {
  role: string;
  company: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interviewType: 'technical' | 'behavioral' | 'system_design';
  language: string;
  totalQuestions: number;
}

export default function MockInterview() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("start");
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  
  const [interviewForm, setInterviewForm] = useState<StartInterviewForm>({
    role: '',
    company: '',
    difficulty: 'medium',
    interviewType: 'technical',
    language: 'javascript',
    totalQuestions: 3
  });

  // Check usage limits
  const { data: usageInfo, refetch: refetchUsage } = useQuery({
    queryKey: ['/api/mock-interview/usage'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/mock-interview/usage');
      return response.json();
    },
  });

  // Fetch interview stats
  const { data: stats, isLoading: statsLoading } = useQuery<InterviewStats>({
    queryKey: ['/api/mock-interview/stats'],
    retry: false,
  });

  // Fetch interview history
  const { data: history = [], isLoading: historyLoading } = useQuery<InterviewHistory[]>({
    queryKey: ['/api/mock-interview/history'],
    retry: false,
  });

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async (data: StartInterviewForm & { isPaid?: boolean; paymentVerificationId?: string }) => {
      const response = await apiRequest('POST', '/api/mock-interview/start', data);
      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ requiresPayment: true, ...errorData }));
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Mock interview started successfully:', data);
      toast({
        title: "Interview Started!",
        description: "Your mock coding interview has begun. Good luck!",
      });
      navigate(`/mock-interview/session/${data.sessionId}`);
      refetchUsage(); // Refresh usage info
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.requiresPayment) {
          setShowPaymentRequired(true);
          return;
        }
      } catch {}
      
      toast({
        title: "Error",
        description: error.message || "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartInterview = () => {
    if (!interviewForm.role.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the role you're interviewing for.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits first - STRICT ENFORCEMENT
    if (usageInfo && usageInfo.requiresPayment) {
      setShowPaymentRequired(true);
      return;
    }
    
    // Only allow if user has explicit permission and no payment required
    if (usageInfo && usageInfo.canStartInterview && !usageInfo.requiresPayment) {
      startInterviewMutation.mutate(interviewForm);
    } else {
      setShowPaymentRequired(true);
    }
  };

  const handlePaymentComplete = (paymentVerificationId: string) => {
    startInterviewMutation.mutate({ 
      ...interviewForm, 
      isPaid: true, 
      paymentVerificationId 
    });
    setShowPaymentRequired(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentRequired(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <Code className="w-4 h-4" />;
      case 'behavioral': return <MessageCircle className="w-4 h-4" />;
      case 'system_design': return <Settings className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (statsLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading interview data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Technical Skills Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Practice specific questions with instant feedback and detailed scoring
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalInterviews || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.averageScore || 0}%</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.bestScore || 0}%</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Free Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.freeInterviewsRemaining || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="start">Start Interview</TabsTrigger>
            <TabsTrigger value="history">Interview History</TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  Configure Your Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="role">Role/Position *</Label>
                    <Input
                      id="role"
                      value={interviewForm.role}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Software Engineer, Product Manager"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      value={interviewForm.company}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g., Google, Microsoft, Startup"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interviewType">Interview Type</Label>
                    <Select 
                      value={interviewForm.interviewType} 
                      onValueChange={(value: any) => setInterviewForm(prev => ({ ...prev, interviewType: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Interview</SelectItem>
                        <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                        <SelectItem value="system_design">System Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select 
                      value={interviewForm.difficulty} 
                      onValueChange={(value: any) => setInterviewForm(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {interviewForm.interviewType === 'technical' && (
                    <div>
                      <Label htmlFor="language">Programming Language</Label>
                      <Select 
                        value={interviewForm.language} 
                        onValueChange={(value: any) => setInterviewForm(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                          <SelectItem value="rust">Rust</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="totalQuestions">Number of Questions</Label>
                    <Select 
                      value={interviewForm.totalQuestions.toString()} 
                      onValueChange={(value: any) => setInterviewForm(prev => ({ ...prev, totalQuestions: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Question</SelectItem>
                        <SelectItem value="2">2 Questions</SelectItem>
                        <SelectItem value="3">3 Questions</SelectItem>
                        <SelectItem value="4">4 Questions</SelectItem>
                        <SelectItem value="5">5 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Free Interview Warning */}
                {stats?.freeInterviewsRemaining === 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">No free interviews remaining</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      You have used your free interview. Purchase additional interviews to continue practicing.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Estimated time: {interviewForm.totalQuestions * 15} minutes
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleStartInterview}
                    disabled={startInterviewMutation.isPending || !interviewForm.role.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {startInterviewMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Starting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Start Interview
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Interview History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No interviews completed yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Start your first mock interview to see your progress here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((interview) => (
                      <div key={interview.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              {getTypeIcon(interview.interviewType)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{interview.role}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {interview.company || 'Generic Company'} • {interview.interviewType.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Badge className={getDifficultyColor(interview.difficulty)}>
                              {interview.difficulty}
                            </Badge>
                            
                            {interview.status === 'completed' && (
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getScoreColor(interview.score)}`}>
                                  {interview.score}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(interview.completedAt).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/mock-interview/results/${interview.sessionId}`)}
                            >
                              View Results
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Required Dialog */}
        <Dialog open={showPaymentRequired} onOpenChange={setShowPaymentRequired}>
          <DialogContent className="sm:max-w-lg">
            <PayPalMockInterviewPayment 
              cost={usageInfo?.cost || 5}
              onPaymentComplete={handlePaymentComplete}
              onCancel={handlePaymentCancel}
              isProcessing={startInterviewMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}