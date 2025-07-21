import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, MapPin, DollarSign, Users, Clock, Briefcase, Mail, CheckCircle, X } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function PostJob() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'auth' | 'verify' | 'post'>('auth');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationData, setVerificationData] = useState({
    email: "",
    companyName: "",
    companyWebsite: "",
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    companyName: "",
    companyLogo: "",
    location: "",
    workMode: "",
    jobType: "",
    experienceLevel: "",
    skills: [] as string[],
    minSalary: "",
    maxSalary: "",
    currency: "USD",
    benefits: "",
    requirements: "",
    responsibilities: "",
  });

  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    // Check for verification success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      // Refresh user data after verification with a slight delay to ensure database update is complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }, 1000);
      // Remove the verified param from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Check company verification status if user is authenticated
    const checkCompanyVerification = async () => {
      if (isAuthenticated && user?.id && user.id !== 'demo-user-id') {
        try {
          const response = await fetch(`/api/auth/company-verification/${user.id}`);
          const verification = await response.json();
          
          if (verification.isVerified) {
            setCurrentStep('post');
            // Set company name from verification data if available
            if (verification.companyName && !formData.companyName) {
              setFormData(prev => ({ ...prev, companyName: verification.companyName }));
            }
          } else {
            setCurrentStep('verify');
          }
        } catch (error) {
          console.error('Error checking verification:', error);
          // Fallback to user type check
          if ((user as any)?.userType === 'recruiter' && (user as any)?.emailVerified) {
            setCurrentStep('post');
          } else {
            setCurrentStep('verify');
          }
        }
      } else if (!isAuthenticated) {
        setCurrentStep('auth');
      } else if (user?.id === 'demo-user-id') {
        setCurrentStep('post');
      }
    };
    
    checkCompanyVerification();
  }, [isAuthenticated, user, queryClient]);

  const verificationMutation = useMutation({
    mutationFn: async (data: typeof verificationData) => {
      return await apiRequest("POST", "/api/auth/send-verification", data);
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Verification Email Sent",
        description: "Check your email and click the verification link to complete setup.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return await apiRequest("POST", "/api/recruiter/jobs", jobData);
    },
    onSuccess: () => {
      toast({
        title: "Job Posted Successfully",
        description: "Your job posting is now live and candidates can apply.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
      setLocation('/recruiter-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Post Job",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.companyName) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const jobData = {
      ...formData,
      minSalary: formData.minSalary ? parseInt(formData.minSalary) : null,
      maxSalary: formData.maxSalary ? parseInt(formData.maxSalary) : null,
    };

    createJobMutation.mutate(jobData);
  };

  // Authentication step
  if (currentStep === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              Post a Job
            </CardTitle>
            <CardDescription>
              Sign in to start posting jobs and find the perfect candidates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => setLocation('/auth')}
            >
              Sign in to Continue
            </Button>
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => setLocation('/')}
                className="text-sm"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification step
  if (currentStep === 'verify') {
    if (emailSent) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                Email Sent Successfully
              </CardTitle>
              <CardDescription>
                Check your email inbox for the verification link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  We've sent a verification link to <strong>{verificationData.email}</strong>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Click the link in your email to verify your company email and start posting jobs.
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setEmailSent(false);
                    verificationMutation.mutate(verificationData);
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={verificationMutation.isPending}
                >
                  {verificationMutation.isPending ? "Sending..." : "Resend Email"}
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/')}
                  className="text-sm"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="w-8 h-8 text-blue-600" />
              Verify Company Email
            </CardTitle>
            <CardDescription>
              To post jobs, verify your company email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              verificationMutation.mutate(verificationData);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Company Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={verificationData.email}
                  onChange={(e) => setVerificationData(prev => ({...prev, email: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company"
                  value={verificationData.companyName}
                  onChange={(e) => setVerificationData(prev => ({...prev, companyName: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  placeholder="company.com"
                  value={verificationData.companyWebsite}
                  onChange={(e) => setVerificationData(prev => ({...prev, companyWebsite: e.target.value}))}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={verificationMutation.isPending}
              >
                {verificationMutation.isPending ? "Sending..." : "Send Verification Email"}
              </Button>
            </form>
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => setLocation('/')}
                className="text-sm"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Job posting form
  if (currentStep === 'post') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/recruiter-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                  Post a New Job
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create a job posting to attract talented candidates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Provide the essential details about this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Senior Software Engineer"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="Your Company Inc."
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLogo">Company Logo URL</Label>
                    <Input
                      id="companyLogo"
                      placeholder="https://company.com/logo.png"
                      value={formData.companyLogo}
                      onChange={(e) => handleInputChange("companyLogo", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Job Details
                  </CardTitle>
                  <CardDescription>
                    Specify the location, work arrangement, and job type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="New York, NY or Remote"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workMode">Work Mode</Label>
                      <Select value={formData.workMode} onValueChange={(value) => handleInputChange("workMode", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobType">Job Type</Label>
                      <Select value={formData.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange("experienceLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead / Principal</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Required Skills
                  </CardTitle>
                  <CardDescription>
                    Add the key skills candidates should have
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., React, TypeScript, Python"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compensation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Compensation
                  </CardTitle>
                  <CardDescription>
                    Specify the salary range for this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minSalary">Min Salary</Label>
                      <Input
                        id="minSalary"
                        type="number"
                        placeholder="50000"
                        value={formData.minSalary}
                        onChange={(e) => handleInputChange("minSalary", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSalary">Max Salary</Label>
                      <Input
                        id="maxSalary"
                        type="number"
                        placeholder="100000"
                        value={formData.maxSalary}
                        onChange={(e) => handleInputChange("maxSalary", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Additional Details
                  </CardTitle>
                  <CardDescription>
                    Provide more context about the role and company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      placeholder="List the key requirements for this position..."
                      value={formData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibilities">Responsibilities</Label>
                    <Textarea
                      id="responsibilities"
                      placeholder="Describe the main responsibilities and duties..."
                      value={formData.responsibilities}
                      onChange={(e) => handleInputChange("responsibilities", e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits & Perks</Label>
                    <Textarea
                      id="benefits"
                      placeholder="Health insurance, stock options, flexible PTO, remote work allowance..."
                      value={formData.benefits}
                      onChange={(e) => handleInputChange("benefits", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/recruiter-dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createJobMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createJobMutation.isPending ? "Posting..." : "Post Job"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}