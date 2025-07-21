import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Download, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Trash2,
  Crown,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Plus
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

export default function ResumesPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
  });

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
          description: `ATS Score: ${result.resume?.atsScore || 'Analyzing...'}% - Your resume has been analyzed and optimized.`,
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

  // Set active resume handler
  const setActiveResumeMutation = useMutation({
    mutationFn: async (resumeId: number) => {
      const response = await fetch(`/api/resumes/${resumeId}/set-active`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to set active resume');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Active Resume Updated",
        description: "This resume will now be used for job applications.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update active resume",
        variant: "destructive",
      });
    }
  });

  const downloadResume = async (resumeId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  if (isLoading || resumesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <motion.div 
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            variants={itemVariants}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Resume Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Upload, analyze, and manage your resumes with AI-powered ATS optimization
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload New Resume Card */}
            <motion.div 
              className="lg:col-span-1"
              variants={itemVariants}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload New Resume
                  </CardTitle>
                  <p className="text-sm text-green-100">
                    Add up to {user?.planType === 'premium' ? 'unlimited' : '2'} resumes with instant ATS analysis
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
                        className="bg-white/20 border-white/30 text-white file:bg-white/20 file:text-white file:border-0"
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Resume List */}
            <motion.div 
              className="lg:col-span-2 space-y-4"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Resumes</h2>
              
              {!resumes || (resumes as any).length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No resumes uploaded yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Upload your first resume to get started with AI-powered optimization
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(resumes as any).map((resume: any) => (
                    <motion.div
                      key={resume.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Card className={`border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${resume.isActive ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {resume.name}
                                </h3>
                                {resume.isActive && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${getScoreColor(resume.atsScore || 0)}`}>
                                    {resume.atsScore || 0}%
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">ATS Score</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {resume.analysis?.content?.strengthsFound?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Strengths</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {resume.analysis?.recommendations?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Improvements</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {resume.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Missing Keywords</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{(resume.fileSize / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedResume(resume);
                                  setShowAnalysisDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Analysis
                              </Button>
                              
                              {!resume.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveResumeMutation.mutate(resume.id)}
                                  disabled={setActiveResumeMutation.isPending}
                                >
                                  <Target className="h-4 w-4 mr-2" />
                                  Set Active
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadResume(resume.id, resume.fileName)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resume Analysis: {selectedResume?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed AI-powered analysis with ATS optimization recommendations
            </DialogDescription>
          </DialogHeader>
          
          {selectedResume && (
            <div className="space-y-6">
              {/* ATS Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Overall ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedResume.atsScore || 0)}`}>
                      {selectedResume.atsScore || 0}%
                    </div>
                    <Progress 
                      value={selectedResume.atsScore || 0} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Formatting Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedResume.analysis?.formatting?.score || 0)}`}>
                      {selectedResume.analysis?.formatting?.score || 0}%
                    </div>
                    <Progress 
                      value={selectedResume.analysis?.formatting?.score || 0} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Content Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedResume.analysis?.content?.strengthsFound?.length || 0}
                    </div>
                    <p className="text-sm text-gray-600">Strengths identified</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Strengths Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis?.content?.strengthsFound?.map((strength: string, index: number) => (
                      <div key={index} className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        {strength}
                      </div>
                    )) || <p className="text-gray-500">No specific strengths identified</p>}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-5 w-5" />
                      Improvement Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis?.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                        {rec}
                      </div>
                    )) || <p className="text-gray-500">No specific recommendations</p>}
                  </CardContent>
                </Card>

                {/* Missing Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Target className="h-5 w-5" />
                      Missing Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.analysis?.keywordOptimization?.missingKeywords?.map((keyword: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {keyword}
                        </Badge>
                      )) || <p className="text-gray-500">No missing keywords identified</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Keyword Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Plus className="h-5 w-5" />
                      Keyword Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.analysis?.keywordOptimization?.suggestions?.map((suggestion: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {suggestion}
                        </Badge>
                      )) || <p className="text-gray-500">No keyword suggestions available</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Formatting Issues */}
              {selectedResume.analysis?.formatting?.issues && selectedResume.analysis.formatting.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-5 w-5" />
                      Formatting Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis.formatting.issues.map((issue: string, index: number) => (
                      <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        {issue}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}