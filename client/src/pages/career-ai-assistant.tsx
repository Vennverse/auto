import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Lightbulb, 
  Calendar, 
  Star,
  BarChart3,
  Zap,
  ArrowRight,
  Clock,
  Trophy,
  Map,
  Sparkles
} from "lucide-react";

interface CareerInsight {
  type: 'path' | 'skill' | 'timing' | 'network' | 'analytics';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  actionItems: string[];
}

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  importance: number;
  learningResources: string[];
  timeToAcquire: string;
}

interface CareerPath {
  currentRole: string;
  targetRole: string;
  steps: Array<{
    position: string;
    timeline: string;
    requiredSkills: string[];
    averageSalary: string;
    marketDemand: string;
  }>;
  totalTimeframe: string;
  successProbability: number;
}

export default function CareerAIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [careerGoal, setCareerGoal] = useState("");
  const [timeframe, setTimeframe] = useState("2-years");
  const [location, setLocation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<CareerInsight[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [progressUpdate, setProgressUpdate] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState<any>(null);
  const [aiTier, setAiTier] = useState<'premium' | 'basic'>('basic');
  const [upgradeMessage, setUpgradeMessage] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState<number>(0);

  // Fetch user profile for AI analysis
  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  // Fetch user skills
  const { data: userSkills } = useQuery({
    queryKey: ['/api/skills'],
    enabled: !!user,
  });

  // Fetch user applications for behavioral analysis
  const { data: userApplications } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user,
  });

  // Fetch job analyses for pattern recognition
  const { data: jobAnalyses } = useQuery({
    queryKey: ['/api/jobs/analyses'],
    enabled: !!user,
  });

  // Load saved analysis on component mount
  useEffect(() => {
    if (user) {
      fetchSavedAnalysis();
    }
  }, [user]);

  const fetchSavedAnalysis = async () => {
    try {
      const response = await fetch('/api/career-ai/saved');
      if (response.ok) {
        const data = await response.json();
        // Set AI tier information
        setAiTier(data.aiTier || 'basic');
        setUpgradeMessage(data.upgradeMessage || "");
        setDaysLeft(data.daysLeft || 0);
        
        if (data.hasAnalysis) {
          setSavedAnalysis(data);
          setCareerGoal(data.careerGoal || "");
          setLocation(data.location || "");
          setTimeframe(data.timeframe || "");
          setCompletedTasks(data.completedTasks || []);
          setProgressUpdate(data.progressUpdate || "");
          
          // Set analysis results
          if (data.analysis) {
            setInsights(data.analysis.insights || []);
            setCareerPath(data.analysis.careerPath || null);
            setSkillGaps(data.analysis.skillGaps || []);
            setNetworkingOpportunities(data.analysis.networkingOpportunities || []);
            setMarketTiming(data.analysis.marketTiming || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching saved analysis:", error);
    }
  };

  // Generate comprehensive career analysis
  const generateCareerAnalysis = async () => {
    if (!userProfile || !careerGoal) {
      toast({
        title: "Missing Information",
        description: "Please complete your profile and specify a career goal",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/career-ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          careerGoal,
          timeframe,
          location,
          userProfile,
          userSkills: userSkills || [],
          userApplications: userApplications || [],
          jobAnalyses: jobAnalyses || [],
          completedTasks,
          progressUpdate
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Set AI tier information
        setAiTier(result.aiTier || 'basic');
        setUpgradeMessage(result.upgradeMessage || "");
        setDaysLeft(result.daysLeft || 0);
        
        setInsights(result.insights);
        setSkillGaps(result.skillGaps);
        setCareerPath(result.careerPath);
        
        // Clear progress update after successful analysis
        setProgressUpdate("");
        
        // Show upgrade message if trial expired
        if (result.upgradeMessage) {
          toast({
            title: "Premium AI Model Trial Ended",
            description: result.upgradeMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "Your personalized career insights are ready",
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Analysis failed");
      }
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
        return;
      }
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update progress when tasks are completed
  const updateProgress = async (newCompletedTasks: string[], newProgressUpdate: string = "") => {
    try {
      const response = await fetch('/api/career-ai/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completedTasks: newCompletedTasks,
          progressUpdate: newProgressUpdate
        }),
      });

      if (response.ok) {
        setCompletedTasks(newCompletedTasks);
        setProgressUpdate(newProgressUpdate);
        
        toast({
          title: "Progress Updated",
          description: "Your career progress has been saved",
        });
      } else {
        throw new Error("Failed to update progress");
      }
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle task completion
  const handleTaskCompletion = (taskId: string, completed: boolean) => {
    const newCompletedTasks = completed 
      ? [...completedTasks, taskId]
      : completedTasks.filter(id => id !== taskId);
    
    updateProgress(newCompletedTasks, progressUpdate);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'path': return <Map className="h-5 w-5" />;
      case 'skill': return <BookOpen className="h-5 w-5" />;
      case 'timing': return <Clock className="h-5 w-5" />;
      case 'network': return <Users className="h-5 w-5" />;
      case 'analytics': return <BarChart3 className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Personal Career AI Assistant
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Get personalized career guidance powered by AI. Analyze your career path, identify skill gaps, 
              optimize timing for moves, and discover networking opportunities.
            </p>
            
            {/* AI Tier Status Banner */}
            <div className="max-w-2xl mx-auto">
              {aiTier === 'premium' && daysLeft > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Premium AI Model Trial Active
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {daysLeft} days left of premium AI model access with advanced analysis capabilities
                  </p>
                </div>
              )}
              
              {upgradeMessage && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Premium AI Model Trial Ended
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {upgradeMessage}
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              )}
              
              {aiTier === 'basic' && !upgradeMessage && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Basic AI Model (llama-3.1-8b-instant)
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Using standard AI model. Upgrade to premium for advanced analysis with llama-3.3-70b-versatile
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Personal AI Career Assistant Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Personal AI Career Assistant
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by Groq AI ({aiTier === 'premium' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant'}) • Get personalized career guidance with location-specific insights
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Career Goal *
                  </label>
                  <Input
                    placeholder="e.g., Senior Data Scientist at Google"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Location (Optional)
                  </label>
                  <Input
                    placeholder="e.g., San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Timeframe
                  </label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-year">1 Year</SelectItem>
                      <SelectItem value="2-years">2 Years</SelectItem>
                      <SelectItem value="3-years">3 Years</SelectItem>
                      <SelectItem value="5-years">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateCareerAnalysis} 
                    disabled={isGenerating || !careerGoal}
                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Analyzing Your Career Path...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate AI Career Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                  <Map className="h-4 w-4" />
                  <span>Location-specific insights will include market data, salary ranges, and opportunities in {location}</span>
                </div>
              )}
              
              {/* Progress Update Section */}
              {insights.length > 0 && (
                <div className="space-y-3">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Update Your Progress</h4>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="What have you accomplished since your last analysis? (e.g., 'Completed Python course', 'Applied to 5 senior roles', 'Attended networking event')"
                        value={progressUpdate}
                        onChange={(e) => setProgressUpdate(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={generateCareerAnalysis}
                        disabled={isGenerating || !careerGoal}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Getting Updated Recommendations...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Get Updated Career Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {insights.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="path" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Career Path
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Skill Gaps
                </TabsTrigger>
                <TabsTrigger value="timing" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Market Timing
                </TabsTrigger>
                <TabsTrigger value="network" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Networking
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getInsightIcon(insight.type)}
                              <CardTitle className="text-base">{insight.title}</CardTitle>
                            </div>
                            <Badge className={`${getPriorityColor(insight.priority)} border-0`}>
                              {insight.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{insight.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {insight.timeframe}
                          </div>
                          {insight.actionItems.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium">Action Items:</p>
                              <ul className="text-xs space-y-1">
                                {insight.actionItems.slice(0, 2).map((item, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Career Path Tab */}
              <TabsContent value="path" className="space-y-6">
                {careerPath && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Your Personalized Career Path
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Success Probability: {careerPath.successProbability}%</span>
                        <span>Total Timeframe: {careerPath.totalTimeframe}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {careerPath.steps.map((step, index) => (
                          <div key={index} className="relative">
                            {index < careerPath.steps.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
                            )}
                            <div className="flex gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-bold">{index + 1}</span>
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{step.position}</h3>
                                  <p className="text-muted-foreground">{step.timeline}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium mb-1">Required Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                      {step.requiredSkills.slice(0, 3).map((skill, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">Average Salary</p>
                                    <p className="text-green-600 font-semibold">{step.averageSalary}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">Market Demand</p>
                                    <Badge variant={step.marketDemand === 'High' ? 'default' : 'secondary'}>
                                      {step.marketDemand}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Skill Gaps Tab */}
              <TabsContent value="skills" className="space-y-6">
                <div className="grid gap-6">
                  {skillGaps.map((gap, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            {gap.skill}
                          </CardTitle>
                          <Badge variant="outline">{gap.timeToAcquire}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Level</span>
                            <span>{gap.currentLevel}/10</span>
                          </div>
                          <Progress value={gap.currentLevel * 10} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Target Level</span>
                            <span>{gap.targetLevel}/10</span>
                          </div>
                          <Progress value={gap.targetLevel * 10} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Importance for Goal</span>
                            <span>{gap.importance}/10</span>
                          </div>
                          <Progress value={gap.importance * 10} className="h-2 bg-purple-100 dark:bg-purple-900/20" />
                        </div>
                        {gap.learningResources.length > 0 && (
                          <div>
                            <p className="font-medium mb-2">Recommended Learning Resources:</p>
                            <ul className="space-y-1">
                              {gap.learningResources.map((resource, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                                  {resource}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Market Timing Tab */}
              <TabsContent value="timing" className="space-y-6">
                {insights.filter(i => i.type === 'timing').map((insight, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {insight.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{insight.content}</p>
                      <div className="space-y-2">
                        <p className="font-medium">Recommended Actions:</p>
                        <ul className="space-y-2">
                          {insight.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Zap className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Networking Tab */}
              <TabsContent value="network" className="space-y-6">
                {insights.filter(i => i.type === 'network').map((insight, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {insight.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{insight.content}</p>
                      <div className="space-y-2">
                        <p className="font-medium">Networking Strategies:</p>
                        <ul className="space-y-2">
                          {insight.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Users className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}

          {/* Empty State */}
          {insights.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Plan Your Career?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Enter your career goal above and let our AI assistant create a personalized roadmap 
                  with actionable insights and recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}