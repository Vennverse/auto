import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Award, 
  Target, 
  BookOpen, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Brain,
  MessageCircle,
  Zap,
  BarChart3,
  Star,
  Lightbulb,
  ExternalLink
} from "lucide-react";

interface FeedbackData {
  interview: {
    id: number;
    sessionId: string;
    interviewType: string;
    role: string;
    company?: string;
    difficulty: string;
    duration: number;
    overallScore?: number;
    technicalScore?: number;
    communicationScore?: number;
    confidenceScore?: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    detailedFeedback: string;
  };
  feedback: {
    performanceSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    technicalSkillsScore: number;
    problemSolvingScore: number;
    communicationScore: number;
    responseConsistency: number;
    adaptabilityScore: number;
    stressHandling: number;
    recommendedResources: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    nextSteps: string[];
    roleReadiness: 'ready' | 'needs_practice' | 'significant_gaps';
  };
}

export default function VirtualInterviewFeedback() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<FeedbackData>({
    queryKey: ['/api/virtual-interview', sessionId, 'feedback'],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Generating your detailed feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Feedback Not Available</h2>
              <p className="text-gray-600 mb-4">We couldn't load the feedback for this interview session.</p>
              <Button onClick={() => setLocation('/virtual-interview/new')}>
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { interview, feedback } = data;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getReadinessBadge = (readiness: string) => {
    switch (readiness) {
      case 'ready':
        return <Badge className="bg-green-500">Interview Ready</Badge>;
      case 'needs_practice':
        return <Badge className="bg-yellow-500">Needs Practice</Badge>;
      case 'significant_gaps':
        return <Badge variant="destructive">Significant Gaps</Badge>;
      default:
        return <Badge variant="outline">Assessment Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/virtual-interview/new')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          New Interview
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Interview Feedback</h1>
          <p className="text-gray-600">
            {interview.role.replace(/_/g, ' ')} • {interview.interviewType} • {interview.difficulty}
            {interview.company && ` • ${interview.company}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Performance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(interview.overallScore || 0)}`}>
                    {interview.overallScore || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Overall Score</p>
                </div>
                <div className="flex-1">
                  {getReadinessBadge(feedback.roleReadiness)}
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                {feedback.performanceSummary}
              </p>
              
              {interview.detailedFeedback && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-900">{interview.detailedFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detailed Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Technical Skills */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Technical Skills</span>
                  <span className={`font-bold ${getScoreColor(feedback.technicalSkillsScore)}`}>
                    {feedback.technicalSkillsScore}%
                  </span>
                </div>
                <Progress value={feedback.technicalSkillsScore} className="h-2" />
              </div>

              {/* Problem Solving */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Problem Solving</span>
                  <span className={`font-bold ${getScoreColor(feedback.problemSolvingScore)}`}>
                    {feedback.problemSolvingScore}%
                  </span>
                </div>
                <Progress value={feedback.problemSolvingScore} className="h-2" />
              </div>

              {/* Communication */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Communication</span>
                  <span className={`font-bold ${getScoreColor(feedback.communicationScore)}`}>
                    {feedback.communicationScore}%
                  </span>
                </div>
                <Progress value={feedback.communicationScore} className="h-2" />
              </div>

              {/* Response Consistency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Response Consistency</span>
                  <span className={`font-bold ${getScoreColor(feedback.responseConsistency)}`}>
                    {feedback.responseConsistency}%
                  </span>
                </div>
                <Progress value={feedback.responseConsistency} className="h-2" />
              </div>

              {/* Adaptability */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Adaptability</span>
                  <span className={`font-bold ${getScoreColor(feedback.adaptabilityScore)}`}>
                    {feedback.adaptabilityScore}%
                  </span>
                </div>
                <Progress value={feedback.adaptabilityScore} className="h-2" />
              </div>

              {/* Stress Handling */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Stress Handling</span>
                  <span className={`font-bold ${getScoreColor(feedback.stressHandling)}`}>
                    {feedback.stressHandling}%
                  </span>
                </div>
                <Progress value={feedback.stressHandling} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.keyStrengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full ${getScoreBg(85)} text-white text-xs flex items-center justify-center flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{interview.duration}</p>
                <p className="text-sm text-gray-600">Minutes</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Interview Type</span>
                  <Badge variant="outline">{interview.interviewType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Difficulty</span>
                  <Badge variant={interview.difficulty === 'hard' ? 'destructive' : interview.difficulty === 'medium' ? 'default' : 'secondary'}>
                    {interview.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Role</span>
                  <span className="text-sm font-medium">{interview.role.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Resources */}
          {feedback.recommendedResources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recommended Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.recommendedResources.map((resource, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{resource.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{resource.description}</p>
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Learn More
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button 
                className="w-full"
                onClick={() => setLocation('/virtual-interview/new')}
              >
                <Brain className="h-4 w-4 mr-2" />
                Practice Again
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation(`/virtual-interview/${sessionId}`)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Review Conversation
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/virtual-interview/history')}
              >
                <Award className="h-4 w-4 mr-2" />
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}