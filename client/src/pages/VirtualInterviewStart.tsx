import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Briefcase, 
  Clock, 
  Settings, 
  Zap,
  Brain,
  MessageCircle,
  Target,
  TrendingUp,
  Award,
  Play,
  Lock,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PayPalInterviewPayment from "@/components/PayPalInterviewPayment";

export default function VirtualInterviewStart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    interviewType: 'technical',
    role: 'software_engineer',
    company: '',
    difficulty: 'medium',
    duration: 30,
    personality: 'professional',
    style: 'conversational',
    jobDescription: ''
  });

  // Check usage limits
  const { data: usageInfo, refetch: refetchUsage } = useQuery({
    queryKey: ['/api/virtual-interview/usage'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/virtual-interview/usage');
      return response.json();
    },
  });

  const startInterviewMutation = useMutation({
    mutationFn: async (data: typeof formData & { isPaid?: boolean; paymentVerificationId?: string }) => {
      const response = await apiRequest('POST', '/api/virtual-interview/start', data);
      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ requiresPayment: true, ...errorData }));
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Started!",
        description: "Your virtual AI interviewer is ready.",
      });
      setLocation(`/virtual-interview/${data.interview.sessionId}`);
      refetchUsage(); // Refresh usage info
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.requiresPayment) {
          setShowPaymentDialog(true);
          return;
        }
      } catch {}
      
      toast({
        title: "Error",
        description: error.message || "Failed to start interview session",
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    // Check usage limits first - STRICT ENFORCEMENT
    if (usageInfo && usageInfo.requiresPayment) {
      setShowPaymentDialog(true);
      return;
    }
    
    // Only allow if user has explicit permission and no payment required
    if (usageInfo && usageInfo.canStartInterview && !usageInfo.requiresPayment) {
      startInterviewMutation.mutate(formData);
    } else {
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentComplete = (paymentVerificationId: string) => {
    startInterviewMutation.mutate({ 
      ...formData, 
      isPaid: true, 
      paymentVerificationId 
    });
    setShowPaymentDialog(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview', icon: '💻', description: 'Coding, algorithms, system design' },
    { value: 'behavioral', label: 'Behavioral Interview', icon: '🤝', description: 'Teamwork, leadership, experiences' },
    { value: 'mixed', label: 'Mixed Interview', icon: '🎯', description: 'Combination of technical and behavioral' },
    { value: 'system_design', label: 'System Design', icon: '🏗️', description: 'Architecture and scalability' }
  ];

  const roles = [
    'software_engineer', 'frontend_developer', 'backend_developer', 'fullstack_developer',
    'data_scientist', 'product_manager', 'ui_ux_designer', 'devops_engineer',
    'mobile_developer', 'machine_learning_engineer', 'senior_software_engineer',
    'tech_lead', 'engineering_manager'
  ];

  const personalities = [
    { value: 'friendly', label: 'Friendly & Encouraging', description: 'Supportive and warm interviewer' },
    { value: 'professional', label: 'Professional & Structured', description: 'Business-like and organized' },
    { value: 'challenging', label: 'Challenging & Probing', description: 'Pushes you to think deeper' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Entry Level', color: 'bg-green-500' },
    { value: 'medium', label: 'Mid Level', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Senior Level', color: 'bg-red-500' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold">Real Interview Simulation</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Experience realistic interview conversations with our AI interviewer. Get real-time feedback, 
          improve your communication skills, and build confidence for actual interviews.
        </p>
        
        {/* Usage Information */}
        {usageInfo && (
          <div className="mt-6 max-w-md mx-auto">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-800 mb-2">Interview Usage</h3>
                  {usageInfo.freeInterviewsRemaining > 0 && (
                    <p className="text-sm text-blue-700">
                      🎉 {usageInfo.freeInterviewsRemaining} free interview{usageInfo.freeInterviewsRemaining === 1 ? '' : 's'} remaining
                    </p>
                  )}
                  {usageInfo.monthlyInterviewsRemaining > 0 && (
                    <p className="text-sm text-blue-700">
                      ⭐ {usageInfo.monthlyInterviewsRemaining} premium interview{usageInfo.monthlyInterviewsRemaining === 1 ? '' : 's'} remaining this month
                    </p>
                  )}
                  {usageInfo.requiresPayment && (
                    <p className="text-sm text-orange-700 flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Next interview: ${usageInfo.cost || 2}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Interview Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Interview Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Interview Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {interviewTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.interviewType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({ ...formData, interviewType: type.value })}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <h3 className="font-semibold">{type.label}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role and Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Google, Microsoft"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Difficulty Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {difficulties.map((diff) => (
                    <div
                      key={diff.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                        formData.difficulty === diff.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                    >
                      <div className={`w-4 h-4 rounded-full ${diff.color} mx-auto mb-2`}></div>
                      <p className="font-semibold">{diff.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Duration: {formData.duration} minutes
                </Label>
                <Slider
                  value={[formData.duration]}
                  onValueChange={(value) => setFormData({ ...formData, duration: value[0] })}
                  max={60}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>

              {/* Interviewer Personality */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Interviewer Personality</Label>
                <div className="space-y-2">
                  {personalities.map((personality) => (
                    <div
                      key={personality.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.personality === personality.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({ ...formData, personality: personality.value })}
                    >
                      <h3 className="font-semibold">{personality.label}</h3>
                      <p className="text-sm text-gray-600">{personality.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Paste the job description here for more tailored questions..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleStart}
                disabled={startInterviewMutation.isPending}
                className="w-full h-12 text-lg"
              >
                {startInterviewMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Virtual Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                What You'll Get
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">AI-Powered Analysis</h3>
                  <p className="text-sm text-gray-600">Real-time assessment of your responses</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Natural Conversation</h3>
                  <p className="text-sm text-gray-600">Chat-based interface like real interviews</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Personalized Questions</h3>
                  <p className="text-sm text-gray-600">Tailored to your role and experience</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-orange-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Detailed Feedback</h3>
                  <p className="text-sm text-gray-600">Comprehensive analysis and improvement tips</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Instant Results</h3>
                  <p className="text-sm text-gray-600">Get feedback immediately after completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Quick Practice Session</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Perfect for last-minute interview preparation or skill building
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-500">5+</p>
                    <p className="text-xs text-gray-600">Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">Live</p>
                    <p className="text-xs text-gray-600">Feedback</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-500">AI</p>
                    <p className="text-xs text-gray-600">Powered</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <PayPalInterviewPayment 
            cost={usageInfo?.cost || 5}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
            isProcessing={startInterviewMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}