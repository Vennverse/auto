import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Upload, FileText, AlertCircle, Star, TrendingUp } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

interface OnboardingStatus {
  onboardingCompleted: boolean;
  profileCompleteness: number;
  completedSteps: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    completed: boolean;
    label: string;
  }>;
  hasResume: boolean;
  atsScore: number | null;
}

interface ResumeAnalysis {
  atsScore: number;
  analysis: {
    recommendations: string[];
    keywordOptimization: {
      missingKeywords: string[];
      overusedKeywords: string[];
      suggestions: string[];
    };
    formatting: {
      score: number;
      issues: string[];
      improvements: string[];
    };
    content: {
      strengthsFound: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  };
}

const WORK_AUTH_OPTIONS = [
  { value: "citizen", label: "US Citizen" },
  { value: "permanent_resident", label: "Permanent Resident (Green Card)" },
  { value: "visa_required", label: "Require Visa Sponsorship" }
];

const WORK_MODE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" }
];

const NOTICE_PERIOD_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "2_months", label: "2 Months" }
];

const DEGREE_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "associates", label: "Associate's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "phd", label: "Ph.D." },
  { value: "other", label: "Other" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    retry: false,
  });

  // Fetch existing profile data
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  // Fetch resume analysis
  const { data: resumeAnalysis } = useQuery<ResumeAnalysis>({
    queryKey: ["/api/resume/analysis"],
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Redirect if onboarding is already completed
  useEffect(() => {
    if (onboardingStatus?.onboardingCompleted) {
      setLocation("/");
    }
  }, [onboardingStatus, setLocation]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Resume upload function
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Resume Analyzed",
        description: `ATS Score: ${result.analysis.atsScore}/100`,
      });

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Save current step data
      await profileMutation.mutateAsync(formData);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await profileMutation.mutateAsync({ ...formData, onboardingCompleted: true });
      
      // Invalidate queries to refresh user auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      // Force refetch user data to ensure onboarding status is updated
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Onboarding Complete!",
        description: "Your profile is ready for job applications.",
      });
      
      // Small delay to ensure all queries are updated before redirect
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: "basic_info",
      title: "Basic Information",
      description: "Tell us about yourself",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName || ""}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="professionalTitle">Professional Title *</Label>
            <Input
              id="professionalTitle"
              value={formData.professionalTitle || ""}
              onChange={(e) => handleInputChange("professionalTitle", e.target.value)}
              placeholder="Software Engineer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={formData.yearsExperience || ""}
                onChange={(e) => handleInputChange("yearsExperience", parseInt(e.target.value) || 0)}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl || ""}
                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary || ""}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="Brief description of your professional background and goals..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      )
    },
    {
      id: "work_auth",
      title: "Work Authorization",
      description: "Employment eligibility information",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="workAuthorization">Work Authorization Status *</Label>
            <Select
              value={formData.workAuthorization || ""}
              onValueChange={(value) => handleInputChange("workAuthorization", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your work authorization status" />
              </SelectTrigger>
              <SelectContent>
                {WORK_AUTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.workAuthorization === "visa_required" && (
            <div>
              <Label htmlFor="visaStatus">Current Visa Status</Label>
              <Input
                id="visaStatus"
                value={formData.visaStatus || ""}
                onChange={(e) => handleInputChange("visaStatus", e.target.value)}
                placeholder="F-1, H-1B, etc."
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresSponsorship"
              checked={formData.requiresSponsorship || false}
              onCheckedChange={(checked) => handleInputChange("requiresSponsorship", checked)}
            />
            <Label htmlFor="requiresSponsorship">
              I require visa sponsorship for employment
            </Label>
          </div>
        </div>
      )
    },
    {
      id: "location",
      title: "Location Details",
      description: "Where are you located and willing to work?",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentAddress">Current Address</Label>
            <Textarea
              id="currentAddress"
              value={formData.currentAddress || ""}
              onChange={(e) => handleInputChange("currentAddress", e.target.value)}
              placeholder="123 Main St, Apt 4B"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="San Francisco"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state || ""}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="CA"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode || ""}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="94102"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredWorkMode">Preferred Work Mode</Label>
              <Select
                value={formData.preferredWorkMode || ""}
                onValueChange={(value) => handleInputChange("preferredWorkMode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work preference" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-0 sm:pt-6">
              <Checkbox
                id="willingToRelocate"
                checked={formData.willingToRelocate || false}
                onCheckedChange={(checked) => handleInputChange("willingToRelocate", checked)}
              />
              <Label htmlFor="willingToRelocate">
                Willing to relocate
              </Label>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "resume",
      title: "Resume Upload & Analysis",
      description: "Upload your resume for ATS optimization",
      content: (
        <div className="space-y-6">
          {!onboardingStatus?.hasResume ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-gray-600 mb-4">
                Upload a PDF file to get instant ATS optimization feedback
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setResumeFile(file);
                    handleResumeUpload(file);
                  }
                }}
                disabled={isUploadingResume}
                className="max-w-xs mx-auto"
              />
              {isUploadingResume && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Analyzing resume...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Resume uploaded and analyzed</span>
              </div>
              
              {resumeAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">ATS Score:</span>
                      <Badge variant={(onboardingStatus?.atsScore || 0) >= 80 ? "default" : (onboardingStatus?.atsScore || 0) >= 60 ? "secondary" : "destructive"}>
                        {onboardingStatus?.atsScore || 'N/A'}/100
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {resumeAnalysis.analysis.content.strengthsFound.slice(0, 3).map((strength, index) => (
                          <div key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                            {strength}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {resumeAnalysis.analysis.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                            {rec}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: "preferences",
      title: "Job Preferences",
      description: "Set your salary expectations and availability",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="desiredSalaryMin">Minimum Salary (USD)</Label>
              <Input
                id="desiredSalaryMin"
                type="number"
                value={formData.desiredSalaryMin || ""}
                onChange={(e) => handleInputChange("desiredSalaryMin", parseInt(e.target.value) || 0)}
                placeholder="80000"
              />
            </div>
            <div>
              <Label htmlFor="desiredSalaryMax">Maximum Salary (USD)</Label>
              <Input
                id="desiredSalaryMax"
                type="number"
                value={formData.desiredSalaryMax || ""}
                onChange={(e) => handleInputChange("desiredSalaryMax", parseInt(e.target.value) || 0)}
                placeholder="120000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="noticePeriod">Notice Period</Label>
            <Select
              value={formData.noticePeriod || ""}
              onValueChange={(value) => handleInputChange("noticePeriod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your availability" />
              </SelectTrigger>
              <SelectContent>
                {NOTICE_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="highestDegree">Highest Degree</Label>
            <Select
              value={formData.highestDegree || ""}
              onValueChange={(value) => handleInputChange("highestDegree", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your highest degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="majorFieldOfStudy">Field of Study</Label>
              <Input
                id="majorFieldOfStudy"
                value={formData.majorFieldOfStudy || ""}
                onChange={(e) => handleInputChange("majorFieldOfStudy", e.target.value)}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input
                id="graduationYear"
                type="number"
                value={formData.graduationYear || ""}
                onChange={(e) => handleInputChange("graduationYear", parseInt(e.target.value) || 0)}
                placeholder="2020"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 text-sm sm:text-base px-2">
            Set up your profile to enable smart job matching and auto-fill features
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{steps[currentStep]?.title}</CardTitle>
            <CardDescription>{steps[currentStep]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {steps[currentStep]?.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={profileMutation.isPending}
            className="w-full sm:w-auto"
          >
            {profileMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : currentStep === steps.length - 1 ? (
              "Complete Setup"
            ) : (
              "Next"
            )}
          </Button>
        </div>

        {/* Completion Status */}
        {onboardingStatus && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Profile Completion Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {onboardingStatus.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={`text-sm ${step.completed ? 'text-green-700' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}