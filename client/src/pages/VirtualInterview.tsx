import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Clock, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  Square,
  TrendingUp,
  Award,
  Brain,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VirtualInterviewMessage {
  id: number;
  sender: 'interviewer' | 'candidate';
  messageType: 'text' | 'question' | 'answer' | 'feedback' | 'system';
  content: string;
  timestamp: string;
  messageIndex: number;
  responseQuality?: number;
  technicalAccuracy?: number;
  clarityScore?: number;
  sentiment?: string;
}

interface VirtualInterview {
  id: number;
  sessionId: string;
  interviewType: string;
  role: string;
  company?: string;
  difficulty: string;
  duration: number;
  status: string;
  currentStep: string;
  questionsAsked: number;
  totalQuestions: number;
  timeRemaining: number;
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
}

export default function VirtualInterview() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch interview session data
  const { data: sessionData, isLoading } = useQuery({
    queryKey: [`/api/virtual-interview/${sessionId}`],
    enabled: !!sessionId,
  });

  const interview: VirtualInterview = sessionData?.interview;
  const messages: VirtualInterviewMessage[] = sessionData?.messages || [];

  // Start interview mutation for assigned interviews
  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/virtual-interview/${sessionId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/virtual-interview/${sessionId}`] });
      toast({
        title: "Interview Started!",
        description: "Your virtual interview has begun. Good luck!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType: string }) => {
      const response = await apiRequest('POST', `/api/virtual-interview/${sessionId}/message`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/virtual-interview/${sessionId}`] });
      setCurrentMessage("");
      setIsTyping(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/virtual-interview/${sessionId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Complete!",
        description: "Your detailed feedback is ready.",
      });
      setLocation(`/virtual-interview/${sessionId}/feedback`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (interview && interview.status === 'active' && !isPaused) {
      setTimeLeft(interview.timeRemaining);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime <= 0) {
            completeInterviewMutation.mutate();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (interview) {
      setTimeLeft(interview.timeRemaining);
    }
  }, [interview, isPaused]);

  // Refetch interview data every 30 seconds to sync time
  useEffect(() => {
    if (interview && interview.status === 'active') {
      const syncTimer = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/virtual-interview/${sessionId}`] });
      }, 30000);

      return () => clearInterval(syncTimer);
    }
  }, [interview, sessionId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;
    
    setIsTyping(true);
    
    // Determine message type based on last interviewer message
    const lastInterviewerMessage = messages
      .filter(m => m.sender === 'interviewer')
      .slice(-1)[0];
    
    const messageType = lastInterviewerMessage?.messageType === 'question' ? 'answer' : 'text';
    
    sendMessageMutation.mutate({
      content: currentMessage.trim(),
      messageType
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageIcon = (sender: string, messageType?: string) => {
    if (sender === 'interviewer') {
      return <Bot className="h-4 w-4 text-blue-500" />;
    }
    return <User className="h-4 w-4 text-green-500" />;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-yellow-500">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Loading your interview session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Interview Session Not Found</h2>
              <p className="text-gray-600 mb-4">The interview session you're looking for doesn't exist or has expired.</p>
              <Button onClick={() => setLocation('/virtual-interview/new')}>
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (interview.questionsAsked / interview.totalQuestions) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Interview Info Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Interview Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Role</h3>
                <p className="text-lg font-medium">{interview.role.replace(/_/g, ' ')}</p>
                {interview.company && (
                  <p className="text-sm text-gray-600">at {interview.company}</p>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Type & Difficulty</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{interview.interviewType}</Badge>
                  <Badge variant={interview.difficulty === 'hard' ? 'destructive' : interview.difficulty === 'medium' ? 'default' : 'secondary'}>
                    {interview.difficulty}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">Progress</h3>
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-gray-600">
                  Question {interview.questionsAsked} of {interview.totalQuestions}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time Remaining
                </h3>
                <p className="text-2xl font-mono font-bold mt-1">
                  {formatTime(timeLeft)}
                </p>
              </div>

              {(interview.technicalScore || interview.communicationScore || interview.confidenceScore) && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">Live Scores</h3>
                  <div className="space-y-2">
                    {interview.technicalScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Technical</span>
                        <span className={`font-bold ${getScoreColor(interview.technicalScore)}`}>
                          {interview.technicalScore}%
                        </span>
                      </div>
                    )}
                    {interview.communicationScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Communication</span>
                        <span className={`font-bold ${getScoreColor(interview.communicationScore)}`}>
                          {interview.communicationScore}%
                        </span>
                      </div>
                    )}
                    {interview.confidenceScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Confidence</span>
                        <span className={`font-bold ${getScoreColor(interview.confidenceScore)}`}>
                          {interview.confidenceScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4">
                {interview.status === 'assigned' && (
                  <Button 
                    onClick={() => startInterviewMutation.mutate()}
                    className="w-full"
                    disabled={startInterviewMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                )}
                {interview.status === 'active' && (
                  <Button 
                    variant="outline" 
                    onClick={() => completeInterviewMutation.mutate()}
                    className="w-full"
                    disabled={completeInterviewMutation.isPending}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                )}
                {interview.status === 'completed' && (
                  <Button 
                    onClick={() => setLocation(`/virtual-interview/${sessionId}/feedback`)}
                    className="w-full"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View Feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Virtual AI Interview
                {interview.status === 'active' && (
                  <Badge variant="default" className="bg-green-500">Live</Badge>
                )}
                {interview.status === 'completed' && (
                  <Badge variant="outline">Completed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id} className={`flex gap-3 ${message.sender === 'candidate' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'interviewer' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {getMessageIcon(message.sender, message.messageType)}
                      </div>
                      
                      <div className={`flex-1 max-w-[80%] ${message.sender === 'candidate' ? 'text-right' : ''}`}>
                        <div className={`inline-block p-3 rounded-lg ${
                          message.sender === 'interviewer' 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {message.messageType === 'question' && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <Badge variant="outline" className="text-xs">
                                Question {index + 1}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Response Quality Indicators */}
                        {message.sender === 'candidate' && (message.responseQuality || message.technicalAccuracy || message.clarityScore) && (
                          <div className="mt-2 flex gap-2 justify-end">
                            {message.responseQuality && getScoreBadge(message.responseQuality * 10)}
                            {message.sentiment && (
                              <Badge variant={message.sentiment === 'positive' ? 'default' : message.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                                {message.sentiment}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <Separator />
              
              {/* Input Area */}
              {interview.status === 'active' && (
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response here..."
                      disabled={isTyping || sendMessageMutation.isPending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isTyping || sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Press Enter to send • Shift+Enter for new line</span>
                    {sendMessageMutation.isPending && <span>Sending...</span>}
                  </div>
                </div>
              )}
              
              {interview.status === 'completed' && (
                <div className="p-4 bg-gray-50 text-center">
                  <p className="text-gray-600 mb-2">Interview completed!</p>
                  <Button onClick={() => setLocation(`/virtual-interview/${sessionId}/feedback`)}>
                    View Detailed Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}