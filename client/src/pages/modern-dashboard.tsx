import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  GraduationCap,
  Award,
  Folder,
  PieChart,
  LineChart,
  Mail,
  Phone,
  Globe,
  Send,
  ExternalLink,
  Brain
} from "lucide-react";

export default function ModernDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Data queries
  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  const { data: applicationStats } = useQuery({
    queryKey: ["/api/applications/stats"],
    enabled: !!user,
  });

  const { data: resumes } = useQuery({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });

  const { data: jobRecommendations } = useQuery({
    queryKey: ["/api/jobs/recommendations"],
    enabled: !!user,
  });

  const { data: jobAnalyses } = useQuery({
    queryKey: ["/api/jobs/analyses"],
    enabled: !!user,
  });

  // Animation variants
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

  // Helper functions
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
      case 'interviewing':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userProfile?.firstName || 'Job Seeker'}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your job search dashboard
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                    <p className="text-3xl font-bold">{applicationStats?.totalApplications || 0}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Interviews</p>
                    <p className="text-3xl font-bold">{applicationStats?.interviews || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Response Rate</p>
                    <p className="text-3xl font-bold">
                      {applicationStats?.totalApplications > 0 
                        ? Math.round(((applicationStats?.interviews || 0) / applicationStats.totalApplications) * 100)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Resumes</p>
                    <p className="text-3xl font-bold">{resumes?.length || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Resume Analysis */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Resume Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {resumes && resumes.length > 0 ? (
                      <div className="space-y-4">
                        {resumes.map((resume: any, index: number) => (
                          <div key={resume.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{resume.name}</h3>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                ATS Score: {resume.atsScore || 'Analyzing...'}
                              </Badge>
                            </div>
                            {resume.atsScore && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">ATS Optimization</span>
                                  <span className="font-medium">{resume.atsScore}%</span>
                                </div>
                                <Progress value={resume.atsScore} className="h-2" />
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No resumes uploaded yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Upload your resume to get AI-powered analysis and optimization suggestions
                        </p>
                        <Button onClick={() => navigate('/resumes')} className="bg-blue-600 hover:bg-blue-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Career AI Assistant */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Career AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Powered by llama-3.3-70b-versatile
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        Get personalized career guidance, skill gap analysis, and market insights tailored to your profile.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-purple-600" />
                          <span>Career Path Planning</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                          <span>Skill Gap Analysis</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span>Market Timing</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-600" />
                          <span>Networking Opportunities</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        onClick={() => navigate('/career-ai-assistant')}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Get Career Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mock Interview Practice */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Mock Interview Practice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          AI-Powered Interview Simulation
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        Practice with realistic interview scenarios powered by AI. Get real-time feedback and improve your performance.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span>Technical Questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span>Behavioral Interview</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="w-3 h-3 text-blue-600" />
                          <span>System Design</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-600" />
                          <span>Performance Scoring</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        onClick={() => navigate('/mock-interview')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Mock Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Virtual AI Interview */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Virtual AI Interview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          Conversational AI Interviewer
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        Practice with our advanced AI interviewer in a natural chat format. Get real-time feedback and personalized questions.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Chat Interface</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-emerald-600" />
                          <span>AI Personalities</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Real-time Scoring</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>Detailed Feedback</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        onClick={() => navigate('/virtual-interview/new')}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Start Virtual Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Applications */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      Recent Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {applications && applications.length > 0 ? (
                      <div className="space-y-4">
                        {applications.slice(0, 5).map((app: any) => (
                          <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Building className="w-5 h-5 text-gray-500" />
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{app.jobTitle}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{app.company}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                              <span className="text-sm text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => navigate('/applications')}
                        >
                          View All Applications
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No applications yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Start your job search by exploring available positions
                        </p>
                        <Button onClick={() => navigate('/job-search')} className="bg-green-600 hover:bg-green-700">
                          <Search className="w-4 h-4 mr-2" />
                          Search Jobs
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/job-search')}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Jobs
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/resumes')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/profile')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Update Profile
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/virtual-interview/new')}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Virtual Interview
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/subscription')}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Profile Completion */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Profile Strength
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Basic info completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Resume uploaded</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">Add work experience</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tips */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Tips for Success
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Optimize Your Resume
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Use keywords from job descriptions to improve ATS compatibility
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          Apply Consistently
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Set a goal to apply to 3-5 jobs per day for better results
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          Follow Up
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Send a follow-up email 1-2 weeks after applying
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}