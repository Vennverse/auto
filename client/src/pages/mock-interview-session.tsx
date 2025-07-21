import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { 
  Timer, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Pause, 
  Code, 
  MessageCircle, 
  Settings, 
  Lightbulb,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface MockInterview {
  id: number;
  sessionId: string;
  userId: string;
  role: string;
  company: string;
  interviewType: string;
  difficulty: string;
  language: string;
  totalQuestions: number;
  currentQuestion: number;
  timeRemaining: number;
  status: string;
  score: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

interface MockInterviewQuestion {
  id: number;
  interviewId: number;
  questionNumber: number;
  question: string;
  questionType: string;
  difficulty: string;
  hints: string;
  testCases: string;
  sampleAnswer: string;
  userAnswer: string;
  userCode: string;
  feedback: string;
  score: number;
  timeSpent: number;
}

interface InterviewSession {
  interview: MockInterview;
  questions: MockInterviewQuestion[];
}

export default function MockInterviewSession() {
  const [, params] = useRoute('/mock-interview/session/:sessionId');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const sessionId = params?.sessionId;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [userCode, setUserCode] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef(Date.now());

  // Fetch interview session
  const { data: session, isLoading } = useQuery<InterviewSession>({
    queryKey: [`/api/mock-interview/session/${sessionId}`],
    enabled: !!sessionId,
    retry: false,
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string; code?: string; timeSpent: number }) => {
      const response = await apiRequest('POST', '/api/mock-interview/answer', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Answer Submitted",
        description: "Your answer has been recorded and scored.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/mock-interview/${sessionId}/start`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Interview Started!",
        description: "Good luck! The timer is now running.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/mock-interview/session/${sessionId}`] });
      setIsTimerRunning(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/mock-interview/complete/${sessionId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Interview Completed!",
        description: "Redirecting to results...",
      });
      navigate(`/mock-interview/results/${sessionId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Load saved answer for current question
  useEffect(() => {
    if (session?.questions[currentQuestionIndex]) {
      const question = session.questions[currentQuestionIndex];
      setUserAnswer(question.userAnswer || '');
      setUserCode(question.userCode || '');
      setTimeSpent(question.timeSpent || 0);
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Session Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The interview session could not be found or has expired.</p>
          <Button onClick={() => navigate('/mock-interview')}>
            Back to Mock Interviews
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const currentTimeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    
    await submitAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      answer: userAnswer,
      code: currentQuestion.questionType === 'coding' ? userCode : undefined,
      timeSpent: currentTimeSpent
    });

    // Move to next question or complete interview
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setUserCode('');
      setTimeSpent(0);
      setShowHints(false);
      setShowTestCases(false);
    } else {
      completeInterviewMutation.mutate();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="w-5 h-5" />;
      case 'behavioral': return <MessageCircle className="w-5 h-5" />;
      case 'system_design': return <Settings className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const hints = currentQuestion?.hints ? (() => {
    try {
      // If it's already an array, return it directly
      if (Array.isArray(currentQuestion.hints)) {
        return currentQuestion.hints;
      }
      // Otherwise try to parse as JSON
      return JSON.parse(currentQuestion.hints);
    } catch (error) {
      console.warn('Failed to parse hints:', error);
      return [];
    }
  })() : [];
  
  const testCases = currentQuestion?.testCases ? (() => {
    try {
      // If it's already an array, return it directly
      if (Array.isArray(currentQuestion.testCases)) {
        return currentQuestion.testCases;
      }
      // Otherwise try to parse as JSON
      return JSON.parse(currentQuestion.testCases);
    } catch (error) {
      console.warn('Failed to parse test cases:', error);
      return [];
    }
  })() : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {session.interview.role} Interview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {session.interview.company || 'Mock Company'} • {session.interview.interviewType.replace('_', ' ')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg">{formatTime(timeSpent)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </span>
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(currentQuestion?.questionType || '')}
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge className={getDifficultyColor(currentQuestion?.difficulty || '')}>
                    {currentQuestion?.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed">
                    {currentQuestion?.question}
                  </p>
                </div>

                {/* Hints */}
                {hints.length > 0 && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHints(!showHints)}
                      className="mb-3"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showHints ? 'Hide' : 'Show'} Hints ({hints.length})
                    </Button>
                    {showHints && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <ul className="space-y-2">
                          {hints.map((hint: string, index: number) => (
                            <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                              {index + 1}. {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Cases for Coding Questions */}
                {currentQuestion?.questionType === 'coding' && testCases.length > 0 && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTestCases(!showTestCases)}
                      className="mb-3"
                    >
                      {showTestCases ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showTestCases ? 'Hide' : 'Show'} Test Cases ({testCases.length})
                    </Button>
                    {showTestCases && (
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-3">
                          {testCases.map((testCase: any, index: number) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                Test Case {index + 1}: {testCase.description}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Input:</span>
                                  <code className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    {JSON.stringify(testCase.input)}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Expected:</span>
                                  <code className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    {JSON.stringify(testCase.expected)}
                                  </code>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Input */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                {currentQuestion?.questionType === 'coding' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Explanation
                      </label>
                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Explain your approach and thought process..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Code ({session.interview.language})
                      </label>
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <Editor
                          height="300px"
                          defaultLanguage={session.interview.language}
                          value={userCode}
                          onChange={(value) => setUserCode(value || '')}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            automaticLayout: true,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[200px]"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div>
            <Card className="bg-white dark:bg-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Interview Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        index === currentQuestionIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : question.userAnswer
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : question.userAnswer
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {question.userAnswer ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Question {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {question.questionType.replace('_', ' ')} • {question.difficulty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                {session.interview.status === 'assigned' ? (
                  <div className="text-center">
                    <Button
                      onClick={() => startInterviewMutation.mutate()}
                      disabled={startInterviewMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {startInterviewMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start Interview
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={submitAnswerMutation.isPending || completeInterviewMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {submitAnswerMutation.isPending || completeInterviewMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      ) : currentQuestionIndex === session.questions.length - 1 ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      {currentQuestionIndex === session.questions.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}