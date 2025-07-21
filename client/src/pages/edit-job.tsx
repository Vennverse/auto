import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, MapPin, DollarSign, Users, Clock, Briefcase, X } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EditJob() {
  const params = useParams();
  const jobId = params.id;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    isActive: true,
  });

  const [skillInput, setSkillInput] = useState("");

  // Fetch existing job data
  const { data: job, isLoading } = useQuery({
    queryKey: [`/api/recruiter/jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Update form data when job is loaded
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        companyName: job.companyName || "",
        companyLogo: job.companyLogo || "",
        location: job.location || "",
        workMode: job.workMode || "",
        jobType: job.jobType || "",
        experienceLevel: job.experienceLevel || "",
        skills: job.skills || [],
        minSalary: job.minSalary ? job.minSalary.toString() : "",
        maxSalary: job.maxSalary ? job.maxSalary.toString() : "",
        currency: job.currency || "USD",
        benefits: job.benefits || "",
        requirements: job.requirements || "",
        responsibilities: job.responsibilities || "",
        isActive: job.isActive !== false,
      });
    }
  }, [job]);

  const updateJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return await apiRequest("PUT", `/api/recruiter/jobs/${jobId}`, jobData);
    },
    onSuccess: () => {
      toast({
        title: "Job Updated Successfully",
        description: "Your job posting has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/recruiter/jobs/${jobId}`] });
      setLocation('/recruiter-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Job",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/recruiter/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted Successfully",
        description: "Your job posting has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
      setLocation('/recruiter-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Job",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
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

    updateJobMutation.mutate(jobData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      deleteJobMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The job posting you're trying to edit doesn't exist.</p>
          <Button onClick={() => setLocation('/recruiter-dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

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
                Edit Job Posting
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Update your job posting details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Status */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
                <CardDescription>
                  Control whether this job is visible to candidates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={formData.isActive ? "default" : "outline"}
                    onClick={() => handleInputChange("isActive", true)}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.isActive ? "default" : "outline"}
                    onClick={() => handleInputChange("isActive", false)}
                  >
                    Inactive
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the essential details about this position
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
                  Update the location, work arrangement, and job type
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
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
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
                      <SelectItem value="lead">Lead/Principal</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
                <CardDescription>
                  Add the key skills and technologies required for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill}>Add</Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
                    <Label htmlFor="minSalary">Minimum Salary</Label>
                    <Input
                      id="minSalary"
                      type="number"
                      placeholder="50000"
                      value={formData.minSalary}
                      onChange={(e) => handleInputChange("minSalary", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSalary">Maximum Salary</Label>
                    <Input
                      id="maxSalary"
                      type="number"
                      placeholder="80000"
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
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Provide more information about the role and company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="List the required qualifications, experience, and skills..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibilities">Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    placeholder="Describe the day-to-day responsibilities and key duties..."
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
            <div className="flex gap-4 justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
              </Button>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/recruiter-dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateJobMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateJobMutation.isPending ? "Updating..." : "Update Job"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}