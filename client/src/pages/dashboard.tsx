import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  TrendingUp, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Target,
  Briefcase,
  BookOpen,
  Lightbulb,
  Zap,
  Crown,
  Plus,
  Download,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Building,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3,
  TrendingDown,
  Filter,
  Search,
  Bell,
  Settings,
  MessageSquare,
  MessageCircle,
  Code,
  Brain,
  Trophy
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [showJobAnalysisDialog, setShowJobAnalysisDialog] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [coverJobDescription, setCoverJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [coverLetterResult, setCoverLetterResult] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    retry: false,
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: jobRecommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/jobs/recommendations"],
    retry: false,
  });

  const { data: jobPostings, isLoading: jobPostingsLoading } = useQuery({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const { data: recentAnalyses } = useQuery({
    queryKey: ["/api/jobs/analyses"],
    retry: false,
  });

  // Fetch test-related data for job seekers
  const { data: testAssignments } = useQuery({
    queryKey: ["/api/jobseeker/test-assignments"],
    retry: false,
  });

  const { data: rankingTestHistory } = useQuery({
    queryKey: ["/api/ranking-tests/history"],
    retry: false,
  });

  const { data: mockInterviewStats } = useQuery({
    queryKey: ["/api/mock-interview/stats"],
    retry: false,
  });

  // Job application mutation
  const applyToJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", `/api/applications`, jobData);
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to apply to job");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/stats"] });
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    }
  });

  // Enhanced job analysis
  const analyzeJob = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/jobs/analyze", {
        jobDescription,
        jobTitle,
        company: companyName,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        queryClient.invalidateQueries({ queryKey: ["/api/jobs/analyses"] });
        
        toast({
          title: "Analysis Complete",
          description: `Match score: ${result.matchScore}%`,
        });
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
      setIsAnalyzing(false);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!coverJobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/cover-letter/generate", {
        jobDescription: coverJobDescription,
        jobTitle,
        company: companyName,
      });

      if (response.ok) {
        const result = await response.json();
        setCoverLetterResult(result.coverLetter);
        
        toast({
          title: "Cover Letter Generated",
          description: "Your personalized cover letter is ready",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Generation failed");
      }
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
        return;
      }
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
        
        toast({
          title: "Resume Uploaded Successfully",
          description: `ATS Score: ${result.atsScore || 'Analyzing...'}% - Your resume has been analyzed and optimized.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload resume");
      }
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
        return;
      }
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <div key="modern-dashboard-2024" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {user?.userType === 'recruiter' ? <RecruiterNavbar user={user} /> : <Navbar />}
      
      <motion.div 
        className="w-full mx-auto px-4 py-4 sm:py-8 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Modern Welcome Header */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
              🚀 Welcome back, {user?.firstName || 'Job Seeker'}! 
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your AI-powered career acceleration platform
            </p>
          </div>
          
          {/* Key Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalApplications || 0}</div>
              <div className="text-blue-700 dark:text-blue-300 text-sm font-medium">Applications Sent</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.responseRate || 0}%</div>
              <div className="text-green-700 dark:text-green-300 text-sm font-medium">Response Rate</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.avgMatchScore || 0}%</div>
              <div className="text-purple-700 dark:text-purple-300 text-sm font-medium">Avg Match Score</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{testAssignments?.filter((t: any) => t.status === 'completed').length || 0}</div>
              <div className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">Tests Completed</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{rankingTestHistory?.length || 0}</div>
              <div className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">Ranking Tests</div>
            </div>
          </div>
        </motion.div>

        {/* Core Action Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          {[
            {
              title: "Technical Skills Practice",
              description: "Practice specific questions with instant feedback",
              icon: Code,
              color: "blue",
              action: () => setLocation('/mock-interview'),
              gradient: "from-blue-500 to-blue-600",
              badge: mockInterviewStats?.totalMockInterviews ? `${mockInterviewStats.totalMockInterviews} completed` : null
            },
            {
              title: "Assigned Tests",
              description: "Complete tests assigned by recruiters",
              icon: FileText,
              color: "indigo",
              action: () => setLocation('/job-seeker-tests'),
              gradient: "from-indigo-500 to-indigo-600",
              badge: testAssignments?.filter((t: any) => t.status === 'assigned').length ? `${testAssignments.filter((t: any) => t.status === 'assigned').length} pending` : null
            },
            {
              title: "Ranking Tests",
              description: "Compete with other candidates",
              icon: Trophy,
              color: "yellow",
              action: () => setLocation('/ranking-tests'),
              gradient: "from-yellow-500 to-orange-500",
              badge: rankingTestHistory?.length ? `${rankingTestHistory.length} taken` : null
            },
            {
              title: "Real Interview Simulation",
              description: "Conversational AI interview experience",
              icon: MessageCircle,
              color: "green",
              action: () => setLocation('/virtual-interview/new'),
              gradient: "from-green-500 to-emerald-600"
            },
            {
              title: "Resume Analysis",
              description: "AI-powered ATS optimization",
              icon: FileText,
              color: "purple",
              action: () => setLocation('/resumes'),
              gradient: "from-purple-500 to-purple-600"
            },
            {
              title: "Job Discovery",
              description: "Curated opportunities for you",
              icon: Search,
              color: "orange",
              action: () => setLocation('/jobs'),
              gradient: "from-orange-500 to-red-500"
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="relative cursor-pointer"
              onClick={card.action}
            >
              <Card className={`h-full border-0 shadow-lg overflow-hidden bg-gradient-to-br ${card.gradient} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-full bg-white/20">
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {card.title}
                      </h3>
                      {card.badge && (
                        <Badge className="bg-white/20 text-white text-xs border-white/30">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/80">
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Job Discovery Section */}
        <motion.div 
          className="mb-12"
          variants={itemVariants}
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Job Recommendations
                </CardTitle>
                <Button variant="outline" onClick={() => setLocation('/jobs')}>
                  View All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : jobRecommendations?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobRecommendations.slice(0, 6).map((job: any, index: number) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer"
                      onClick={() => setLocation(`/jobs/${job.id}`)}
                    >
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800 h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                              {job.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
                              <Building className="h-3 w-3" />
                              {job.company}
                            </p>
                          </div>
                          <Badge 
                            className={`${getMatchScoreBg(job.matchScore)} ${getMatchScoreColor(job.matchScore)} border-0 text-xs`}
                          >
                            {job.matchScore}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                          {job.description?.slice(0, 100)}...
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {job.postedDate}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No job recommendations yet</p>
                  <p className="text-sm text-gray-400">Complete your profile to get personalized recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Tools Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={itemVariants}
        >
          {/* AI Tools */}
          <div className="space-y-6">

            {/* Resume Upload & Analysis */}
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Resume Analysis
                  </CardTitle>
                  <p className="text-sm text-green-100">
                    Upload and optimize your resumes with AI-powered ATS scoring
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resumes uploaded:</span>
                    <span className="font-medium">
                      {(resumes as any)?.length || 0}/{user?.planType === 'premium' ? '∞' : '2'}
                    </span>
                  </div>
                  
                  {((resumes as any)?.length || 0) < (user?.planType === 'premium' ? 999 : 2) ? (
                    <div>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResumeUpload(file);
                          }
                        }}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                        disabled={isUploadingResume}
                      />
                      {isUploadingResume && (
                        <div className="mt-2 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mx-auto"></div>
                          <p className="text-xs mt-1 text-green-100">Analyzing resume...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-green-100 mb-2">
                        {user?.planType === 'premium' ? 'Unlimited uploads available' : 'Upload limit reached'}
                      </p>
                      {user?.planType !== 'premium' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => window.location.href = "/pricing"}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade for Unlimited
                        </Button>
                      )}
                    </div>
                  )}

                  {(resumes as any) && (resumes as any).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Latest Resume Analysis:</div>
                      <div className="bg-white/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{(resumes as any)[0]?.name || 'Resume'}</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              ((resumes as any)[0]?.atsScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                              ((resumes as any)[0]?.atsScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            ATS: {(resumes as any)[0]?.atsScore || 'N/A'}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-green-200">
                              {(resumes as any)[0]?.analysis?.content?.strengthsFound?.length || 0}
                            </div>
                            <div>Strengths</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-200">
                              {(resumes as any)[0]?.analysis?.recommendations?.length || 0}
                            </div>
                            <div>Tips</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-200">
                              {(resumes as any)[0]?.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                            </div>
                            <div>Missing</div>
                          </div>
                        </div>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => window.location.href = "/resumes"}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Job Analysis */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI Job Analysis
                </CardTitle>
                <p className="text-sm text-blue-100">
                  Analyze job compatibility and generate cover letters
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setShowJobAnalysisDialog(true)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Analyze Job Match
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setShowCoverLetterDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setLocation('/career-ai-assistant')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Career AI Assistant
                </Button>
              </CardContent>
            </Card>

            {/* Resume & Applications */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume & Applications
                </CardTitle>
                <p className="text-sm text-green-100">
                  Manage your resumes and track applications
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Active resumes:</span>
                  <span className="font-medium">
                    {(resumes as any)?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Applications sent:</span>
                  <span className="font-medium">
                    {stats?.totalApplications || 0}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setLocation('/resumes')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Manage Resumes
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setLocation('/applications')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Applications
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <div>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Recent Applications
                  </CardTitle>
                  <Button variant="outline" onClick={() => setLocation('/applications')}>
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : applications?.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app: any, index: number) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            app.status === 'interviewed' ? 'bg-green-500' :
                            app.status === 'pending' ? 'bg-yellow-500' :
                            app.status === 'rejected' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{app.jobTitle}</p>
                            <p className="text-xs text-gray-500">{app.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              app.status === 'interviewed' ? 'default' :
                              app.status === 'pending' ? 'secondary' :
                              app.status === 'rejected' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No applications yet</p>
                    <p className="text-sm text-gray-400">Start applying to jobs to track your progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Progress Section */}
          <div>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Test Progress & Assignments
                  </CardTitle>
                  <Button variant="outline" onClick={() => setLocation('/job-seeker-tests')}>
                    View All Tests
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {testAssignments?.length > 0 ? (
                  <div className="space-y-3">
                    {testAssignments.slice(0, 3).map((assignment: any, index: number) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            assignment.status === 'completed' ? 'bg-green-500' :
                            assignment.status === 'assigned' ? 'bg-yellow-500' :
                            assignment.status === 'started' ? 'bg-blue-500' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{assignment.testTemplate?.title || 'Coding Assessment'}</p>
                            <p className="text-xs text-gray-500">
                              From {assignment.recruiter?.firstName || 'Recruiter'} at {assignment.recruiter?.companyName || 'Company'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              assignment.status === 'completed' ? 'default' :
                              assignment.status === 'assigned' ? 'secondary' :
                              assignment.status === 'started' ? 'outline' :
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {assignment.status}
                          </Badge>
                          {assignment.status === 'assigned' && (
                            <Button 
                              size="sm" 
                              onClick={() => setLocation(`/test/${assignment.id}`)}
                              className="text-xs"
                            >
                              Start Test
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Ranking Tests Summary */}
                    {rankingTestHistory?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Recent Ranking Tests</h4>
                          <Button variant="ghost" size="sm" onClick={() => setLocation('/ranking-tests')}>
                            View Rankings
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rankingTestHistory.slice(0, 2).map((test: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{test.category || 'Tech Assessment'}</span>
                                <Badge variant="outline" className="text-xs">
                                  {test.score || 'N/A'}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No test assignments yet</p>
                    <p className="text-sm text-gray-400">Tests assigned by recruiters will appear here</p>
                    <Button 
                      variant="outline" 
                      className="mt-3" 
                      onClick={() => setLocation('/ranking-tests')}
                    >
                      Try Ranking Tests
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Job Analysis Dialog */}
      <Dialog open={showJobAnalysisDialog} onOpenChange={setShowJobAnalysisDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              AI Job Match Analysis
            </DialogTitle>
            <DialogDescription>
              Get detailed insights about how well you match with a specific job opportunity
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. TechCorp Inc"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={8}
              />
            </div>

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Analysis Results
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={analysisResult.matchScore} className="flex-1" />
                      <span className={`font-bold ${getMatchScoreColor(analysisResult.matchScore)}`}>
                        {analysisResult.matchScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recommendation</p>
                    <Badge 
                      variant={analysisResult.matchScore >= 70 ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {analysisResult.matchScore >= 70 ? "Apply Now" : "Consider Improvements"}
                    </Badge>
                  </div>
                </div>

                {analysisResult.matchingSkills?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                      Matching Skills ({analysisResult.matchingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.matchingSkills.slice(0, 8).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.missingSkills?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                      Skills to Develop ({analysisResult.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.missingSkills.slice(0, 6).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={analyzeJob} 
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Analyze Match
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowJobAnalysisDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Cover Letter Dialog */}
      <Dialog open={showCoverLetterDialog} onOpenChange={setShowCoverLetterDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              AI Cover Letter Generator
            </DialogTitle>
            <DialogDescription>
              Generate a personalized cover letter tailored to the specific job opportunity
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coverJobTitle">Job Title</Label>
                <Input
                  id="coverJobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="coverCompanyName">Company</Label>
                <Input
                  id="coverCompanyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. TechCorp Inc"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="coverJobDescription">Job Description</Label>
              <Textarea
                id="coverJobDescription"
                value={coverJobDescription}
                onChange={(e) => setCoverJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
              />
            </div>

            {coverLetterResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Generated Cover Letter
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetterResult);
                      toast({
                        title: "Copied!",
                        description: "Cover letter copied to clipboard",
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {coverLetterResult}
                  </pre>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateCoverLetter} 
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCoverLetterDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}